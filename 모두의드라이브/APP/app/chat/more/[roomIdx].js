import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    ScrollView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import chatApi from '../../../src/api/chat';
import useChatStore from '../../../src/store/chatStore';
import useConfigStore from '../../../src/store/configStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../../src/constants/config';
import { showToast } from '../../../src/utils/toast';

function MemberRow({ member, myUserIdx, roomIdx, showActions, driveDate, driveStartTime, isMeAuthor, onAfterAction, onPressProfile }) {
    const avatarUri = member.profileImage ? STORAGE_URL + member.profileImage : null;
    const isMe = member.userIdx === myUserIdx;
    const isNoshowReported = !!member.noshowReportedAt;
    const noshowConfirmed = member.noshowConfirmed === 1;
    const driveTypes = useConfigStore(s => s.driveTypes);
    const driveLevels = useConfigStore(s => s.driveLevels);
    const genders = useConfigStore(s => s.genders);

    const canCancelReport = useMemo(() => {
        if (!isNoshowReported || noshowConfirmed) return false;
        const reportedAt = dayjs(member.noshowReportedAt);
        return dayjs().diff(reportedAt, 'minute', true) <= 10;
    }, [isNoshowReported, noshowConfirmed, member.noshowReportedAt]);

    const handleNoshow = useCallback(() => {
        if (!driveDate || !driveStartTime) {
            Alert.alert('알림', '약속 정보를 확인할 수 없어 노쇼 신고가 불가능합니다.');
            return;
        }
        const driveStart = dayjs(`${driveDate} ${driveStartTime}`);
        if (driveStart.diff(dayjs(), 'hour', true) > 1) {
            Alert.alert('알림', '드라이브 시작 1시간 전부터 노쇼 신고가 가능합니다.');
            return;
        }
        Alert.alert('노쇼 신고', `${member.nickname || '탈퇴한 회원'}님을 노쇼 신고하시겠습니까?\n10분 후 자동 확정됩니다.`, [
            { text: '취소', style: 'cancel' },
            {
                text: '신고', style: 'destructive', onPress: async () => {
                    try {
                        await chatApi.reportNoshow({ roomIdx: Number(roomIdx), targetUserIdx: member.userIdx });
                        showToast('success', '노쇼 신고가 접수되었습니다.');
                        onAfterAction?.();
                    } catch (e) {
                        showToast('error', e?.response?.data?.message || '신고에 실패했습니다.');
                    }
                },
            },
        ]);
    }, [member, roomIdx, driveDate, driveStartTime, onAfterAction]);

    const handleCancelNoshow = useCallback(() => {
        Alert.alert('노쇼 신고 취소', `${member.nickname || '탈퇴한 회원'}님의 노쇼 신고를 취소하시겠습니까?`, [
            { text: '돌아가기', style: 'cancel' },
            {
                text: '신고 취소', style: 'destructive', onPress: async () => {
                    try {
                        await chatApi.cancelNoshow({ roomIdx: Number(roomIdx), targetUserIdx: member.userIdx });
                        showToast('success', '신고가 취소되었습니다.');
                        onAfterAction?.();
                    } catch (e) {
                        showToast('error', e?.response?.data?.message || '신고 취소에 실패했습니다.');
                    }
                },
            },
        ]);
    }, [member, roomIdx, onAfterAction]);

    const tags = [];
    if (member.gender) {
        const g = genders.find(x => x.key === member.gender);
        tags.push(g?.label || (member.gender === 'male' ? '남자' : '여자'));
    }
    if (member.ageGroup) tags.push(`${member.ageGroup}대`);
    if (member.role === 'owner' && member.driveLevel) {
        const lv = driveLevels.find(x => x.key === member.driveLevel);
        tags.push(lv?.label?.replace(/\s*\(.*\)$/, '') || member.driveLevel);
    }
    // if (member.role === 'owner' && Array.isArray(member.driveModes)) {
    //     member.driveModes.forEach(key => {
    //         const dt = driveTypes.find(x => x.key === key);
    //         tags.push(dt?.label || key);
    //     });
    // }

    const showCrown = !!member.isAuthor;
    const showNoshowBtn = isMeAuthor && !isMe && !member.isAuthor && !!member.nickname;

    return (
        <View style={styles.memberRow}>
            <TouchableOpacity
                style={styles.memberPressArea}
                onPress={() => !isMe && member.nickname && onPressProfile?.(member.userIdx)}
                disabled={isMe || !member.nickname}
                activeOpacity={isMe || !member.nickname ? 1 : 0.7}
                testID={`chatmore-member-${member.userIdx}`}
            >
                <View style={styles.avatarWrap}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <Image
                            source={require('../../../assets/icons/profile-avatar.svg')}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    )}
                </View>
                <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.nickname} numberOfLines={1} allowFontScaling={false}>
                            {member.nickname || '탈퇴한 회원'}
                        </Text>
                        {showCrown && (
                            <Image
                                source={require('../../../assets/icons/crown.svg')}
                                style={{ width: 16, height: 16 }}
                                contentFit="contain"
                            />
                        )}
                    </View>
                    {tags.length > 0 && (
                        <View style={styles.tagRow}>
                            {tags.map((tag, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText} allowFontScaling={false}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            {showActions && showNoshowBtn && (
                <View style={styles.actionRow}>
                    {canCancelReport ? (
                        <TouchableOpacity
                            style={styles.noshowBtn}
                            onPress={handleCancelNoshow}
                            testID={`chatmore-noshow-cancel-${member.userIdx}`}
                        >
                            <Image
                                source={require('../../../assets/icons/alarm-warning.svg')}
                                style={{ width: 16, height: 16 }}
                                contentFit="contain"
                                tintColor="#E02E2E"
                            />
                            <Text style={[styles.noshowText, { fontSize: 10 }]} allowFontScaling={false}>신고취소</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.noshowBtn, (isNoshowReported || noshowConfirmed) && styles.noshowBtnDisabled]}
                            onPress={handleNoshow}
                            disabled={isNoshowReported || noshowConfirmed}
                            testID={`chatmore-noshow-${member.userIdx}`}
                        >
                            <Image
                                source={require('../../../assets/icons/alarm-warning.svg')}
                                style={{ width: 16, height: 16 }}
                                contentFit="contain"
                                tintColor="#E02E2E"
                            />
                            <Text style={styles.noshowText} allowFontScaling={false}>노쇼</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

export default function ChatMoreScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { roomIdx } = useLocalSearchParams();
    const setPendingAction = useChatStore((s) => s.setPendingAction);

    const [members, setMembers] = useState(null);
    const [matchStatus, setMatchStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadAll = useCallback(async () => {
        try {
            const [membersRes, statusRes] = await Promise.all([
                chatApi.getMembers(Number(roomIdx)),
                chatApi.getMatchStatus(Number(roomIdx)),
            ]);
            setMembers(membersRes.data || null);
            setMatchStatus(statusRes.data || null);
        } catch (_) {
            showToast('error', '정보를 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [roomIdx]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const refreshMembers = useCallback(async () => {
        try {
            const res = await chatApi.getMembers(Number(roomIdx));
            setMembers(res.data || null);
        } catch (_) {}
    }, [roomIdx]);

    const isMatchCancelled = matchStatus?.matchStatus === 'cancelled';
    const myConfirmed = matchStatus?.myConfirmed === true;

    const isCancelDisabled = useMemo(() => {
        if (!matchStatus?.driveDate || !matchStatus?.driveStartTime) return false;
        const driveStart = dayjs(`${matchStatus.driveDate} ${matchStatus.driveStartTime}`);
        return driveStart.diff(dayjs(), 'hour', true) < 1;
    }, [matchStatus]);

    const handleConfirmPress = useCallback(() => {
        setPendingAction('confirm');
        router.back();
    }, [router, setPendingAction]);

    const handleLeavePress = useCallback(() => {
        setPendingAction('cancel');
        router.back();
    }, [router, setPendingAction]);

    const handleProfilePress = useCallback((userIdx) => {
        if (!userIdx) return;
        router.navigate(`/profile/${userIdx}`);
    }, [router]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.headerIconBtn}
                    testID="chatmore-back-btn"
                >
                    <Image
                        source={require('../../../assets/icons/arrow-back.svg')}
                        style={styles.headerIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>

                <View style={styles.headerSpacer} />

                <View style={styles.headerRightSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle} allowFontScaling={false}>매칭 확정</Text>
                            {members?.confirmedMembers?.length > 0 ? (
                                <View style={styles.memberList}>
                                    {members.confirmedMembers.map((m) => (
                                        <MemberRow
                                            key={m.userIdx}
                                            member={m}
                                            myUserIdx={members.myUserIdx}
                                            roomIdx={roomIdx}
                                            isMeAuthor={members.isMeAuthor}
                                            onPressProfile={handleProfilePress}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.emptyText} allowFontScaling={false}>매칭 확정한 회원이 없습니다.</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle} allowFontScaling={false}>참여 인원</Text>

                            {members?.owners?.length > 0 && (
                                <View style={styles.roleGroup}>
                                    <Text style={styles.roleLabel} allowFontScaling={false}>
                                        오너 <Text style={styles.roleCount}>{members.owners.length}</Text>명
                                    </Text>
                                    {members.owners.map((m) => (
                                        <MemberRow
                                            key={m.userIdx}
                                            member={m}
                                            myUserIdx={members.myUserIdx}
                                            roomIdx={roomIdx}
                                            isMeAuthor={members.isMeAuthor}
                                            showActions
                                            driveDate={members.driveDate}
                                            driveStartTime={members.driveStartTime}
                                            onAfterAction={refreshMembers}
                                            onPressProfile={handleProfilePress}
                                        />
                                    ))}
                                </View>
                            )}

                            {members?.guests?.length > 0 && (
                                <View style={styles.roleGroup}>
                                    <Text style={styles.roleLabel} allowFontScaling={false}>
                                        게스트 <Text style={styles.roleCount}>{members.guests.length}</Text>명
                                    </Text>
                                    {members.guests.map((m) => (
                                        <MemberRow
                                            key={m.userIdx}
                                            member={m}
                                            myUserIdx={members.myUserIdx}
                                            roomIdx={roomIdx}
                                            isMeAuthor={members.isMeAuthor}
                                            showActions
                                            driveDate={members.driveDate}
                                            driveStartTime={members.driveStartTime}
                                            onAfterAction={refreshMembers}
                                            onPressProfile={handleProfilePress}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={{ gap: 12 }}>
                        {!myConfirmed && !isMatchCancelled && (
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirmPress}
                                testID="chatmore-confirm-btn"
                            >
                                <Text style={styles.confirmText} allowFontScaling={false}>매칭 확정</Text>
                            </TouchableOpacity>
                        )}
                        {!matchStatus?.isAuthor && (
                            <TouchableOpacity
                                style={[styles.leaveBtn, (isMatchCancelled || isCancelDisabled) && styles.leaveBtnDisabled, {paddingBottom: insets.bottom + 20}]}
                                onPress={handleLeavePress}
                                disabled={isMatchCancelled || isCancelDisabled}
                                testID="chatmore-leave-btn"
                            >
                                <Image
                                    source={require('../../../assets/icons/mypage-logout.svg')}
                                    style={{ width: 24, height: 24 }}
                                    contentFit="contain"
                                />
                                <Text style={styles.leaveText} allowFontScaling={false}>채팅방 나가기(매칭불참)</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerIconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        width: 24,
        height: 24,
    },
    headerSpacer: {
        flex: 1,
    },
    headerRightSpacer: {
        width: 32,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollInner: {
        padding: 20,
        gap: 20,
    },
    section: {
        gap: 20,
    },
    sectionTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    emptyText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#C5C5CD',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
    },
    roleGroup: {
        gap: 12,
    },
    roleLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    roleCount: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    memberList: {
        gap: 12,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    memberPressArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
    },
    avatarWrap: {
        width: 38,
        height: 38,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        backgroundColor: COLORS.grayF1
    },
    memberInfo: {
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nickname: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 4,
    },
    tag: {
        backgroundColor: '#F1F1F1',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tagText: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 16,
        color: '#969698',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        flexShrink: 0,
    },
    noshowBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E02E2E',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
    },
    noshowBtnDisabled: {
        opacity: 0.4,
    },
    noshowText: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: '#E02E2E',
    },
    confirmBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 8,
    },
    confirmText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
    leaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        backgroundColor: '#F1F1F1',
        padding: 20,
    },
    leaveBtnDisabled: {
        opacity: 0.4,
    },
    leaveText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
});
