import { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert, AppState,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';

import AppHeader from '../../src/components/AppHeader';
import ReportBlockMenu from '../../src/components/ReportBlockMenu';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { imageViewer } from '../../src/utils/imageViewer';
import { ensureArray } from '../../src/utils/ensureArray';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import usePointStore from '../../src/store/pointStore';
import { matchApi } from '../../src/api/match';
import { showToast } from '../../src/utils/toast';

// ─── 헬퍼 함수 ────────────────────────────────────────────────────────────────

function getAgeDecade(birthDate) {
    if (!birthDate) return '';
    const birthYear = parseInt(String(birthDate).substring(0, 4));
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `${Math.floor(age / 10) * 10}대`;
}

function getGenderLabel(gender) {
    if (gender === 'M') return '남성';
    if (gender === 'F') return '여성';
    return '';
}

function getDday(driveDate) {
    if (!driveDate) return null;
    const diff = dayjs(driveDate).diff(dayjs().startOf('day'), 'day');
    if (diff === 0) return 'D-day';
    if (diff > 0) return `D-${diff}`;
    return null;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour < 12 ? '오전' : '오후';
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${ampm}${h12}시${m !== '00' ? ` ${m}분` : ''}`;
}

function formatGenderAge(genderArr, ageArr) {
    const genders = (genderArr || []).filter(g => g !== 'any');
    const ages = (ageArr || []).filter(a => a !== 'any')
        .sort((a, b) => parseInt(a) - parseInt(b));
    let genderText;
    if (genders.length === 0 || genders.length >= 2) {
        genderText = '남녀 무관';
    } else if (genders[0] === 'M') {
        genderText = '남성';
    } else {
        genderText = '여성';
    }
    const ageText = ages.length > 0
        ? ages.map(a => `${a}대`).join(',')
        : '전 연령';
    return `${genderText}, ${ageText}`;
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
    const { idx, matchType: paramMatchType } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(s => s.user);
    const { carTypes, driveTypes, matchTypes, driveLevels } = useConfigStore();
    const fetchBalance = usePointStore(s => s.fetchBalance);

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'applicants'
    const reviewPickerRef = useRef(null);

    const renderReviewBackdrop = useCallback(
        (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />,
        []
    );

    // ─── 데이터 로드 ───────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            loadDetail();
        }, [idx])
    );

    // 포그라운드 푸시 수신 시 같은 매칭이면 자동 갱신
    useEffect(() => {
        const matchIdxNum = Number(idx);
        const sub = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data || {};
            if (data.matchIdx && Number(data.matchIdx) === matchIdxNum) {
                loadDetail();
            }
        });
        return () => sub.remove();
    }, [idx]);

    // 백그라운드 → 포그라운드 복귀 시 자동 갱신
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') loadDetail();
        });
        return () => sub.remove();
    }, [idx]);

    async function loadDetail() {
        try {
            const res = await matchApi.getDetail(idx);
            setMatch(res.data);
        } catch {
            showToast('error', '매칭 정보를 불러오지 못했습니다.');
            router.back();
        } finally {
            setLoading(false);
        }
    }

    // ─── 신청하기 ──────────────────────────────────────────────────────────────
    function handleApply() {
        if (!checkProfileMatch()) {
            showToast('error', '신상정보가 모집 조건과 일치하지 않습니다.');
            return;
        }
        router.navigate({ pathname: '/match/apply', params: { matchIdx: idx } });
    }

    // 신청자 신상정보(성별/연령)가 매칭 모집 조건과 일치하는지
    function checkProfileMatch() {
        if (!match || !user) return false;
        const applicantRole = match.matchType === 'group'
            ? user.role
            : (match.authorRole === 'owner' ? 'guest' : 'owner');
        const targetGender = applicantRole === 'owner' ? match.ownerGender : match.guestGender;
        const targetAge = applicantRole === 'owner' ? match.ownerAge : match.guestAge;
        const reqGenders = Array.isArray(targetGender) ? targetGender : [];
        const reqAges = Array.isArray(targetAge) ? targetAge : [];

        const genderRequired = reqGenders.length > 0 && !reqGenders.includes('any');
        if (genderRequired && !reqGenders.includes(user.gender)) return false;

        let userAgeGroup = null;
        if (user.birthDate) {
            const currentYear = new Date().getFullYear();
            const age = currentYear - parseInt(String(user.birthDate).slice(0, 4));
            // [P-6] 60대 그룹 제거 — 50세 이상은 모두 '50' 그룹으로 매칭
            if (age >= 20 && age < 30) userAgeGroup = '20';
            else if (age < 40) userAgeGroup = '30';
            else if (age < 50) userAgeGroup = '40';
            else if (age >= 50) userAgeGroup = '50';
        }
        const ageRequired = reqAges.length > 0 && !reqAges.includes('any');
        if (ageRequired && (!userAgeGroup || !reqAges.includes(userAgeGroup))) return false;
        return true;
    }

    // ─── 후기쓰기 ──────────────────────────────────────────────────────────────
    function buildPartnerQuery(partner) {
        const params = new URLSearchParams();
        params.set('matchIdx', String(idx));
        params.set('targetUserIdx', String(partner.idx ?? ''));
        params.set('targetNickname', partner.nickname || '');
        if (partner.role) params.set('targetRole', partner.role);
        if (partner.gender) params.set('targetGender', partner.gender);
        if (partner.birthDate) params.set('targetBirthDate', partner.birthDate);
        if (partner.driveLevel) params.set('targetDriveLevel', partner.driveLevel);
        if (partner.profileImage) params.set('targetProfileImage', partner.profileImage);
        return '?' + params.toString();
    }

    function navigateMannerEval(partner) {
        router.navigate('/review/manner-eval' + buildPartnerQuery(partner));
    }

    function navigateReviewWrite(partner) {
        router.navigate('/review/write' + buildPartnerQuery(partner));
    }

    // 매너평가(리뷰쓰기) — 미평가 대상 1명이면 직접, 2명+이면 선택 시트
    function handleManner() {
        const partners = Array.isArray(match?.evalPartners) ? match.evalPartners : [];
        const pending = partners.filter(p => p.needsEvaluation);
        if (pending.length === 0) {
            showToast('info', '모든 상대에 대한 평가를 완료했습니다.');
            return;
        }
        if (pending.length === 1) {
            navigateMannerEval(pending[0]);
            return;
        }
        reviewPickerRef.current?.present();
    }

    // 드라이브 후기쓰기 — 매칭당 1건. 매너평가 1건 이상 작성 후에만 활성화 (서버 needsReview)
    function handleReviewWrite() {
        const partners = Array.isArray(match?.evalPartners) ? match.evalPartners : [];
        if (!match?.needsReview) {
            showToast('info', '이미 후기를 작성하셨거나 평가 후 작성 가능합니다.');
            return;
        }
        const target = partners[0] || { idx: 0, nickname: '' };
        navigateReviewWrite(target);
    }

    function pickReviewPartner(partner) {
        reviewPickerRef.current?.dismiss();
        setTimeout(() => navigateMannerEval(partner), 200);
    }

    // ─── 신청취소 ──────────────────────────────────────────────────────────────
    async function handleCancel() {
        if (actionLoading) return;
        Alert.alert('신청 취소', '매칭 신청을 취소하시겠습니까?\n신청 비용 3,000P는 무료포인트로 환급됩니다.', [
            { text: '닫기', style: 'cancel' },
            {
                text: '취소하기', style: 'destructive', onPress: async () => {
                    setActionLoading({ type: 'cancel' });
                    try {
                        const res = await matchApi.cancel(Number(idx));
                        if (res.data?.newBalance !== null && res.data?.newBalance !== undefined) {
                            fetchBalance();
                        }
                        showToast('success', '신청이 취소되었습니다.');
                        loadDetail();
                    } catch (e) {
                        showToast('error', e?.response?.data?.message || '취소에 실패했습니다.');
                    } finally {
                        setActionLoading(null);
                    }
                }
            },
        ]);
    }

    // ─── 수락 ──────────────────────────────────────────────────────────────────
    async function handleAccept(participantIdx, participantNickname) {
        // 1:1/그룹 구분 없이 포인트 차감 확인 화면으로 이동 (matchType 전달 — 수락 후 채팅방 이동 분기용)
        router.navigate({
            pathname: '/match/point-use',
            params: {
                matchIdx: Number(idx),
                participantIdx,
                participantNickname,
                matchType: match?.matchType,
            },
        });
    }

    // ─── 거절 ──────────────────────────────────────────────────────────────────
    async function handleReject(participantIdx, participantNickname) {
        if (actionLoading) return;
        Alert.alert(
            '신청 거절',
            `${participantNickname}님의 신청을 거절하시겠습니까?`,
            [
                { text: '닫기', style: 'cancel' },
                {
                    text: '거절하기',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading({ type: 'reject', participantIdx });
                        try {
                            await matchApi.reject(Number(idx), participantIdx);
                            showToast('success', '신청을 거절했습니다.');
                            loadDetail();
                        } catch (e) {
                            showToast('error', e?.response?.data?.message || '거절에 실패했습니다.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    }

    // ─── 수정 ──────────────────────────────────────────────────────────────────
    // 수정 가능 조건(전부 만족): status=pending && 모집 마감 전 && 신청자(requested|accepted) 0명
    function computeRecruitClosed(m) {
        if (!m) return false;
        if (m.recruitClosedAt && new Date() > new Date(m.recruitClosedAt)) return true;
        if (m.driveDate && m.driveStartTime) {
            const startAt = new Date(`${m.driveDate}T${m.driveStartTime}+09:00`);
            if (!isNaN(startAt.getTime())) {
                return new Date() >= new Date(startAt.getTime() - 60 * 60 * 1000);
            }
        }
        return false;
    }

    function handleEdit() {
        if (['completed', 'cancelled', 'no_show'].includes(match?.status)) {
            showToast('error', '종료된 매칭은 수정할 수 없습니다.');
            return;
        }
        if (match?.status !== 'pending') {
            showToast('error', '현재 상태에서는 수정할 수 없습니다.');
            return;
        }
        if (computeRecruitClosed(match)) {
            showToast('error', '모집이 마감된 매칭은 수정할 수 없습니다.');
            return;
        }
        const hasAnyApplicant = (match?.participants || []).some(p => ['requested', 'accepted'].includes(p.status));
        if (hasAnyApplicant) {
            showToast('error', '신청자가 있어 수정할 수 없습니다.');
            return;
        }
        router.navigate({ pathname: '/match/create', params: { editIdx: idx } });
    }

    // ─── 삭제 ──────────────────────────────────────────────────────────────────
    function handleDelete() {
        if (['completed', 'cancelled', 'no_show'].includes(match?.status)) {
            showToast('error', '종료된 매칭은 삭제할 수 없습니다.');
            return;
        }
        const hasAnyApplicant = match?.participants?.some(p => ['requested', 'accepted'].includes(p.status));
        if (hasAnyApplicant) {
            showToast('error', '신청자가 있어 삭제할 수 없습니다.');
            return;
        }
        Alert.alert(
            '매칭 삭제',
            '매칭을 삭제하시겠습니까?\n삭제 후 복구가 불가합니다.',
            [
                { text: '닫기', style: 'cancel' },
                {
                    text: '삭제하기',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading({ type: 'delete' });
                        try {
                            await matchApi.deleteMatch(Number(idx));
                            showToast('success', '매칭이 삭제되었습니다.');
                            router.back();
                        } catch (e) {
                            showToast('error', e?.response?.data?.message || '삭제에 실패했습니다.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    }

    // ─── 파생 상태 계산 ────────────────────────────────────────────────────────
    function getParticipantStatus() {
        if (!match || !user) return null;
        const activeStatuses = ['accepted', 'requested', 'rejected'];
        const records = (match.participants || []).filter(
            p => p.userIdx === user.idx && activeStatuses.includes(p.status)
        );
        // 재신청 시 최신 레코드(idx 내림차순)를 우선 반환
        records.sort((a, b) => b.idx - a.idx);
        return records[0]?.status || null;
    }

    function isMine() {
        return match?.authorIdx === user?.idx;
    }

    // 헤더 타이틀: query param matchType 우선 사용 → 진입 즉시 정확한 타이틀 노출
    const headerTitle = (() => {
        const t = match?.matchType || paramMatchType;
        if (t === 'one_to_one') return '1:1매칭';
        if (t === 'group') return '모임매칭';
        return '매칭 상세';
    })();

    // ─── 로딩 ──────────────────────────────────────────────────────────────────
    if (loading || !match) {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <AppHeader title={headerTitle} onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    const { author } = match;
    const participantStatus = getParticipantStatus();
    const mine = isMine();
    const matchEnded = match.status === 'completed' || match.status === 'cancelled' || match.status === 'no_show';
    const recruitClosed = (() => {
        if (match.recruitClosedAt && new Date() > new Date(match.recruitClosedAt)) return true;
        if (match.driveDate && match.driveStartTime) {
            const startAt = new Date(`${match.driveDate}T${match.driveStartTime}+09:00`);
            if (!isNaN(startAt.getTime())) {
                return new Date() >= new Date(startAt.getTime() - 60 * 60 * 1000);
            }
        }
        return false;
    })();

    // 신청자 목록 (requested + accepted + rejected)
    // 신청자 탭: 수락(accepted)은 미노출, 새 신청(requested) 위로 / 거절(rejected) 아래로 정렬 (최신순)
    const STATUS_ORDER = { requested: 0, rejected: 1 };
    const applicants = (match.participants || [])
        .filter(p => ['requested', 'rejected'].includes(p.status))
        .sort((a, b) => {
            const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
            if (so !== 0) return so;
            return b.idx - a.idx;
        });
    const requestedCount = applicants.filter(p => p.status === 'requested').length;

    // 라벨 계산
    const driveTypLabels = ensureArray(match.driveTypes).map(key => {
        const item = driveTypes.find(d => d.key === key);
        return item ? item.label : key;
    });
    const matchTypeLabel = matchTypes.find(m => m.key === match.matchType)?.label || match.matchType;
    const driveLevelLabel = (driveLevels.find(d => d.key === author?.ownerProfile?.driveLevel)?.label || '')
        .replace(/\s*\(.*\)$/, '');

    // 날짜 표시
    const driveDateFormatted = match.driveDate
        ? dayjs(match.driveDate).format('YYYY.MM.DD(ddd)')
        : '';
    // [M1] 종료 < 시작이면 익일 종료 표기
    const timeRange = match.driveStartTime && match.driveEndTime
        ? `${formatTime(match.driveStartTime)}~${match.driveEndTime < match.driveStartTime ? '익일 ' : ''}${formatTime(match.driveEndTime)}`
        : '';
    const dday = getDday(match.driveDate);

    // 만나는 곳 / 목적지 — 모든 항목 쉼표로 표시
    const regionArr = match.meetingRegions || [];
    const meetingRegionText = regionArr
        .map(r => [r.sido, r.sigungu].filter(Boolean).join(' '))
        .filter(Boolean)
        .join(', ');
    const destArr = match.destinations || [];
    const destinationText = destArr
        .map(r => r.sigungu || r.sido || '')
        .filter(Boolean)
        .join(', ');

    // 게스트/오너 조건
    const isGroupMatch = match.matchType === 'group';
    const guestCondition = formatGenderAge(ensureArray(match.guestGender), ensureArray(match.guestAge));
    const ownerCondition = formatGenderAge(ensureArray(match.ownerGender), ensureArray(match.ownerAge));

    // 1:1: 상대방 역할 조건만 표시 (성별/연령 + 인원 1명)
    const conditionLabel = match.authorRole === 'owner' ? '게스트' : '오너';
    const conditionText = `${match.authorRole === 'owner' ? guestCondition : ownerCondition}, 총 1명`;

    // 모임매칭: 오너/게스트 모집인원 텍스트
    const ownerCountText = (match.ownerMaxCount || 0) > 0 ? `, 총 ${match.ownerMaxCount}명` : '';
    const guestCountText = (match.guestMaxCount || 0) > 0 ? `, 총 ${match.guestMaxCount}명` : '';

    // 등록일
    const createdAt = match.createdAt
        ? dayjs(match.createdAt).format('YYYY.MM.DD HH:mm')
        : '';

    // 조회수 포맷
    const viewCountText = (match.viewCount || 0).toLocaleString();

    // 사진 목록
    const photos = match.photos || [];
    const BOTTOM_BAR_HEIGHT = 92;

    // 확정/미확정 인원 카드 데이터
    const acceptedParticipants = (match.participants || []).filter(p => p.status === 'accepted');
    const pendingParticipants = (match.participants || []).filter(p => p.status === 'requested');

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <AppHeader
                title={headerTitle}
                onBack={() => router.back()}
                rightComponent={
                    mine && !matchEnded ? (
                        // 작성자 모드: 수정 + 삭제 버튼 (종료된 매칭 제외)
                        // 수정 버튼 노출 조건: pending + 모집 마감 전 + 신청자 0명 (모두 만족)
                        (() => {
                            const hasAnyApplicant = (match.participants || []).some(p => ['requested', 'accepted'].includes(p.status));
                            const canEdit = match.status === 'pending' && !recruitClosed && !hasAnyApplicant;
                            return (
                        <View style={styles.authorHeaderBtns}>
                            {canEdit && (
                                <TouchableOpacity
                                    testID="match-detail-edit-btn"
                                    style={styles.editBtn}
                                    onPress={handleEdit}
                                    disabled={!!actionLoading}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={styles.editBtnText} allowFontScaling={false}>수정</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                testID="match-detail-delete-btn"
                                onPress={handleDelete}
                                disabled={!!actionLoading}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.deleteBtnText} allowFontScaling={false}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                            );
                        })()
                    ) : !mine ? (
                        <ReportBlockMenu
                            targetIdx={match.authorIdx}
                            targetNickname={match.author?.nickname}
                            matchIdx={match.idx}
                            reportType="post"
                        >
                            <View
                                testID="match-detail-report-btn"
                                style={styles.reportMenuBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.reportMenuBtnText} allowFontScaling={false}>⋯</Text>
                            </View>
                        </ReportBlockMenu>
                    ) : null
                }
            />

            {/* 작성자 모드: 탭 바 */}
            {mine && (
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        testID="match-detail-tab-info"
                        style={[styles.tabItem, activeTab === 'info' && styles.tabItemActive]}
                        onPress={() => setActiveTab('info')}
                    >
                        <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]} allowFontScaling={false}>
                            매칭 정보
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="match-detail-tab-applicants"
                        style={[styles.tabItem, activeTab === 'applicants' && styles.tabItemActive]}
                        onPress={() => setActiveTab('applicants')}
                    >
                        <Text style={[styles.tabText, activeTab === 'applicants' && styles.tabTextActive]} allowFontScaling={false}>
                            {'신청자 '}
                            <Text style={{ color: activeTab === 'applicants' ? COLORS.primary : COLORS.textDisabled, fontFamily: FONTS.extraBold }}>
                                {applicants.length}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 스크롤 콘텐츠 */}
            {(!mine || activeTab === 'info') ? (
                // ── 매칭 정보 탭 ──
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: mine ? (insets.bottom + SPACING.xxxxl) : (BOTTOM_BAR_HEIGHT + insets.bottom + SPACING.xl) },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* NO번호 */}
                    {/* <Text style={styles.noText} testID="match-detail-no" allowFontScaling={false}>
                        NO.{String(match.idx).padStart(10, '0')}
                    </Text> */}

                    {/* 등록일 + 조회수 */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText} allowFontScaling={false}>등록일: {createdAt}</Text>
                        <View style={styles.viewRow}>
                            <Image
                                source={require('../../assets/icons/view.svg')}
                                style={styles.viewIcon}
                            />
                            <Text style={styles.metaText} allowFontScaling={false}>{viewCountText}</Text>
                        </View>
                    </View>

                    {/* 작성자 프로필 카드 */}
                    <View style={[styles.profileCard, mine && styles.profileCardMine]}>
                        {/* 상단: 아바타 + 닉네임/뱃지/태그 + 매너점수 */}
                        <View style={styles.profileTop}>
                            <View style={styles.profileLeft}>
                                {/* 아바타 */}
                                <View style={styles.avatarWrap}>
                                    {author?.profileImage ? (
                                        <Image
                                            source={{ uri: STORAGE_URL + author.profileImage }}
                                            style={styles.avatar}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <Image
                                            source={require('../../assets/icons/profile-avatar.svg')}
                                            style={styles.avatar}
                                            contentFit="cover"
                                        />
                                    )}
                                </View>
                                {/* 닉네임 + 뱃지 + 태그 */}
                                <View style={styles.profileInfo}>
                                    <View style={styles.nicknameRow}>
                                        <Text style={styles.nickname} numberOfLines={1} allowFontScaling={false}>{author?.nickname}</Text>
                                        <View style={[styles.roleBadge, { backgroundColor: author?.role === 'owner' ? COLORS.secondary : COLORS.safety }]}>
                                            <Text style={styles.roleBadgeText} allowFontScaling={false}>
                                                {author?.role === 'owner' ? '오너' : '게스트'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.tagRow}>
                                        {getAgeDecade(author?.birthDate) ? (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText} allowFontScaling={false}>{getAgeDecade(author?.birthDate)}</Text>
                                            </View>
                                        ) : null}
                                        {getGenderLabel(author?.gender) ? (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText} allowFontScaling={false}>{getGenderLabel(author?.gender)}</Text>
                                            </View>
                                        ) : null}
                                        {driveLevelLabel ? (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText} allowFontScaling={false}>{driveLevelLabel}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </View>

                            {/* 매너점수 */}
                            <View style={styles.mannerCol}>
                                <View style={styles.mannerScoreRow}>
                                    <Image
                                        source={require('../../assets/icons/smile.svg')}
                                        style={styles.smileIcon}
                                        contentFit="contain"
                                    />
                                    <Text style={styles.mannerScore} allowFontScaling={false}>
                                        {author?.mannerScore != null ? Math.round(Number(author.mannerScore)) : '-'}
                                    </Text>
                                </View>
                                <Text style={styles.mannerLabel} allowFontScaling={false}>매너점수</Text>
                            </View>
                        </View>

                        {/* 구분선 */}
                        <View style={styles.divider} />

                        {/* 오너 차종 (오너인 경우만) */}
                        {author?.role === 'owner' && author?.cars?.length > 0 && (
                            <View style={styles.carSection}>
                                <Text style={styles.carSectionLabel} allowFontScaling={false}>소유 차종</Text>
                                <View style={styles.carList}>
                                    {author.cars.map((car, i) => {
                                        const ct = carTypes.find(c => c.key === car.carType);
                                        return (
                                            <View key={i} style={styles.carRow}>
                                                <View style={styles.carTypeBadge}>
                                                    <Text style={styles.carTypeBadgeText} allowFontScaling={false}>
                                                        {ct?.label || car.carType}
                                                    </Text>
                                                </View>
                                                <Text style={styles.carModel} allowFontScaling={false}>{car.carModel}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* 매칭수 · 리뷰수 + 프로필보기 */}
                        <View style={styles.statsRow}>
                            <View style={styles.statsLeft}>
                                <Text style={styles.statsText} allowFontScaling={false}>매칭 {author?.matchCount ?? 0}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.statsText} allowFontScaling={false}>리뷰 {author?.reviewCount ?? 0}</Text>
                            </View>
                            {!isMine() && (
                                <TouchableOpacity
                                    testID="match-detail-profile-btn"
                                    style={styles.profileViewBtn}
                                    onPress={() => router.navigate(`/profile/${author?.idx}`)}
                                    hitSlop={8}
                                >
                                    <Text style={styles.profileViewText} allowFontScaling={false}>프로필보기</Text>
                                    <Image
                                        source={require('../../assets/icons/chevron-right.svg')}
                                        style={styles.chevronIcon}
                                        contentFit="contain"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 노쇼 · 신고 카운트 */}
                        <View testID="match-detail-noshow-row" style={styles.noshowRow}>
                            <Text style={styles.noshowText} allowFontScaling={false}>
                                노쇼 <Text style={styles.noshowCount}>{author?.noshowCount ?? 0}</Text>
                            </Text>
                            <View style={styles.dot} />
                            <Text style={styles.noshowText} allowFontScaling={false}>
                                신고 <Text style={styles.noshowCount}>{author?.reportCount ?? 0}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* 드라이브 정보 카드 */}
                    <View style={styles.infoCard}>
                        {/* 제목 */}
                        <Text style={styles.infoTitle} allowFontScaling={false}>
                            {match.authorRole === 'owner' ? '오너님이 원하는, 드라이브' : '게스트님이 원하는, 드라이브'}
                        </Text>

                        <View style={styles.infoRows}>
                            {/* 만나는 곳 */}
                            {meetingRegionText ? (
                                <InfoRow label="만나는곳" value={meetingRegionText} />
                            ) : null}

                            {/* 목적지 */}
                            {destinationText ? (
                                <InfoRow label="목적지" value={destinationText} />
                            ) : null}

                            {/* 날짜 */}
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel} allowFontScaling={false}>날짜</Text>
                                <View style={styles.infoValueRow}>
                                    <Text style={styles.infoValue} allowFontScaling={false}>{driveDateFormatted}</Text>
                                    {dday ? (
                                        <View style={styles.ddayBadge}>
                                            <Text style={styles.ddayText} allowFontScaling={false}>{dday}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>

                            {/* 시작~종료 */}
                            {timeRange ? <InfoRow label="시작~종료" value={timeRange} /> : null}

                            {/* 매칭 유형 */}
                            <InfoRow label="유형" value={matchTypeLabel} />

                            {/* 오너/게스트 조건 */}
                            {isGroupMatch ? (
                                <>
                                    {(match.ownerMaxCount || 0) > 0 && (
                                        <InfoRow label="오너" value={`${ownerCondition}${ownerCountText}`} />
                                    )}
                                    {(match.guestMaxCount || 0) > 0 && (
                                        <InfoRow label="게스트" value={`${guestCondition}${guestCountText}`} />
                                    )}
                                </>
                            ) : (
                                <InfoRow label={conditionLabel} value={conditionText} />
                            )}

                            {/* 차종 표시 (게스트 작성 또는 모임매칭) */}
                            {/* {(match.authorRole === 'guest' || isGroupMatch) && match?.carTypes?.length > 0 && (
                                <InfoRow
                                    label="차종"
                                    value={(match.carTypes || []).map(k => {
                                        const ct = carTypes.find(c => c.key === k);
                                        return ct?.label || k;
                                    }).join(', ')}
                                />
                            )} */}

                            {/* 드라이브 타입 */}
                            {driveTypLabels.length > 0 && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel} allowFontScaling={false}>타입</Text>
                                    <View style={styles.typeTagsWrap}>
                                        {driveTypLabels.map((label, i) => (
                                            <View key={i} style={styles.typeTag}>
                                                <Text style={styles.typeTagText} allowFontScaling={false}>{label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* 제목 */}
                            {match.title?.trim() ? (
                                <Text style={styles.matchTitleText} allowFontScaling={false}>{match.title}</Text>
                            ) : null}

                            {/* 소개글 */}
                            {match.content ? (
                                <Text style={styles.content} allowFontScaling={false}>{match.content}</Text>
                            ) : null}
                        </View>
                    </View>

                    {/* 사진 갤러리 */}
                    {photos.length > 0 && (
                        <PhotoGallery
                            photos={photos}
                            onPhotoPress={(i) => imageViewer({
                                index: i,
                                list: photos.map(p => STORAGE_URL + p.imageUrl),
                            })}
                        />
                    )}

                    {/* 작성자 모드: 확정/미확정 인원 카드 */}
                    {mine && (
                        <ParticipantSummaryCard
                            match={match}
                            driveLevels={driveLevels}
                            onProfilePress={(userIdx) => router.navigate(`/profile/${userIdx}`)}
                        />
                    )}
                </ScrollView>
            ) : (
                // ── 신청자 탭 ──
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + SPACING.xxxxl },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {applicants.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText} allowFontScaling={false}>신청자가 없습니다.</Text>
                        </View>
                    ) : (
                        applicants.map((p, i) => (
                            <ApplicantCard
                                key={p.idx}
                                participant={p}
                                carTypes={carTypes}
                                driveLevels={driveLevels}
                                actionLoading={actionLoading}
                                onAccept={() => handleAccept(p.idx, p.user?.nickname || '참여자')}
                                onReject={() => handleReject(p.idx, p.user?.nickname || '참여자')}
                                onProfilePress={(userIdx) => router.navigate(`/profile/${userIdx}`)}
                                testID={`match-detail-applicant-${i}`}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            {/* 하단 고정 버튼 (게스트 모드만) */}
            {(!mine || matchEnded) && (
                <BottomBar
                    isAuthor={mine}
                    participantStatus={participantStatus}
                    matchEnded={matchEnded}
                    recruitClosed={recruitClosed}
                    matchStatus={match.status}
                    matchType={match.matchType}
                    actionLoading={actionLoading}
                    chatRoomIdx={match.chatRoomIdx}
                    canManner={Array.isArray(match.evalPartners) && match.evalPartners.some(p => p.needsEvaluation)}
                    canReviewWrite={!!match.needsReview}
                    onApply={handleApply}
                    onCancel={handleCancel}
                    onChat={() => router.navigate(`/chat/${match.chatRoomIdx}`)}
                    onManner={handleManner}
                    onReviewWrite={handleReviewWrite}
                    insets={insets}
                />
            )}

            {/* 작성자 모드 — 채팅방 이동 고정 바 */}
            {mine && !matchEnded && match.chatRoomIdx && (
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
                    <View style={styles.bottomInner}>
                        <Text style={styles.acceptedText} allowFontScaling={false}>참여자와 대화해보세요.</Text>
                        <TouchableOpacity
                            testID="match-detail-author-chat-button"
                            style={styles.chatBtn}
                            onPress={() => router.navigate(`/chat/${match.chatRoomIdx}`)}
                        >
                            <Text style={styles.chatBtnText} allowFontScaling={false}>채팅방</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 평가 대상자 선택 BottomSheet (모임 매칭 author용) */}
            <BottomSheetModal
                ref={reviewPickerRef}
                enableDynamicSizing={true}
                enableOverDrag={false}
                enablePanDownToClose
                backdropComponent={renderReviewBackdrop}
                backgroundStyle={styles.pickerSheetBg}
                handleIndicatorStyle={styles.pickerHandleIndicator}
            >
                <BottomSheetView style={[styles.pickerSheet, { paddingBottom: SPACING.xl + insets.bottom }]}>
                    <Text style={styles.pickerTitle} allowFontScaling={false}>평가할 상대를 선택하세요</Text>
                    <ScrollView style={{  }}>
                        {(match?.evalPartners || [])
                            .filter(p => p.needsEvaluation)
                            .map(p => (
                                <TouchableOpacity
                                    key={p.idx}
                                    style={styles.pickerItem}
                                    onPress={() => pickReviewPartner(p)}
                                    testID={`match-detail-review-pick-${p.idx}`}
                                >
                                    {p.profileImage ? (
                                        <Image
                                            source={{ uri: STORAGE_URL + p.profileImage }}
                                            style={styles.pickerAvatar}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <Image
                                            source={require('../../assets/icons/profile-avatar.svg')}
                                            style={styles.pickerAvatar}
                                            contentFit="cover"
                                        />
                                    )}
                                    <Text style={styles.pickerNickname} numberOfLines={1} allowFontScaling={false}>
                                        {p.nickname}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                   
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
}

// ─── 정보 행 컴포넌트 ──────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel} allowFontScaling={false}>{label}</Text>
            <Text style={styles.infoValue} allowFontScaling={false}>{value}</Text>
        </View>
    );
}

// ─── 사진 갤러리 ───────────────────────────────────────────────────────────────
function PhotoGallery({ photos, onPhotoPress }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const firstPhoto = photos[currentIdx];

    return (
        <View style={styles.gallery}>
            {/* 메인 사진 — 탭 시 전체화면 뷰어 */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPhotoPress?.(currentIdx)}
                testID="match-photo-main"
            >
                <View style={styles.mainPhotoWrap}>
                    {firstPhoto ? (
                        <Image
                            source={{ uri: STORAGE_URL + firstPhoto.imageUrl }}
                            style={styles.mainPhoto}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.mainPhoto, { backgroundColor: COLORS.lightGray }]} />
                    )}
                    {/* 페이지 인디케이터 */}
                    {photos.length > 1 && (
                        <View style={styles.pageIndicator}>
                            <Text style={styles.pageIndicatorText} allowFontScaling={false}>
                                <Text style={styles.pageIndicatorCurrent} allowFontScaling={false}>{currentIdx + 1}</Text>
                                <Text style={styles.pageIndicatorTotal} allowFontScaling={false}>/{photos.length}</Text>
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* 썸네일 스트립 */}
            {photos.length > 1 && (
                <View style={styles.thumbnailStrip}>
                    {photos.map((photo, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.thumbnailWrap}
                            onPress={() => setCurrentIdx(i)}
                            activeOpacity={0.8}
                            testID={`match-photo-thumb-${i}`}
                        >
                            <Image
                                source={{ uri: STORAGE_URL + photo.imageUrl }}
                                style={styles.thumbnail}
                                contentFit="cover"
                            />
                            {i !== currentIdx && <View style={styles.thumbnailDim} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

// ─── 확정/미확정 인원 카드 ────────────────────────────────────────────────────
function ParticipantSummaryCard({ match, driveLevels, onProfilePress }) {
    const allParticipants = match?.participants || [];
    const accepted = allParticipants.filter(p => p.status === 'accepted');

    const authorEntry = match?.author ? {
        idx: 'author',
        user: match.author,
        role: match.authorRole,
        matchConfirmed: !!match.authorMatchConfirmed,
        status: 'accepted',
        isAuthor: true,
    } : null;
    const allWithAuthor = authorEntry ? [authorEntry, ...accepted] : accepted;
    const confirmed = allWithAuthor.filter(p => p.matchConfirmed);
    const unconfirmed = allWithAuthor.filter(p => !p.matchConfirmed);

    const confirmedOwners = confirmed.filter(p => p.role === 'owner');
    const confirmedGuests = confirmed.filter(p => p.role === 'guest');
    const unconfirmedOwners = unconfirmed.filter(p => p.role === 'owner');
    const unconfirmedGuests = unconfirmed.filter(p => p.role === 'guest');

    return (
        <View style={styles.summaryCardGroup}>
            {/* 확정 인원 */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle} allowFontScaling={false}>확정 인원</Text>
                {confirmed.length === 0 ? (
                    <Text style={styles.summaryEmptyText} allowFontScaling={false}>매칭 확정한 회원이 없습니다.</Text>
                ) : (
                    <>
                        {confirmedOwners.length > 0 ? (
                            <PersonGroup label="오너" people={confirmedOwners} driveLevels={driveLevels} onProfilePress={onProfilePress} />
                        ) : null}
                        {confirmedGuests.length > 0 ? (
                            <PersonGroup label="게스트" people={confirmedGuests} driveLevels={driveLevels} onProfilePress={onProfilePress} />
                        ) : null}
                    </>
                )}
            </View>

            {/* 미확정 인원 */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle} allowFontScaling={false}>미확정 인원</Text>
                {unconfirmed.length === 0 ? (
                    <Text style={styles.summaryEmptyText} allowFontScaling={false}>미확정 회원이 없습니다.</Text>
                ) : (
                    <>
                        {unconfirmedOwners.length > 0 ? (
                            <PersonGroup label="오너" people={unconfirmedOwners} driveLevels={driveLevels} onProfilePress={onProfilePress} />
                        ) : null}
                        {unconfirmedGuests.length > 0 ? (
                            <PersonGroup label="게스트" people={unconfirmedGuests} driveLevels={driveLevels} onProfilePress={onProfilePress} />
                        ) : null}
                    </>
                )}
            </View>
        </View>
    );
}

// ─── 인원 서브그룹 (오너/게스트) ───────────────────────────────────────────────
function PersonGroup({ label, people, driveLevels, onProfilePress }) {
    return (
        <View style={styles.personGroup}>
            <Text style={styles.personGroupLabel} allowFontScaling={false}>
                {label} <Text style={styles.personGroupNum}>{people.length}</Text>명
            </Text>
            {people.map(p => (
                <PersonRow key={p.idx} participant={p} driveLevels={driveLevels} onProfilePress={onProfilePress} />
            ))}
        </View>
    );
}

// ─── 인원 행 ──────────────────────────────────────────────────────────────────
function PersonRow({ participant, driveLevels, onProfilePress }) {
    const u = participant.user;
    if (!u) return null;

    const ageDecade = getAgeDecade(u.birthDate);
    const genderLabel = u.gender === 'M' ? '남' : u.gender === 'F' ? '여' : '';
    const driveLevelLabel = u.ownerProfile?.driveLevel
        ? ((driveLevels?.find(d => d.key === u.ownerProfile.driveLevel)?.label || '').replace(/\s*\(.*\)$/, '') || null)
        : null;

    const content = (
        <>
            {u.profileImage ? (
                <Image
                    source={{ uri: STORAGE_URL + u.profileImage }}
                    style={styles.personAvatar}
                    contentFit="cover"
                />
            ) : (
                <Image
                    source={require('../../assets/icons/profile-avatar.svg')}
                    style={styles.personAvatar}
                    contentFit="cover"
                />
            )}
            <View style={styles.personInfo}>
                <View style={styles.personNicknameRow}>
                    <Text style={styles.personNickname} numberOfLines={1} allowFontScaling={false}>{u.nickname}</Text>
                    {participant.isAuthor ? (
                        <Image
                            source={require('../../assets/icons/crown.svg')}
                            style={styles.personCrown}
                            contentFit="contain"
                        />
                    ) : null}
                </View>
                <View style={styles.personTags}>
                    {ageDecade ? <View style={styles.personTag}><Text style={styles.personTagText} allowFontScaling={false}>{ageDecade}</Text></View> : null}
                    {genderLabel ? <View style={styles.personTag}><Text style={styles.personTagText} allowFontScaling={false}>{genderLabel}</Text></View> : null}
                    {driveLevelLabel ? <View style={styles.personTag}><Text style={styles.personTagText} allowFontScaling={false}>{driveLevelLabel}</Text></View> : null}
                </View>
            </View>
        </>
    );

    // 작성자(왕관) 행은 본인이므로 프로필 이동 없음
    if (participant.isAuthor) {
        return (
            <View style={styles.personRow} testID={`match-detail-person-${u.idx}`}>
                {content}
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={styles.personRow}
            activeOpacity={0.7}
            onPress={() => onProfilePress?.(u.idx)}
            testID={`match-detail-person-${u.idx}`}
        >
            {content}
        </TouchableOpacity>
    );
}

// ─── 신청자 카드 ───────────────────────────────────────────────────────────────
function ApplicantCard({ participant, carTypes, driveLevels, actionLoading, onAccept, onReject, onProfilePress, testID }) {
    const u = participant.user;
    if (!u) return null;

    const ageDecade = getAgeDecade(u.birthDate);
    const genderLabel = getGenderLabel(u.gender);
    const roleBg = participant.role === 'owner' ? COLORS.secondary : COLORS.safety;
    const roleLabel = participant.role === 'owner' ? '오너' : '게스트';

    return (
        <View style={styles.applicantCard} testID={testID}>
            {/* 프로필 행 */}
            <TouchableOpacity
                style={styles.applicantTop}
                onPress={() => onProfilePress?.(u.idx)}
                activeOpacity={0.7}
                testID={`${testID}-profile`}
            >
                <View style={styles.applicantAvatarWrap}>
                    {u.profileImage ? (
                        <Image
                            source={{ uri: STORAGE_URL + u.profileImage }}
                            style={styles.applicantAvatar}
                            contentFit="cover"
                        />
                    ) : (
                        <Image
                            source={require('../../assets/icons/profile-avatar.svg')}
                            style={styles.applicantAvatar}
                            contentFit="cover"
                        />
                    )}
                </View>
                <View style={styles.applicantInfo}>
                    <View style={styles.applicantNicknameRow}>
                        <Text style={styles.applicantNickname} numberOfLines={1} allowFontScaling={false}>{u.nickname}</Text>
                        <View style={[styles.applicantRoleBadge, { backgroundColor: roleBg }]}>
                            <Text style={styles.applicantRoleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                        </View>
                    </View>
                    <View style={styles.applicantTags}>
                        {ageDecade ? (
                            <View style={styles.applicantTag}>
                                <Text style={styles.applicantTagText} allowFontScaling={false}>{ageDecade}</Text>
                            </View>
                        ) : null}
                        {genderLabel ? (
                            <View style={styles.applicantTag}>
                                <Text style={styles.applicantTagText} allowFontScaling={false}>{genderLabel}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>

            {/* 신청 메시지 */}
            {participant.message ? (
                <Text style={styles.applicantMessage} allowFontScaling={false}>{participant.message}</Text>
            ) : null}

            {/* 수락/거절 버튼 or 상태 표시 */}
            {participant.status === 'requested' ? (
                <View style={styles.applicantBtns}>
                    <TouchableOpacity
                        testID={`${testID}-reject-btn`}
                        style={styles.rejectBtn}
                        onPress={onReject}
                        disabled={!!actionLoading}
                    >
                        {actionLoading?.type === 'reject' && actionLoading?.participantIdx === participant.idx ? (
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        ) : (
                            <Text style={styles.rejectBtnText} allowFontScaling={false}>거절</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID={`${testID}-accept-btn`}
                        style={styles.acceptBtn}
                        onPress={onAccept}
                        disabled={!!actionLoading}
                    >
                        <Text style={styles.acceptBtnText} allowFontScaling={false}>수락</Text>
                    </TouchableOpacity>
                </View>
            ) : participant.status === 'accepted' ? (
                <View style={styles.applicantStatusRow}>
                    <Text style={styles.acceptedStatusText} allowFontScaling={false}>수락하셨습니다.</Text>
                </View>
            ) : participant.status === 'rejected' ? (
                <View style={styles.applicantStatusRow}>
                    <Text style={styles.rejectedStatusText} allowFontScaling={false}>거절하셨습니다.</Text>
                </View>
            ) : null}
        </View>
    );
}

// ─── 하단 버튼 바 ──────────────────────────────────────────────────────────────
function BottomBar({ isAuthor, participantStatus, matchEnded, recruitClosed, matchStatus, matchType, actionLoading, chatRoomIdx, canManner, canReviewWrite, onApply, onCancel, onChat, onManner, onReviewWrite, insets }) {
    if (matchEnded) {
        const showAny = matchStatus === 'completed' && (canManner || canReviewWrite);
        return (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
                <View style={[styles.bottomInner, styles.endedBar]}>
                    {!showAny ? (
                        <Text style={[styles.endedText, { textAlign: 'left' }]} allowFontScaling={false}>매칭 종료되었습니다.</Text>
                    ) : (
                        <View style={styles.endedBtnRow}>
                            {canManner && (
                                <TouchableOpacity
                                    testID="match-detail-manner-btn"
                                    style={[styles.reviewBtn, styles.reviewBtnFlex]}
                                    onPress={onManner}
                                >
                                    <Text style={styles.reviewBtnText} allowFontScaling={false}>리뷰쓰기</Text>
                                </TouchableOpacity>
                            )}
                            {canReviewWrite && (
                                <TouchableOpacity
                                    testID="match-detail-review-write-btn"
                                    style={[styles.reviewBtn, styles.reviewBtnFlex]}
                                    onPress={onReviewWrite}
                                >
                                    <Text style={styles.reviewBtnText} allowFontScaling={false}>후기쓰기</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    }
    if (isAuthor) return null;
    return (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
            {participantStatus === 'accepted' ? (
                // 매칭 확정
                <View style={styles.bottomInner}>
                    <Text style={styles.acceptedText} allowFontScaling={false}>매칭 확정되었습니다.</Text>
                    <TouchableOpacity
                        testID="match-detail-chat-btn"
                        style={styles.chatBtn}
                        onPress={chatRoomIdx ? onChat : () => showToast('info', '채팅방을 불러올 수 없습니다.')}
                    >
                        <Text style={styles.chatBtnText} allowFontScaling={false}>채팅방</Text>
                    </TouchableOpacity>
                </View>
            ) : participantStatus === 'rejected' ? (
                // 거절됨
                <View style={styles.bottomInner}>
                    <Text style={styles.rejectedText} allowFontScaling={false}>매칭 거절되었습니다.</Text>
                </View>
            ) : participantStatus === 'requested' ? (
                // 신청중 → 신청취소 버튼
                <View style={styles.bottomInner}>
                    <Text style={styles.requestedText} allowFontScaling={false}>매칭 신청이 완료되었습니다.</Text>
                    <TouchableOpacity
                        testID="match-detail-cancel-btn"
                        style={styles.cancelBtn}
                        onPress={onCancel}
                        disabled={!!actionLoading}
                    >
                        {actionLoading?.type === 'cancel' ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Text style={styles.cancelBtnText} allowFontScaling={false}>신청취소</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : recruitClosed ? (
                // 모집 마감 (시작 1시간 전부터 신청 불가)
                <View style={[styles.bottomInner, styles.endedBar]}>
                    <Text style={styles.endedText} allowFontScaling={false}>모집이 마감되었습니다.</Text>
                </View>
            ) : (
                // 기본: 신청하기 버튼
                <View style={styles.bottomInner}>
                    <Text style={styles.defaultStatusText} allowFontScaling={false}>
                        {matchType === 'one_to_one' ? '1:1 매칭입니다.' : '모임 매칭입니다.'}
                    </Text>
                    <TouchableOpacity
                        testID="match-detail-apply-btn"
                        style={styles.applyBtn}
                        onPress={onApply}
                        disabled={!!actionLoading}
                    >
                        <Text style={styles.applyBtnText} allowFontScaling={false}>신청하기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },

    // 스크롤
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        gap: SPACING.md,
    },

    // NO번호
    noText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textMedium,
        lineHeight: 20,
    },

    // 메타 (등록일 + 조회수)
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xs,
    },
    metaText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    viewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    viewIcon: { width: 20, height: 20 },

    // 작성자 헤더 버튼들
    reportMenuBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    reportMenuBtnText: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    authorHeaderBtns: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    editBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: 8,
    },
    editBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    deleteBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textMedium,
        lineHeight: 20,
    },

    // 탭 바
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.xl,
        gap: 24,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textDisabled,
        lineHeight: 24,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontFamily: FONTS.extraBold,
    },

    // 프로필 카드
    profileCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: SPACING.xl,
        gap: SPACING.md,
    },
    profileCardMine: {
        backgroundColor: '#384FEE',
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    profileLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        minWidth: 0,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        flexShrink: 0,
    },
    avatar: { width: 52, height: 52, backgroundColor: COLORS.grayF1 },
    profileInfo: {
        flex: 1,
        gap: SPACING.xs,
        minWidth: 0,
    },
    nicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    nickname: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
        flexShrink: 1,
    },
    roleBadge: {
        // [C129] 배경색은 인라인으로 역할별 분기 (오너=secondary, 게스트=safety)
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 8,
        flexShrink: 0,
    },
    roleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 16,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    tag: {
        backgroundColor: COLORS.primaryDeep,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 100,
    },
    tagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 16,
    },

    // 매너점수
    mannerCol: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexShrink: 0,
    },
    mannerScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm - 2,
    },
    smileIcon: { width: 18, height: 18 },
    mannerScore: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: '#FFCE52',
        lineHeight: 30,
    },
    mannerLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 20,
        textAlign: 'center',
    },

    // 구분선
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // 차종
    carSection: { gap: SPACING.sm },
    carSectionLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    carList: { gap: SPACING.sm - 2 },
    carRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm - 2,
    },
    carTypeBadge: {
        backgroundColor: COLORS.primaryDeep,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 4,
        width: 50,
        alignItems: 'center',
    },
    carTypeBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.primaryBg,
        lineHeight: 16,
        textAlign: 'center',
    },
    carModel: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },

    // 매칭/리뷰 + 프로필보기
    statsRow: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 12,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.white,
    },
    statsText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    profileViewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    profileViewText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
        textAlign: 'center',
    },
    chevronIcon: { width: 24, height: 24 },

    // 노쇼/신고 카운트
    noshowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xs,
    },
    noshowText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    noshowCount: {
        fontFamily: FONTS.extraBold,
        color: '#FF3232',
    },

    // 드라이브 정보 카드
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    infoTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 24,
        marginBottom: SPACING.sm,
    },
    infoRows: { gap: SPACING.sm },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    infoLabel: {
        width: 80,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
        lineHeight: 20,
        flexShrink: 0,
    },
    infoValueRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm - 2,
    },
    infoValue: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    ddayBadge: {
        backgroundColor: COLORS.secondary,
        height: 20,
        paddingHorizontal: 10,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    ddayText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    typeTagsWrap: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    typeTag: {
        backgroundColor: COLORS.borderLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: 2,
        borderRadius: 100,
    },
    typeTagText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    matchTitleText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 22,
    },
    content: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },

    // 사진 갤러리
    gallery: { marginHorizontal: -SPACING.xl, gap: 2 },
    mainPhotoWrap: {
        height: 240,
        width: '100%',
        position: 'relative',
    },
    mainPhoto: {
        width: '100%',
        height: 240,
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 8,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 100,
    },
    pageIndicatorText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 16,
    },
    pageIndicatorCurrent: {
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    pageIndicatorTotal: {
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
    },
    thumbnailStrip: {
        flexDirection: 'row',
        gap: 2,
    },
    thumbnailWrap: {
        flex: 1,
        height: 64,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: 64,
    },
    thumbnailDim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },

    // 확정/미확정 인원 카드
    summaryCardGroup: {
        gap: SPACING.md,
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
        gap: SPACING.xl,
    },
    summaryTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    summaryEmptyText: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: COLORS.textDisabled,
        lineHeight: 20,
    },

    // 인원 서브그룹 (오너/게스트)
    personGroup: {
        gap: SPACING.md,
    },
    personGroupLabel: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    personGroupNum: {
        fontFamily: FONTS.extraBold,
    },

    // 인원 행
    personRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    personAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.grayF1
    },
    personInfo: {
        flex: 1,
        gap: 4,
        justifyContent: 'center',
    },
    personNicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    personNickname: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
        flexShrink: 1,
    },
    personCrown: {
        width: 16,
        height: 16,
    },
    personTags: {
        flexDirection: 'row',
        gap: 4,
    },
    personTag: {
        backgroundColor: '#F1F1F1',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 6,
    },
    personTagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: '#969698',
        lineHeight: 16,
    },

    // 신청자 카드
    applicantCard: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayEE,
        paddingVertical: SPACING.xl,
        gap: SPACING.sm,
    },
    applicantTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    applicantAvatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        flexShrink: 0,
    },
    applicantAvatar: { width: 52, height: 52 },
    applicantInfo: {
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    applicantNicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    applicantNickname: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 24,
        flexShrink: 1,
    },
    applicantRoleBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 8,
        flexShrink: 0,
    },
    applicantRoleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        lineHeight: 16,
    },
    applicantTags: {
        flexDirection: 'row',
        gap: 2,
    },
    applicantTag: {
        backgroundColor: '#EEEEEE',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 100,
    },
    applicantTagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: '#686869',
        lineHeight: 16,
    },
    applicantMessage: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    applicantBtns: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    rejectBtn: {
        flex: 1,
        height: 44,
        backgroundColor: '#EEEEEE',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.textMedium,
        lineHeight: 20,
    },
    acceptBtn: {
        flex: 1,
        height: 44,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    applicantStatusRow: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    acceptedStatusText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
        lineHeight: 20,
    },
    rejectedStatusText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: '#E02E2E',
        lineHeight: 20,
    },

    // 빈 상태
    emptyBox: {
        paddingVertical: SPACING.xxxxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZE.base,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        lineHeight: 22,
    },

    // 하단 버튼 바
    bottomBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    bottomInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },

    // 신청하기
    defaultStatusText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    applyBtn: {
        backgroundColor: COLORS.primary,
        height: 52,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    applyBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
        textAlign: 'center',
    },

    // 신청중 / 신청취소
    requestedText: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
    },
    cancelBtn: {
        backgroundColor: COLORS.primaryLight,
        height: 52,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    cancelBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
        textAlign: 'center',
    },

    // 수락됨
    acceptedText: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
    },
    chatBtn: {
        backgroundColor: COLORS.primary,
        height: 52,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    chatBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
        textAlign: 'center',
    },

    // 거절됨
    rejectedText: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.disabledBtn,
        lineHeight: 24,
    },

    // 종료됨
    endedBar: {
        borderRadius: 8,
        padding: SPACING.md,
    },
    endedText: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.disabledBtn,
        textAlign: 'center'
    },
    reviewBtn: {
        backgroundColor: COLORS.primary,
        height: 36,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    endedBtnRow: {
        flex: 1,
        flexDirection: 'row',
        gap: SPACING.md,
    },
    reviewBtnFlex: {
        flex: 1,
    },
    // 평가 대상자 선택 BottomSheet
    pickerSheetBg: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    pickerHandleIndicator: {
        backgroundColor: '#DDDDDD',
        width: 40,
    },
    pickerSheet: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },
    pickerTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
        marginBottom: SPACING.md,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
    },
    pickerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    pickerNickname: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    pickerCloseBtn: {
        marginTop: SPACING.md,
        height: 52,
        backgroundColor: '#EEEEEE',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerCloseText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: '#969698',
        lineHeight: 24,
    },
});
