import { View, Text, StyleSheet, Pressable, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import useAuthStore from '../store/authStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../constants/config';
import { ensureArray } from '../utils/ensureArray';

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${ampm}${h12}시${m !== 0 ? ` ${m}분` : ''}`;
}

function buildInfoLine(label, genderArr, ageArr, count) {
    const gFiltered = (genderArr || []).filter(g => g !== 'any');
    const aFiltered = (ageArr || []).filter(a => a !== 'any')
        .sort((a, b) => parseInt(a) - parseInt(b));
    let gText;
    if (gFiltered.length === 0 || gFiltered.length >= 2) gText = '남녀 무관';
    else if (gFiltered[0] === 'M') gText = '남성';
    else gText = '여성';
    const aText = aFiltered.length > 0 ? aFiltered.map(a => `${a}대`).join(',') : '전 연령';
    const countText = count > 0 ? `, 총 ${count}명` : '';
    return `${label} - ${gText}, ${aText}${countText}`;
}

export default function MatchCard({ item, configStore, needsEvaluation }) {
    const { width: frameWidth } = useSafeAreaFrame();
    const router = useRouter();
    const currentUser = useAuthStore(s => s.user);
    const author = item.author;
    const firstPhoto = item.photos?.[0];
    const isAuthor = item.authorIdx === currentUser?.idx;
    const isOneToOne = item.matchType === 'one_to_one';
    // [P-8][C117-4] 서버 계산값 우선, 없으면 클라이언트 계산 fallback
    // [F1][C123] 1:1 미확정: requested+rejected, 모임: accepted 기준
    const applicantCount = typeof item.applicantCount === 'number'
        ? item.applicantCount
        : (item.participants || []).filter(p =>
            p.userIdx !== item.authorIdx &&
            (isOneToOne ? (p.status === 'requested' || p.status === 'rejected') : p.status === 'accepted')
        ).length;
    // [F1][C122] 작성자 제외 확정(accepted) 수 — 1:1 "N명 확정" 라벨 전환용
    const confirmedCount = typeof item.confirmedCount === 'number'
        ? item.confirmedCount
        : (item.participants || []).filter(p =>
            p.userIdx !== item.authorIdx && p.status === 'accepted'
        ).length;
    // [F1][C122] 1:1은 1명 확정 시 매칭 완료 → "N명 확정", 그 외 "N명 신청중"
    const isOneToOneConfirmed = isOneToOne && confirmedCount >= 1;
    const countNumber = isOneToOneConfirmed ? confirmedCount : applicantCount;
    const countSuffix = isOneToOneConfirmed ? ' 확정' : ' 신청중';
    const isCompleted = ['completed', 'cancelled', 'no_show'].includes(item.status);
    const isMatched = item.status === 'confirmed' || item.status === 'in_progress';

    const driveDate = item.driveDate ? dayjs(item.driveDate) : null;
    const today = dayjs().startOf('day');
    const dDay = driveDate ? driveDate.diff(today, 'day') : null;

    const driveLevel = author?.ownerProfile?.driveLevel;
    const driveLevelLabel = driveLevel ? configStore.getLabel('driveLevels', driveLevel).split('(')[0] : '';
    const birthYear = author?.birthDate ? dayjs(author.birthDate).year() : null;
    const authorAge = birthYear ? `${Math.floor((dayjs().year() - birthYear) / 10) * 10}대` : '';
    const authorGender = author?.gender === 'M' ? '남' : author?.gender === 'F' ? '여' : '';

    const matchTypeLabel = item.matchType === 'one_to_one' ? '1:1 매칭' : '모임 매칭';
    const firstDest = item.destinations?.[0];
    const titleText = item.title?.trim()
        ? item.title
        : (firstDest?.sigungu ? `'${firstDest.sigungu}' 드라이브` : '드라이브');
    const matchNo = `NO.${String(item.idx).padStart(10, '0')}`;

    const isAuthorOwner = item.authorRole === 'owner';
    const ownerGender = ensureArray(item.ownerGender);
    const ownerAge = ensureArray(item.ownerAge);
    const guestGender = ensureArray(item.guestGender);
    const guestAge = ensureArray(item.guestAge);
    const ownerMax = item.ownerMaxCount || 0;
    const guestMax = item.guestMaxCount || 0;
    const infoLines = [];
    if (isOneToOne) {
        if (isAuthorOwner) infoLines.push(buildInfoLine('게스트', guestGender, guestAge, 1));
        else infoLines.push(buildInfoLine('오너', ownerGender, ownerAge, 1));
    } else {
        if (ownerMax > 0) infoLines.push(buildInfoLine('오너', ownerGender, ownerAge, ownerMax));
        if (guestMax > 0) infoLines.push(buildInfoLine('게스트', guestGender, guestAge, guestMax));
    }

    const dateStr = item.driveDate ? dayjs(item.driveDate).format('YYYY.MM.DD') : '';
    const startFmt = formatTime(item.driveStartTime);
    // [M1] 종료 < 시작이면 익일 종료
    const isOvernight = item.driveStartTime && item.driveEndTime && item.driveEndTime < item.driveStartTime;
    const endFmt = (isOvernight ? '익일 ' : '') + formatTime(item.driveEndTime);
    const timeText = dateStr ? `${dateStr} ${startFmt}~${endFmt}` : '';

    return (
        <Pressable
            style={styles.matchCard}
            onPress={() => router.navigate(`/match/${item.idx}?matchType=${item.matchType || ''}`)}
            testID={`matchcard-${item.idx}`}
        >
            <View style={styles.matchRegionRow}>
                <Image source={require('../../assets/icons/location-info.svg')} style={{ width: 20, height: 20 }} />
                <Text style={styles.matchRegionText} allowFontScaling={false} numberOfLines={1}>
                    {Array.isArray(item.meetingRegions) && item.meetingRegions.length > 0
                        ? item.meetingRegions.map(r => [r.sido, r.sigungu].filter(Boolean).join(' ')).filter(Boolean).join(', ')
                        : '지역 미설정'}
                </Text>
            </View>

            <View style={styles.matchCardTop}>
                {firstPhoto && (
                    <View style={[styles.matchPhoto, {  }]}>
                        <Image source={{ uri: STORAGE_URL + firstPhoto.imageUrl }} style={styles.matchPhotoImg} contentFit="cover" />
                    </View>
                )}
                
                <View style={styles.matchInfo}>
                    <View style={styles.matchInfoTop}>
                        <View style={styles.matchInfoLeft}>
                            <Text style={styles.matchTitle} allowFontScaling={false} numberOfLines={1}>
                                {titleText}
                            </Text>
                            <View style={styles.matchSubRow}>
                                {driveLevelLabel ? (
                                    <Text style={styles.matchSubText} allowFontScaling={false}>{driveLevelLabel}</Text>
                                ) : null}
                                {driveLevelLabel ? <View style={styles.matchSubDivider} /> : null}
                                <Text style={styles.matchSubText} allowFontScaling={false}>매너 {author?.mannerScore != null ? Math.round(Number(author.mannerScore)) : '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.matchTypeCol}>
                            <View style={styles.matchTypeBadge}>
                                <Text style={styles.matchTypeText} allowFontScaling={false}>{matchTypeLabel}</Text>
                            </View>
                            <Text style={styles.matchParticipants} allowFontScaling={false}>
                                <Text style={styles.matchParticipantsBold}>{countNumber}명</Text>
                                <Text style={styles.matchParticipantsSub}>{countSuffix}</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.matchAuthorRow, { justifyContent: 'space-between' }]}>
                        <View style={[styles.matchAuthorRow, { flex: 1 }]}>
                            <View style={styles.matchAuthorAvatar}>
                                {author?.profileImage ? (
                                    <Image source={{ uri: STORAGE_URL + author.profileImage }} style={styles.matchAuthorImg} contentFit="cover" />
                                ) : (
                                    <Image source={require('../../assets/icons/profile-avatar.svg')} style={styles.matchAuthorImg} />
                                )}
                            </View>
                            <Text style={styles.matchAuthorText} allowFontScaling={false} numberOfLines={1}>
                                {author?.nickname} · {authorAge} · {authorGender}
                            </Text>
                        </View>

                        {dDay !== null && dDay >= 0 && (
                            <View style={[styles.dDayBadge, dDay <= 1 && { backgroundColor: COLORS.secondary }]}>
                                <Text style={styles.dDayText} allowFontScaling={false}>
                                    {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                </View>
                
            </View>

            <View style={styles.matchDateRow}>
                <View style={styles.matchDateLeft}>
                    <Image source={require('../../assets/icons/calendar.svg')} style={{ width: 16, height: 16 }} />
                    <Text style={styles.matchDateText} allowFontScaling={false} numberOfLines={1}>{timeText}</Text>
                </View>

                {!isCompleted && !isMatched && dDay >= 0 ? (
                    <View style={[styles.dDayBadge, { backgroundColor: COLORS.primary }]}>
                        <Text style={[styles.dDayText, { color: COLORS.white }]} allowFontScaling={false}>
                            참여하기
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.dDayBadge, { backgroundColor: '#EEEEEE' }]}>
                        <Text style={[styles.dDayText, { color: '#969698' }]} allowFontScaling={false}>매칭 완료</Text>
                    </View>
                )}
                
                {/* {!isCompleted && !isMatched && dDay !== null && (
                    <View style={[styles.dDayBadge, dDay <= 1 && { backgroundColor: COLORS.secondary }]}>
                        <Text style={styles.dDayText} allowFontScaling={false}>
                            {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
                        </Text>
                    </View>
                )}
                {isMatched && (
                    <View style={[styles.dDayBadge, { backgroundColor: '#EEEEEE' }]}>
                        <Text style={[styles.dDayText, { color: '#969698' }]} allowFontScaling={false}>매칭 완료</Text>
                    </View>
                )} */}
                
            </View>

            {/* <View style={styles.divider} />

            <View style={styles.matchBottom}>
                <View style={styles.matchRegionRow}>
                    <Image source={require('../../assets/icons/location-info.svg')} style={{ width: 20, height: 20 }} />
                    <Text style={styles.matchRegionText} allowFontScaling={false} numberOfLines={1}>
                        {Array.isArray(item.meetingRegions) && item.meetingRegions.length > 0
                            ? item.meetingRegions.map(r => [r.sido, r.sigungu].filter(Boolean).join(' ')).filter(Boolean).join(', ')
                            : '지역 미설정'}
                    </Text>
                </View>
                {infoLines.map((line, i) => (
                    <Text key={i} style={styles.matchGenderAge} allowFontScaling={false} numberOfLines={1}>
                        {line}
                    </Text>
                ))}
                <Text style={styles.matchContent} allowFontScaling={false} numberOfLines={2}>
                    {item.content}
                </Text>
            </View> */}

            {/* {needsEvaluation?.[item.idx] && (() => {
                const isAuthor = item.authorIdx === currentUser?.idx;
                const acceptedParticipant = (item.participants || []).find(p => p.status === 'accepted');
                const targetNickname = isAuthor
                    ? (acceptedParticipant?.user?.nickname || '')
                    : (item.author?.nickname || '');
                const targetUserIdx = isAuthor
                    ? (acceptedParticipant?.userIdx || '')
                    : (item.authorIdx || '');
                return (
                    <TouchableOpacity
                        testID="home-manner-eval-btn"
                        style={styles.mannerEvalBtn}
                        onPress={() => router.navigate('/review/manner-eval?matchIdx=' + item.idx + '&targetNickname=' + encodeURIComponent(targetNickname) + '&targetUserIdx=' + targetUserIdx)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.mannerEvalBtnText} allowFontScaling={false}>매너 평가하기</Text>
                    </TouchableOpacity>
                );
            })()} */}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    matchCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.xl,
        marginHorizontal: SPACING.xl,
        marginTop: SPACING.sm,
        gap: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },
    matchNo: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.textMedium,
    },
    matchCardTop: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    matchPhoto: {
        width: 96,
        aspectRatio: 4/3,
        borderRadius: 8,
        overflow: 'hidden',
    },
    matchPhotoImg: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    matchInfo: {
        flex: 1,
        gap: 4,
    },
    matchInfoTop: {
        flexDirection: 'row',
    },
    matchInfoLeft: {
        flex: 1,
        gap: 4,
    },
    matchTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    matchSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchSubText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#969698',
    },
    matchSubDivider: {
        width: 1,
        height: 10,
        backgroundColor: '#EEEEEE',
    },
    matchAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    matchAuthorAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    matchAuthorImg: {
        width: 24,
        height: 24,
        backgroundColor: COLORS.grayF1
    },
    matchAuthorText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#969698',
    },
    matchTypeCol: {
        alignItems: 'center',
        gap: 4,
    },
    matchTypeBadge: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 4,
        width: 48,
        paddingVertical: 2,
        alignItems: 'center',
    },
    matchTypeText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.primary,
        textAlign: 'center',
    },
    matchParticipants: {
        textAlign: 'center',
    },
    matchParticipantsBold: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    matchParticipantsSub: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: '#969698',
    },
    matchDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchDateLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    matchDateText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    dDayBadge: {
        backgroundColor: COLORS.secondary,
        borderRadius: 100,
        width: 64,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dDayText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
    },
    matchBottom: {
        gap: 4,
    },
    matchRegionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    matchRegionText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    matchGenderAge: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#969698',
    },
    matchContent: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textMedium,
    },
    mannerEvalBtn: {
        marginTop: SPACING.md,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    mannerEvalBtnText: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.white,
    },
});
