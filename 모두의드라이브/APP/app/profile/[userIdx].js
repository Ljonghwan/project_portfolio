import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image, ImageBackground } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { CaptureProtection } from 'react-native-capture-protection';
import { useIsFocused } from '@react-navigation/native';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import { authApi } from '../../src/api/auth';
import { userApi } from '../../src/api/user';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import { imageViewer } from '../../src/utils/imageViewer';
import ReportBlockMenu from '../../src/components/ReportBlockMenu';
2
export default function ProfileScreen() {

    const { userIdx, action } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();
    const currentUser = useAuthStore((s) => s.user);
    const isSelf = currentUser?.idx === Number(userIdx);
    const profileTags = useConfigStore((s) => s.profileTags);
    const carTypes = useConfigStore((s) => s.carTypes);
    const driveLevels = useConfigStore((s) => s.driveLevels);
    const mannerEvalItems = useConfigStore((s) => s.mannerEvalItems) ?? [];
    const isFocused = useIsFocused();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState(0); // 0=profile, 1=photo, 2=review
    const [photos, setPhotos] = useState([]);
    const [isPhotoViewed, setIsPhotoViewed] = useState(false);
    const [photoExpiresAt, setPhotoExpiresAt] = useState(null);
    const [introduction, setIntroduction] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [screenshotWarning, setScreenshotWarning] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeUpdating, setLikeUpdating] = useState(false);


    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [userIdx])
    );

    // 화면 진입 시 캡처 방지 (모든 탭), 화면 이탈 시 해제
    useEffect(() => {
        if (isFocused) {
            CaptureProtection.prevent({ screenshot: true, record: true, appSwitcher: true });
        } else {
            CaptureProtection.allow({ screenshot: true, record: true, appSwitcher: true });
        }
        return () => {
            CaptureProtection.allow({ screenshot: true, record: true, appSwitcher: true });
        };
    }, [isFocused]);

    // 스크린샷 감지 — 모든 탭에서 캡처 시 경고 팝업 (CaptureEventType.CAPTURED = 3)
    useEffect(() => {
        if (!isFocused) return;
        const listener = CaptureProtection.addListener((eventType) => {
            if (eventType === 3) {
                setScreenshotWarning(true);
            }
        });
        return () => listener?.remove?.();
    }, [isFocused]);

    async function loadProfile() {
        try {
            const res = await authApi.getProfile(Number(userIdx));
            const data = res.data;
            setProfile(data);
            setIsLiked(data.isLiked ?? false);
            setIsPhotoViewed(data.isPhotoViewed);
            if (data.isPhotoViewed) {
                loadPhotos();
                loadReviews();
            } else {
                // 열람권 없는 대상으로 바뀌면 이전 대상의 유료 정보가 남지 않게 전부 리셋
                setPhotos([]);
                setPhotoExpiresAt(null);
                setIntroduction(null);
                setReviews([]);
                setReviewSummary(null);
            }
        } catch (e) {
            const msg = e?.response?.data?.message || '프로필을 불러올 수 없습니다.';
            showToast('error', msg);
            router.back();
        } finally {
            setLoading(false);
        }
    }

    async function loadPhotos() {
        try {
            const res = await authApi.getProfilePhotos(Number(userIdx));
            const data = res.data;
            setPhotos(data.photos || []);
            setPhotoExpiresAt(data.expiresAt);
            setIntroduction(data.introduction);
        } catch {
            // 열람 권한 없음 — 무시
        }
    }

    async function loadReviews() {
        setReviewsLoading(true);
        try {
            const res = await authApi.getProfileReviews(Number(userIdx));
            const data = res.data;
            setReviewSummary({ mannerScore: data.mannerScore, itemCounts: data.itemCounts || {} });
            setReviews(data.list || []);
        } catch {
            // 열람 권한 없음 — 무시
        } finally {
            setReviewsLoading(false);
        }
    }

    function handlePaymentNavigate() {
        router.navigate(`/profile/payment?userIdx=${userIdx}`);
    }

    async function handleLike() {
        if (likeUpdating) return;
        setLikeUpdating(true);
        const prev = isLiked;
        setIsLiked(!prev);
        setProfile((p) => p ? { ...p, likeCount: (p.likeCount ?? 0) + (!prev ? 1 : -1) } : p);
        try {
            const res = await userApi.like(Number(userIdx));
            setIsLiked(res.data.isLiked);
        } catch {
            setIsLiked(prev);
            setProfile((p) => p ? { ...p, likeCount: (p.likeCount ?? 0) + (prev ? 1 : -1) } : p);
            showToast('error', '좋아요 처리에 실패했습니다.');
        } finally {
            setLikeUpdating(false);
        }
    }


    // 매너 평가 항목 — 평가 대상의 userType(role)으로 필터 + 카운트 내림차순 정렬
    const sortedMannerItems = useMemo(() => {
        const counts = reviewSummary?.itemCounts || {};
        const targetRole = profile?.role; // 'owner' | 'guest'
        const filtered = targetRole
            ? mannerEvalItems.filter(i => !i.targetType || i.targetType === targetRole)
            : mannerEvalItems;
        return [...filtered].sort((a, b) => (counts[b.key] || 0) - (counts[a.key] || 0));
    }, [mannerEvalItems, reviewSummary, profile?.role]);

    if (loading) {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.iconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="profile-back-btn"
                    >
                        <Image
                            source={require('../../assets/icons/arrow-back.svg')}
                            style={styles.backIcon}
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} allowFontScaling={false}>프로필</Text>
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    if (!profile) return null;

    const isOwner = profile.role === 'owner';
    const roleLabel = isOwner ? '오너' : '게스트';
    const genderLabel = profile.gender === 'M' ? '남성' : profile.gender === 'F' ? '여성' : null;
    const driveLevelLabel = isOwner
        ? (driveLevels.find((l) => l.key === profile.ownerProfile?.driveLevel)?.label || '').replace(/\s*\(.*\)$/, '') || null
        : null;
    const regionText = [profile.regionSido, profile.regionSigungu].filter(Boolean).join(' ');
    const introText = introduction?.trim();
    const driveModes = Array.isArray(profile.driveModes) ? profile.driveModes : [];
    const driveModeLabels = driveModes
        .map((key) => profileTags.find((t) => t.key === key)?.label || key);

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.iconBtn}
                    testID="profile-back-btn"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>프로필</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.giftBtn} testID="profile-gift-btn">
                        <Text style={styles.giftBtnText} allowFontScaling={false}>선물하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.likeRow}
                        testID="profile-like-btn"
                        onPress={handleLike}
                        disabled={likeUpdating}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Image
                            source={isLiked
                                ? require('../../assets/icons/heart-fill.svg')
                                : require('../../assets/icons/heart.svg')
                            }
                            style={styles.likeIcon}
                            contentFit="contain"
                            tintColor={isLiked ? COLORS.error : undefined}
                        />
                        <Text style={styles.headerLikeCount} allowFontScaling={false}>
                            {profile.likeCount ?? 0}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View
                style={[
                    styles.scrollContent,
                    { flex: 1 },
                ]}
            >
                <View style={{ paddingHorizontal: SPACING.xl, gap: SPACING.lg }}>
                    {/* 노쇼/신고 row */}
                    <View style={styles.statsRow}>
                        <Text style={styles.statsText} allowFontScaling={false}>
                            {'노쇼 '}
                            <Text style={styles.statsNum} allowFontScaling={false}>{profile.noshowCount ?? 0}</Text>
                            {'건'}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.statsText} allowFontScaling={false}>
                            {'신고 '}
                            <Text style={styles.statsNum} allowFontScaling={false}>{profile.reportCount ?? 0}</Text>
                            {'건'}
                        </Text>
                        {!isSelf && (
                            <>
                                <View style={styles.dot} />
                                <ReportBlockMenu
                                    targetIdx={userIdx}
                                    targetNickname={profile?.nickname}
                                    reportType="user"
                                >
                                    <View
                                        testID="profile-report-btn"
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Image
                                            source={require('../../assets/icons/alarm-warning.svg')}
                                            style={styles.alarmIcon}
                                            contentFit="contain"
                                        />
                                    </View>
                                </ReportBlockMenu>
                            </>
                        )}
                    </View>

                    {/* 프로필 카드 (파란 배경) */}
                    <View style={styles.profileCard}>
                        {/* 상단: 아바타 + 닉네임 + 매너점수 */}
                        <View style={styles.profileCardTop}>
                            <View style={styles.avatarWrap}>
                                {profile.profileImage ? (
                                    <Image
                                        source={{ uri: STORAGE_URL + profile.profileImage }}
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
                            <View style={styles.profileInfo}>
                                <View style={styles.nicknameRow}>
                                    <Text
                                        style={styles.nickname}
                                        allowFontScaling={false}
                                        numberOfLines={1}
                                    >
                                        {profile.nickname}
                                    </Text>
                                    <View style={[styles.roleBadge, { backgroundColor: isOwner ? COLORS.secondary : COLORS.safety }]}>
                                        <Text style={styles.roleBadgeText} allowFontScaling={false}>
                                            {roleLabel}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.chipRow}>
                                    {profile.ageGroup ? (
                                        <View style={styles.chip}>
                                            <Text style={styles.chipText} allowFontScaling={false}>
                                                {profile.ageGroup}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {genderLabel ? (
                                        <View style={styles.chip}>
                                            <Text style={styles.chipText} allowFontScaling={false}>
                                                {genderLabel}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {isOwner && driveLevelLabel ? (
                                        <View style={styles.chip}>
                                            <Text style={styles.chipText} allowFontScaling={false}>
                                                {driveLevelLabel}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                            <View style={styles.mannerScoreWrap}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Image
                                        source={require('../../assets/icons/smile.svg')}
                                        style={styles.smileIconLg}
                                        contentFit="contain"
                                    />
                                    <Text style={styles.mannerScoreValue} allowFontScaling={false}>
                                        {profile.mannerScore != null ? Math.round(Number(profile.mannerScore)) : '-'}
                                    </Text>
                                </View>
                                <Text style={styles.mannerScoreLabel} allowFontScaling={false}>매너점수</Text>
                            </View>
                        </View>

                    </View>

                    {/* 탭 행 */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={activeTab === 0 ? styles.tabActive : styles.tabInactive}
                            onPress={() => setActiveTab(0)}
                            testID="profile-tab-profile"
                        >
                            <Text
                                style={activeTab === 0 ? styles.tabActiveText : styles.tabInactiveText}
                                allowFontScaling={false}
                            >
                                프로필
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={activeTab === 1 ? styles.tabActive : styles.tabInactive}
                            onPress={() => setActiveTab(1)}
                            testID="profile-tab-photo"
                        >
                            <Text
                                style={activeTab === 1 ? styles.tabActiveText : styles.tabInactiveText}
                                allowFontScaling={false}
                            >
                                {'상세프로필 '}
                                <Text style={styles.tabCount} allowFontScaling={false}>{profile.photoCount ?? 0}</Text>
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={activeTab === 2 ? styles.tabActive : styles.tabInactive}
                            onPress={() => setActiveTab(2)}
                            testID="profile-tab-review"
                        >
                            <Text
                                style={activeTab === 2 ? styles.tabActiveText : styles.tabInactiveText}
                                allowFontScaling={false}
                            >
                                {'매칭리뷰 '}
                                <Text style={styles.tabCount} allowFontScaling={false}>{profile.receivedMannerCount ?? 0}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
               

               

                {/* 탭 콘텐츠 — 모든 탭 항상 마운트, display로 토글 (리렌더/데이터 보존) */}
                <View style={{ display: activeTab === 0 ? 'flex' : 'none' }}>
                    {/* 정보 카드 */}
                    <View style={{ paddingHorizontal: SPACING.xl }}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoList}>
                                {/* 소유차량 (오너만) */}
                                {isOwner && profile.cars?.length > 0 ? (
                                    <View style={[styles.infoRow, styles.infoRowAlignStart]}>
                                        <Text style={styles.infoLabel} allowFontScaling={false}>소유차량</Text>
                                        <View style={styles.infoValue}>
                                            {profile.cars.map((car, i) => {
                                                const carLabel = carTypes.find((c) => c.key === car.carType)?.label || car.carType;
                                                return (
                                                    <View key={i} style={styles.carRow}>
                                                        <View style={styles.carTypeBadge}>
                                                            <Text style={styles.carTypeBadgeText} allowFontScaling={false}>
                                                                {carLabel}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.carModel} allowFontScaling={false} numberOfLines={1}>
                                                            {car.carModel}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ) : null}
                                {/* 관심차종 (게스트만) */}
                                {!isOwner && profile.cars?.filter((c) => c.isInterest).length > 0 ? (
                                    <View style={[styles.infoRow, styles.infoRowAlignStart]}>
                                        <Text style={styles.infoLabel} allowFontScaling={false}>관심차종</Text>
                                        <View style={styles.infoValue}>
                                            {profile.cars.filter((c) => c.isInterest).map((car, i) => {
                                                const carLabel = carTypes.find((c) => c.key === car.carType)?.label || car.carType;
                                                return (
                                                    <View key={i} style={styles.carRow}>
                                                        <View style={styles.carTypeBadge}>
                                                            <Text style={styles.carTypeBadgeText} allowFontScaling={false}>
                                                                {carLabel}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ) : null}
                                {/* 지역 */}
                                {regionText ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel} allowFontScaling={false}>지역</Text>
                                        <View style={styles.infoValue}>
                                            <Text style={styles.infoValueText} allowFontScaling={false}>{regionText}</Text>
                                        </View>
                                    </View>
                                ) : null}
                                {/* 취미 */}
                                {profile.hobby ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel} allowFontScaling={false}>취미</Text>
                                        <View style={styles.infoValue}>
                                            <Text style={styles.infoValueText} allowFontScaling={false}>{profile.hobby}</Text>
                                        </View>
                                    </View>
                                ) : null}
                                {/* 직업 */}
                                {profile.job ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel} allowFontScaling={false}>직업</Text>
                                        <View style={styles.infoValue}>
                                            <Text style={styles.infoValueText} allowFontScaling={false}>{profile.job}</Text>
                                        </View>
                                    </View>
                                ) : null}
                                {/* 소개 */}
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel} allowFontScaling={false}>소개</Text>
                                    <View style={styles.infoValue}>
                                        <Text style={styles.infoValueText} allowFontScaling={false}>
                                            {profile.bio || '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* 구분선 */}
                            <View style={styles.divider} />

                            {/* 드라이브 모드 칩 */}
                            {driveModeLabels.length > 0 ? (
                                <View style={styles.modeChips}>
                                    {driveModeLabels.map((label, i) => (
                                        <View key={i} style={styles.modeChip}>
                                            <Text style={styles.modeChipText} allowFontScaling={false}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* 미결제 통합 잠금 — 포토/리뷰 탭 모두에 노출, 버튼 텍스트만 동적 */}
                <View style={{ flex: 1, display: !isPhotoViewed && (activeTab === 1 || activeTab === 2) ? 'flex' : 'none' }}>
                    <ImageBackground source={require('../../assets/images/profile-blur.png')} style={[styles.photoLockedWrap, { paddingBottom: insets.bottom }]}>
                        <View style={styles.photoOverlay}>
                            <Image
                                source={require('../../assets/icons/lock.svg')}
                                style={styles.lockIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.photoLockedText} allowFontScaling={false}>
                                보기 권한이 없습니다.
                            </Text>
                            <TouchableOpacity
                                style={styles.photoViewBtn}
                                onPress={handlePaymentNavigate}
                                testID={activeTab === 1 ? 'profile-photo-view-btn' : 'profile-review-view-btn'}
                            >
                                <Text style={styles.photoViewBtnText} allowFontScaling={false}>
                                    {activeTab === 1 ? '사진 보기' : '리뷰 보기'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </View>

                <View style={{ flex: 1, display: isPhotoViewed && activeTab === 1 ? 'flex' : 'none' }}>
                    {/* 상세프로필 탭 — 결제 완료 (자기소개 + 프로필 사진) */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.md }}>
                        {introText ? (
                            <View style={styles.introSection}>
                                <Text style={styles.sectionTitle} allowFontScaling={false}>자기소개</Text>
                                <Text style={styles.introBody} allowFontScaling={false}>{introText}</Text>
                            </View>
                        ) : null}
                        <Text style={styles.sectionTitle} allowFontScaling={false}>프로필 사진</Text>
                        {photos.length > 0 ? (
                            <View style={styles.photoGrid}>
                                {photos.map((photo, i) => (
                                    <TouchableOpacity
                                        key={photo.idx}
                                        style={{ width: (width - 8) / 3, aspectRatio: 1, overflow: 'hidden' }}
                                        onPress={() => imageViewer({
                                            index: i,
                                            list: photos.map((p) => STORAGE_URL + p.imageUrl),
                                        })}
                                        testID={`profile-photo-${i}`}
                                    >
                                        <Image
                                            source={{ uri: STORAGE_URL + photo.imageUrl }}
                                            style={styles.photoImage}
                                            contentFit="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyTab}>
                                <Text style={styles.emptyTabText} allowFontScaling={false}>
                                    등록된 프로필 사진이 없습니다.
                                </Text>
                            </View>
                        )}
                        {photoExpiresAt ? (
                            <Text style={styles.photoExpiry} allowFontScaling={false}>
                                {`열람 만료: ${new Date(photoExpiresAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                            </Text>
                        ) : null}
                    </ScrollView>
                </View>

                <View style={{ display: isPhotoViewed && activeTab === 2 ? 'flex' : 'none', flex: 1 }}>
                    {/* 매칭리뷰 탭 — 결제 완료 */}
                    <View style={styles.reviewTab}>
                        {/* 요약 카드 */}
                        <View style={{ paddingHorizontal: SPACING.xl }}>
                            <View style={styles.infoCard}>
                                <View style={styles.reviewSummaryRow}>
                                    {/* 좌: 막대 차트 */}
                                    <View style={[styles.reviewBarWrap, { width: width < 340 ? 60 : 80 }]}>
                                        <View style={styles.reviewBarContainer}>
                                            <View style={[
                                                styles.reviewBarFill,
                                                { height: reviewSummary?.mannerScore ?? 0 },
                                            ]} />
                                        </View>
                                        <View style={styles.reviewBarScoreRow}>
                                            <Image
                                                source={require('../../assets/icons/smile.svg')}
                                                style={styles.smileIconMd}
                                                contentFit="contain"
                                            />
                                            <Text style={styles.reviewBarScore} allowFontScaling={false}>
                                                {Math.round(Number(reviewSummary?.mannerScore ?? 0))}
                                            </Text>
                                        </View>
                                        <Text style={styles.reviewBarLabel} allowFontScaling={false}>매너점수</Text>
                                    </View>
                                    {/* 우: 항목 카운트 목록 */}
                                    <View style={styles.reviewItemsList}>
                                        {sortedMannerItems.map((item, i) => {
                                            const cnt = reviewSummary?.itemCounts?.[item.key] || 0;
                                            const isTop = i === 0 && cnt > 0;
                                            const labelText = item.emoji ? `${item.emoji} ${item.label}` : item.label;
                                            return (
                                                <View key={item.key} style={styles.reviewItemRow}>
                                                    <Text
                                                        style={isTop ? styles.reviewItemHighlight : styles.reviewItemText}
                                                        allowFontScaling={false}
                                                        numberOfLines={1}
                                                    >
                                                        {labelText}
                                                    </Text>
                                                    <Text
                                                        style={isTop ? styles.reviewItemCountHighlight : styles.reviewItemCount}
                                                        allowFontScaling={false}
                                                    >
                                                        {cnt}건
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* 리뷰 목록 */}
                        {reviewsLoading ? (
                            <ActivityIndicator size="small" color={COLORS.textPrimary} style={{ paddingVertical: 20 }} />
                        ) : reviews.length > 0 ? (
                            <View style={{ paddingHorizontal: SPACING.xl }}>
                                {reviews.map((review) => {
                                    const dateStr = review.createdAt
                                        ? new Date(review.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
                                        : '';
                                    return (
                                        <View key={review.idx} style={styles.reviewItem}>
                                            <View style={styles.reviewItemHeader}>
                                                {/* 아바타 */}
                                                <View style={styles.reviewAvatarWrap}>
                                                    {review.evaluator?.profileImage ? (
                                                        <Image
                                                            source={{ uri: STORAGE_URL + review.evaluator.profileImage }}
                                                            style={styles.reviewAvatar}
                                                            contentFit="cover"
                                                        />
                                                    ) : (
                                                        <Image
                                                            source={require('../../assets/icons/profile-avatar.svg')}
                                                            style={styles.reviewAvatar}
                                                            contentFit="cover"
                                                        />
                                                    )}
                                                </View>
                                                {/* 닉네임 · 날짜 */}
                                                <View style={styles.reviewMeta}>
                                                    <Text style={styles.reviewMetaText} allowFontScaling={false} numberOfLines={1}>
                                                        <Text style={styles.reviewNickname}>{review.evaluator?.nickname ?? '-'}</Text>
                                                        {` · ${dateStr}`}
                                                    </Text>
                                                </View>
                                                {/* 매너점수 */}
                                                <View style={styles.reviewScoreRow}>
                                                    <Image
                                                        source={require('../../assets/icons/smile.svg')}
                                                        style={styles.smileIconSm}
                                                        contentFit="contain"
                                                    />
                                                    <Text style={styles.reviewScoreText} allowFontScaling={false}>
                                                        {Math.round(Number(review.mannerScore))}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.reviewContent} allowFontScaling={false} numberOfLines={3}>
                                                {review.content}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyTab}>
                                <Text style={styles.emptyTabText} allowFontScaling={false}>
                                    아직 작성된 리뷰가 없습니다.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* 스크린샷 감지 경고 모달 */}
            <Modal
                visible={screenshotWarning}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setScreenshotWarning(false)}
            >
                <TouchableOpacity
                    style={styles.screenshotOverlay}
                    activeOpacity={1}
                    onPress={() => setScreenshotWarning(false)}
                    testID="profile-screenshot-warning-close"
                >
                    <Image
                        source={require('../../assets/icons/notice.svg')}
                        style={styles.noticeIcon}
                        contentFit="contain"
                    />
                    <Text style={styles.screenshotText} allowFontScaling={false}>
                        {'타인이 프로필을 무단 캡처/유출할 경우\n사용정지 및 법적 제재를 받을 수 있습니다.'}
                    </Text>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    // 헤더
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    iconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        flex: 1,
        marginLeft: SPACING.md,
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        lineHeight: 30,
        color: COLORS.black,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    giftBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    giftBtnText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 20,
    },
    likeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeIcon: {
        width: 24,
        height: 24,
    },
    headerLikeCount: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    // 스크롤
    scrollContent: {
        gap: SPACING.lg,
    },
    // 노쇼/신고 row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        paddingHorizontal: 4,
    },
    statsText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    statsNum: {
        fontFamily: FONTS.extraBold,
        color: COLORS.danger,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.black,
    },
    alarmIcon: {
        width: 24,
        height: 24,
    },
    // 프로필 카드
    profileCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: SPACING.xl,
        gap: 16,
    },
    profileCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: COLORS.grayF1
    },
    avatar: {
        width: 52,
        height: 52,
    },
    profileInfo: {
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    nicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    nickname: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
        flexShrink: 1,
    },
    roleBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    roleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 16,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 2,
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 100,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    chipText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 16,
    },
    mannerScoreWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexShrink: 0,
    },
    smileIconLg: {
        width: 18,
        height: 18,
    },
    mannerScoreValue: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: '#FFCE52',
        lineHeight: 24,
    },
    mannerScoreLabel: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: COLORS.white,
        lineHeight: 16,
    },
    // 탭 행
    tabRow: {
        flexDirection: 'row',
        gap: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    tabActive: {
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    tabActiveText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
        textAlign: 'center',
    },
    tabInactive: {
        paddingVertical: 8,
    },
    tabInactiveText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.disabledBtn,
        lineHeight: 24,
        textAlign: 'center',
    },
    tabCount: {
        color: COLORS.primary,
    },
    // 정보 카드
    infoCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
        gap: 12,
    },
    infoList: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRowAlignStart: {
        alignItems: 'flex-start',
    },
    infoLabel: {
        width: 64,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
        lineHeight: 20,
        flexShrink: 0,
    },
    infoValue: {
        flex: 1,
        gap: 2,
        minWidth: 0,
    },
    infoValueText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    // 차종
    carRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    carTypeBadge: {
        backgroundColor: '#EEEEEE',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        width: 50,
        alignItems: 'center',
    },
    carTypeBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: '#686869',
        lineHeight: 16,
    },
    carModel: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
        minWidth: 0,
    },
    // 구분선
    divider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
    },
    // 드라이브 모드
    modeChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    modeChip: {
        backgroundColor: COLORS.borderLight,
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 4,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeChipText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        lineHeight: 20,
    },
    // 상세프로필 탭 섹션 (자기소개 / 프로필 사진)
    sectionTitle: {
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    introSection: {
        marginBottom: SPACING.xl,
    },
    introBody: {
        paddingHorizontal: SPACING.xl,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
    },
    // 포토프로필 그리드 (3열) — 좌우 패딩 상쇄하여 화면 가득
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    photoCell: {
        aspectRatio: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoCellEmpty: {
        backgroundColor: COLORS.borderLight,
    },
    photoCellLocked: {
        backgroundColor: COLORS.grayMedium,
        opacity: 0.4,
    },
    photoLockedWrap: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        marginHorizontal: -SPACING.xl,
    },
    photoOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        borderRadius: 4,
    },
    lockIcon: {
        width: 40,
        height: 40,
    },
    photoLockedText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    photoViewBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: 160,
        alignItems: 'center',
    },
    photoViewBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
        lineHeight: 24,
    },
    photoExpiry: {
        marginTop: SPACING.xl,
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
        lineHeight: 16,
        textAlign: 'right',
        paddingHorizontal: SPACING.md,
    },
    // 빈 탭
    emptyTab: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyTabText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
        lineHeight: 20,
    },
    sheetBg: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    sheetIndicator: {
        backgroundColor: COLORS.borderLight,
        width: 40,
    },
    sheetBtnDisabled: {
        opacity: 0.6,
    },
    // 매칭리뷰 탭
    reviewTab: {
        gap: 12,
    },
    reviewSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    reviewBarWrap: {
        width: 80,
        alignItems: 'center',
        gap: 4,
    },
    reviewBarContainer: {
        width: 40,
        height: 100,
        backgroundColor: COLORS.grayF1,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    reviewBarFill: {
        width: '100%',
        backgroundColor: COLORS.secondary,
    },
    reviewBarScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    smileIconMd: {
        width: 18,
        height: 18,
    },
    reviewBarScore: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 30,
    },
    reviewBarLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        lineHeight: 20,
        textAlign: 'center',
    },
    reviewItemsList: {
        flex: 1,
        gap: 4,
    },
    reviewItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reviewItemText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
    },
    reviewItemHighlight: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
    },
    reviewItemCount: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 20,
        marginLeft: 4,
    },
    reviewItemCountHighlight: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
        lineHeight: 24,
        marginLeft: 4,
    },
    // 리뷰 아이템
    reviewItem: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        gap: 8,
    },
    reviewItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewAvatarWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        flexShrink: 0,
    },
    reviewAvatar: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.grayF1
    },
    reviewMeta: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
    },
    reviewOnlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.safety,
        flexShrink: 0,
    },
    reviewMetaText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.grayMedium,
        lineHeight: 20,
    },
    reviewNickname: {
        color: COLORS.black,
    },
    reviewScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    smileIconSm: {
        width: 16,
        height: 16,
    },
    reviewScoreText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.black,
        lineHeight: 20,
    },
    reviewContent: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.black,
        lineHeight: 20,
    },
    // 리뷰 잠금 배경
    reviewLockedBg: {
        height: 200,
        backgroundColor: COLORS.borderLight,
        borderRadius: 4,
    },
    // 액션 시트
    actionSheetContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    actionSheetItem: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    actionSheetItemText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    actionSheetDanger: {
        color: COLORS.danger,
    },
    actionSheetCancel: {
        color: COLORS.grayMedium,
    },
    actionSheetDivider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
    },
    // 스크린샷 경고 모달
    screenshotOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 40,
    },
    noticeIcon: {
        width: 48,
        height: 48,
    },
    screenshotText: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        color: '#E02E2E',
        lineHeight: 24,
        textAlign: 'center',
    },
});
