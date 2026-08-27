import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import chatApi from '../../src/api/chat';
import useAuthStore from '../../src/store/authStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';

const PANEL_WIDTH = 320;

export default function MembersScreen() {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useSafeAreaFrame();
    const router = useRouter();
    const { roomIdx } = useLocalSearchParams();
    const myUser = useAuthStore((s) => s.user);

    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 노쇼 확인 팝업
    const [noshowTarget, setNoshowTarget] = useState(null); // { userIdx, nickname }
    const [isReporting, setIsReporting] = useState(false);

    // 채팅방 나가기 확인 팝업
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const mountedRef = useRef(true);

    const panelWidth = Math.min(PANEL_WIDTH, screenWidth * 0.85);
    const overlayWidth = screenWidth - panelWidth;

    // 드라이브 시작 1시간 전부터 노쇼 신고 가능
    const isNoshowEnabled = useMemo(() => {
        if (!data?.driveDate || !data?.driveStartTime) return false;
        const driveStart = dayjs(`${data.driveDate} ${data.driveStartTime}`);
        return driveStart.diff(dayjs(), 'hour', true) <= 1;
    }, [data]);

    const load = useCallback(async () => {
        try {
            const res = await chatApi.getMembers(Number(roomIdx));
            if (mountedRef.current) setData(res.data || null);
        } catch (_) {
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [roomIdx]);

    useEffect(() => {
        mountedRef.current = true;
        load();
        return () => { mountedRef.current = false; };
    }, [load]);

    const handleNoshowPress = useCallback((member) => {
        setNoshowTarget({ userIdx: member.userIdx, nickname: member.nickname });
    }, []);

    const handleNoshowConfirm = useCallback(async () => {
        if (!noshowTarget || isReporting) return;
        setIsReporting(true);
        try {
            await chatApi.reportNoshow({ roomIdx: Number(roomIdx), targetUserIdx: noshowTarget.userIdx });
            showToast('success', '노쇼 신고가 접수되었습니다. 10분 후 자동 확정됩니다.');
            setNoshowTarget(null);
            await load();
        } catch (_) {
            showToast('error', '신고 처리 중 오류가 발생했습니다.');
            setNoshowTarget(null);
        } finally {
            setIsReporting(false);
        }
    }, [noshowTarget, isReporting, roomIdx, load]);

    const handleLeave = useCallback(async () => {
        if (isLeaving) return;
        setIsLeaving(true);
        try {
            await chatApi.cancelMatch(Number(roomIdx));
            setShowLeaveConfirm(false);
            // members 모달 + 채팅방 화면 모두 닫고 채팅 목록으로 이동
            if (router.canDismiss()) router.dismissAll();
            router.replace('/(tabs)/chat');
        } catch (_) {
            showToast('error', '처리 중 오류가 발생했습니다.');
            setShowLeaveConfirm(false);
        } finally {
            setIsLeaving(false);
        }
    }, [isLeaving, roomIdx, router]);

    const renderAvatar = useCallback((member) => {
        const uri = member.profileImage ? STORAGE_URL + member.profileImage : null;
        if (uri) {
            return <Image source={{ uri }} style={styles.avatar} contentFit="cover" />;
        }
        return (
            <Image
                source={require('../../assets/icons/profile-avatar.svg')}
                style={styles.avatar}
                contentFit="cover"
            />
        );
    }, []);

    const renderTags = useCallback((member) => {
        const tags = [];
        tags.push(member.role === 'owner' ? '오너' : '게스트');
        if (member.job) tags.push(member.job);
        return (
            <View style={styles.tagsRow}>
                {tags.map((tag, i) => (
                    <View key={i} style={styles.tagChip}>
                        <Text style={styles.tagText} allowFontScaling={false}>{tag}</Text>
                    </View>
                ))}
            </View>
        );
    }, []);

    const renderMemberRow = useCallback((member) => {
        const isMe = member.userIdx === myUser?.idx;
        const alreadyReported = !!member.noshowReportedAt;
        const noshowConfirmed = member.noshowConfirmed === 1;
        const noshowDisabled = !isNoshowEnabled || alreadyReported || noshowConfirmed;
        const noshowLabel = noshowConfirmed ? '확정' : alreadyReported ? '신고됨' : '노쇼';
        // [BUG-3] 노쇼/전화 버튼은 매칭 작성자만 사용 가능 (대상은 본인 제외 + 작성자 본인 제외)
        const isMeAuthor = !!data?.isMeAuthor;
        const isMemberAuthor = !!member.isAuthor;
        const showActions = isMeAuthor && !isMe && !isMemberAuthor;

        return (
            <View key={member.userIdx} style={styles.memberRow}>
                {/* 아바타 */}
                {renderAvatar(member)}

                {/* 닉네임 + 크라운 + 태그 */}
                <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                        <Text
                            style={styles.memberName}
                            allowFontScaling={false}
                            numberOfLines={1}
                        >
                            {member.nickname}
                        </Text>
                        {member.role === 'owner' && (
                            <Image
                                source={require('../../assets/icons/crown.svg')}
                                style={styles.crownIcon}
                                contentFit="contain"
                            />
                        )}
                    </View>
                    {renderTags(member)}
                </View>

                {/* 우측 버튼들 (작성자만, 본인/작성자 제외) */}
                {showActions && (
                    <View style={styles.actionBtns}>
                        {/* 노쇼 신고 버튼 */}
                        <TouchableOpacity
                            style={[
                                styles.noshowBtn,
                                noshowDisabled && styles.noshowBtnDisabled,
                            ]}
                            onPress={() => handleNoshowPress(member)}
                            disabled={noshowDisabled}
                            testID={`members-noshow-${member.userIdx}`}
                        >
                            <Image
                                source={require('../../assets/icons/alarm-warning.svg')}
                                style={styles.noshowBtnIcon}
                                contentFit="contain"
                                tintColor={noshowDisabled ? COLORS.grayCC : COLORS.danger}
                            />
                            <Text
                                style={[
                                    styles.noshowBtnText,
                                    noshowDisabled && styles.noshowBtnTextDisabled,
                                ]}
                                allowFontScaling={false}
                            >
                                {noshowLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }, [myUser?.idx, isNoshowEnabled, data?.isMeAuthor, renderAvatar, renderTags, handleNoshowPress]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* 어두운 오버레이 (왼쪽) */}
            <TouchableOpacity
                style={[styles.overlay, { width: overlayWidth }]}
                activeOpacity={1}
                onPress={() => router.back()}
                testID="members-overlay"
            />

            {/* 슬라이드 패널 (오른쪽) */}
            <View style={[styles.panel, { width: panelWidth, paddingTop: insets.top }]}>
                {/* 헤더 */}
                <View style={styles.panelHeader}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        testID="members-close-btn"
                    >
                        <Image
                            source={require('../../assets/icons/close.svg')}
                            style={styles.closeIcon}
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                    <Text style={styles.panelTitle} allowFontScaling={false}>참여 인원</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    </View>
                ) : (
                    <>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={[
                                styles.scrollContent,
                                { paddingBottom: insets.bottom + 72 },
                            ]}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* 매칭 확정 섹션 */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle} allowFontScaling={false}>매칭 확정</Text>
                                {data?.confirmedMembers?.length > 0 ? (
                                    data.confirmedMembers.map(renderMemberRow)
                                ) : (
                                    <Text style={styles.emptyText} allowFontScaling={false}>
                                        매칭 확정한 회원이 없습니다.
                                    </Text>
                                )}
                            </View>

                            <View style={styles.divider} />

                            {/* 참여 인원 섹션 */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle} allowFontScaling={false}>참여 인원</Text>

                                {/* 오너 */}
                                {data?.owners?.length > 0 && (
                                    <>
                                        <Text style={styles.roleLabel} allowFontScaling={false}>
                                            오너 {data.owners.length}명
                                        </Text>
                                        {data.owners.map(renderMemberRow)}
                                    </>
                                )}

                                {/* 게스트 */}
                                {data?.guests?.length > 0 && (
                                    <>
                                        <Text style={[styles.roleLabel, { marginTop: SPACING.lg }]} allowFontScaling={false}>
                                            게스트 {data.guests.length}명
                                        </Text>
                                        {data.guests.map(renderMemberRow)}
                                    </>
                                )}
                            </View>
                        </ScrollView>

                        {/* 채팅방 나가기 푸터 */}
                        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
                            <TouchableOpacity
                                style={styles.leaveBtn}
                                onPress={() => setShowLeaveConfirm(true)}
                                testID="members-leave-btn"
                            >
                                <Image
                                    source={require('../../assets/icons/mypage-logout.svg')}
                                    style={styles.leaveIcon}
                                    contentFit="contain"
                                />
                                <Text style={styles.leaveBtnText} allowFontScaling={false}>
                                    채팅방 나가기(매칭불참)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* 노쇼 신고 확인 팝업 */}
            <Modal
                visible={!!noshowTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setNoshowTarget(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.popupCard}>
                        <View style={styles.popupBody}>
                            <Text style={styles.popupTitle} allowFontScaling={false}>
                                노쇼 신고
                            </Text>
                            <Text style={styles.popupDesc} allowFontScaling={false}>
                                {`${noshowTarget?.nickname || ''}님을 노쇼로 신고하시겠습니까?\n10분 후 자동 확정되며, 상대방에게 10,000P가 차감됩니다.`}
                            </Text>
                        </View>
                        <View style={styles.popupBtns}>
                            <TouchableOpacity
                                style={[styles.popupBtn, styles.popupBtnGrayBg]}
                                onPress={() => setNoshowTarget(null)}
                                disabled={isReporting}
                                testID="members-noshow-popup-cancel"
                            >
                                <Text style={styles.popupBtnGrayText} allowFontScaling={false}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.popupBtn, styles.popupBtnDanger]}
                                onPress={handleNoshowConfirm}
                                disabled={isReporting}
                                testID="members-noshow-popup-ok"
                            >
                                {isReporting ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.popupBtnWhiteText} allowFontScaling={false}>신고</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 채팅방 나가기 확인 팝업 */}
            <Modal
                visible={showLeaveConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLeaveConfirm(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.popupCard}>
                        <View style={styles.popupBody}>
                            <Text style={styles.popupTitle} allowFontScaling={false}>
                                {'채팅방 나가기\n(매칭 불참)'}
                            </Text>
                            <Text style={styles.popupDesc} allowFontScaling={false}>
                                매칭 불참시 사용된 포인트는 환불되지 않습니다.
                            </Text>
                        </View>
                        <View style={styles.popupBtns}>
                            <TouchableOpacity
                                style={[styles.popupBtn, styles.popupBtnGrayBg]}
                                onPress={() => setShowLeaveConfirm(false)}
                                disabled={isLeaving}
                                testID="members-leave-popup-cancel"
                            >
                                <Text style={styles.popupBtnGrayText} allowFontScaling={false}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.popupBtn, styles.popupBtnDarkGray]}
                                onPress={handleLeave}
                                disabled={isLeaving}
                                testID="members-leave-popup-ok"
                            >
                                {isLeaving ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.popupBtnWhiteText} allowFontScaling={false}>나가기</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
    },

    // 왼쪽 어두운 오버레이
    overlay: {
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },

    // 오른쪽 패널
    panel: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    // 패널 헤더
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        gap: SPACING.md,
    },
    closeIcon: {
        width: 24,
        height: 24,
    },
    panelTitle: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.textPrimary,
    },

    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 스크롤
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: SPACING.xl,
    },

    // 섹션
    section: {
        paddingHorizontal: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    roleLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xs,
        color: COLORS.grayMedium,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xs,
        color: '#C5C5CD',
        textAlign: 'center',
        paddingVertical: SPACING.lg,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.grayEE,
        marginVertical: SPACING.xl,
        marginHorizontal: SPACING.xl,
    },

    // 멤버 행
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        flexShrink: 0,
    },
    memberInfo: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    memberName: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    crownIcon: {
        width: 16,
        height: 16,
        flexShrink: 0,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tagChip: {
        backgroundColor: COLORS.grayF1,
        borderRadius: 6,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
    },
    tagText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        color: COLORS.grayMedium,
        lineHeight: 13,
    },

    // 액션 버튼들
    actionBtns: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        flexShrink: 0,
    },
    noshowBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.danger,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        overflow: 'hidden',
    },
    noshowBtnDisabled: {
        borderColor: COLORS.grayCC,
    },
    noshowBtnIcon: {
        width: 16,
        height: 16,
    },
    noshowBtnText: {
        fontFamily: FONTS.medium,
        fontSize: 9,
        color: COLORS.danger,
        lineHeight: 11,
    },
    noshowBtnTextDisabled: {
        color: COLORS.grayCC,
    },

    // 푸터
    footer: {
        backgroundColor: COLORS.grayF1,
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    leaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
    },
    leaveIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.textPrimary,
    },
    leaveBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },

    // 팝업
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    popupCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.xxxl,
        width: '100%',
        gap: SPACING.xxxl,
    },
    popupBody: {
        gap: SPACING.sm,
    },
    popupTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    popupDesc: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    popupBtns: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    popupBtn: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupBtnGrayBg: {
        backgroundColor: COLORS.grayEE,
    },
    popupBtnDanger: {
        backgroundColor: COLORS.danger,
    },
    popupBtnDarkGray: {
        backgroundColor: COLORS.textMedium,
    },
    popupBtnGrayText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    popupBtnWhiteText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
});
