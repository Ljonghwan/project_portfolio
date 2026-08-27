import {
    View,
    Text,
    StyleSheet,
    SectionList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import notificationApi from '../../src/api/notification';
import matchAlarmApi from '../../src/api/matchAlarm';
import useNotificationStore from '../../src/store/notificationStore';

dayjs.locale('ko');

const HEADER_BAR_HEIGHT = 56;
const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const BADGE_MAP = {
    match_apply:  { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '매칭' },
    match_accept: { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '수락' },
    match_reject: { bg: COLORS.grayEE,     text: COLORS.textMedium, label: '거절' },
    match_absent: { bg: COLORS.grayEE,     text: COLORS.textMedium, label: '불참' },
    like:         { bg: '#FFE4F0',          text: '#E0467B',         label: '좋아요' },
    noshow:       { bg: '#FFD8D8',          text: '#E02E2E',         label: '노쇼' },
    point:        { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '포인트' },
    event:        { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '이벤트' },
    notice:       { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '공지' },
    manner_eval:  { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '평가' },
    chat:         { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '채팅' },
    match_filter: { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '매칭' },
    admin_push:   { bg: COLORS.primaryBg,  text: COLORS.primary,    label: '공지' },
    noshow_confirmed: { bg: '#FFD8D8',      text: '#E02E2E',         label: '노쇼' },
    general:      { bg: COLORS.grayEE,     text: COLORS.textMedium, label: '알림' },
};

function getBadge(type) {
    return BADGE_MAP[type] || BADGE_MAP.general;
}

function groupByDate(notifications) {
    const map = {};
    const order = [];
    for (const item of notifications) {
        const dateKey = dayjs(item.createdAt).format('YYYY-MM-DD');
        if (!map[dateKey]) {
            map[dateKey] = [];
            order.push(dateKey);
        }
        map[dateKey].push(item);
    }
    return order.map((dateKey) => {
        const d = dayjs(dateKey);
        return {
            dateKey,
            title: DAY_NAMES[d.day()],
            dateDisplay: d.format('YYYY.MM.DD.'),
            data: map[dateKey],
        };
    });
}

export default function NotificationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { setUnreadCount, decrement } = useNotificationStore();

    const isFirstLoad = useRef(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sections, setSections] = useState([]);
    const [hiddenIds, setHiddenIds] = useState(new Set());
    const [readIds, setReadIds] = useState(new Set());
    const [alarmCount, setAlarmCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            const res = await notificationApi.getList();
            setSections(groupByDate(res.data || []));
        } catch (_) {
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const res = await notificationApi.getUnreadCount();
            setUnreadCount(res.data?.count ?? 0);
        } catch (_) {}
    }, [setUnreadCount]);

    const refreshAlarmCount = useCallback(async () => {
        try {
            const res = await matchAlarmApi.getCount();
            setAlarmCount(res.data?.count ?? 0);
        } catch (_) {}
    }, []);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle('dark');
    }, []));

    useFocusEffect(
        useCallback(() => {
            if (isFirstLoad.current) {
                setLoading(true);
                isFirstLoad.current = false;
            }
            loadNotifications();
            refreshUnreadCount();
            refreshAlarmCount();
        }, [loadNotifications, refreshUnreadCount, refreshAlarmCount])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        await refreshUnreadCount();
        await refreshAlarmCount();
        setRefreshing(false);
    }, [loadNotifications, refreshUnreadCount, refreshAlarmCount]);

    const handleNotificationPress = useCallback((item) => {
        const data = item.data || {};

        if (item.type === 'noshow' && data.roomIdx) {
            router.navigate(`/chat/${data.roomIdx}`);
        } else if (item.type === 'noshow_confirmed') {
            const params = new URLSearchParams();
            params.set('category', 'noshow');
            if (data.matchIdx) params.set('matchIdx', String(data.matchIdx));
            if (data.driveDate) params.set('driveDate', String(data.driveDate));
            router.navigate(`/inquiry-create?${params.toString()}`);
        } else if (
            ['match_apply', 'match_accept', 'match_reject', 'match_absent', 'like', 'match_filter', 'manner_eval'].includes(item.type) &&
            data.matchIdx
        ) {
            router.navigate(`/match/${data.matchIdx}`);
        } else if (item.type === 'chat' && data.roomIdx) {
            router.navigate(`/chat/${data.roomIdx}`);
        } else if (item.type === 'event') {
            router.navigate('/news');
        } else if (item.type === 'notice') {
            router.navigate('/notice');
        }

        const alreadyRead = item.isRead || readIds.has(item.idx);
        if (!alreadyRead) {
            notificationApi.read(item.idx)
                .then(() => {
                    setReadIds((prev) => new Set([...prev, item.idx]));
                    decrement();
                })
                .catch(() => {});
        }
    }, [readIds, router, decrement]);

    const handleDelete = useCallback((item) => {
        const isUnread = !item.isRead && !readIds.has(item.idx);
        if (isUnread) {
            decrement();
        }
        setHiddenIds((prev) => new Set([...prev, item.idx]));
    }, [readIds, decrement]);

    const visibleSections = useMemo(
        () => sections
            .map((s) => ({ ...s, data: s.data.filter((i) => !hiddenIds.has(i.idx)) }))
            .filter((s) => s.data.length > 0),
        [sections, hiddenIds]
    );

    const renderSectionHeader = useCallback(({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionDay} allowFontScaling={false}>{section.title}</Text>
            <Text style={styles.sectionDate} allowFontScaling={false}>{section.dateDisplay}</Text>
        </View>
    ), []);

    const renderItem = useCallback(({ item, index, section }) => {
        const badge = getBadge(item.type);
        const read = item.isRead || readIds.has(item.idx);
        const isLast = index === section.data.length - 1;
        const data = item.data || {};
        const isNoshow = item.type === 'noshow';
        const isNoshowConfirmed = item.type === 'noshow_confirmed';
        const subText = data.subText;

        const handleNoshowGoChat = () => {
            if (data.roomIdx) router.navigate(`/chat/${data.roomIdx}`);
        };
        const handleNoshowAppeal = () => {
            const params = new URLSearchParams();
            params.set('category', 'noshow');
            if (data.matchIdx) params.set('matchIdx', String(data.matchIdx));
            if (data.driveDate) params.set('driveDate', String(data.driveDate));
            router.navigate(`/inquiry-create?${params.toString()}`);
        };

        return (
            <View style={styles.timelineRow}>
                {/* 타임라인 좌측 dot + line */}
                <View style={styles.timelineLeft}>
                    <View style={[styles.dot, { backgroundColor: read ? '#D9D9D9' : COLORS.primary }]} />
                    {!isLast && <View style={styles.line} />}
                </View>

                {/* 시간 + 카드 영역 */}
                <View style={[styles.timelineContent, isLast && { paddingBottom: SPACING.xl }]}>
                    <Text style={styles.timeText} allowFontScaling={false}>
                        {dayjs(item.createdAt).format('HH:mm')}
                    </Text>

                    <TouchableOpacity
                        testID={`notification-item-${item.idx}`}
                        activeOpacity={0.85}
                        onPress={() => handleNotificationPress(item)}
                        style={styles.card}
                    >
                        <View style={styles.cardRow}>
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Text style={[styles.badgeText, { color: badge.text }]} allowFontScaling={false}>
                                    {badge.label}
                                </Text>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.bodyText} allowFontScaling={false}>
                                    {item.body}
                                </Text>
                                {subText ? (
                                    <Text style={styles.subText} allowFontScaling={false}>{subText}</Text>
                                ) : null}
                            </View>
                            <TouchableOpacity
                                testID={`notification-delete-${item.idx}`}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => handleDelete(item)}
                            >
                                <Image
                                    source={require('../../assets/icons/delete-bin.svg')}
                                    style={styles.deleteIcon}
                                    contentFit="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                    {/* 노쇼 신고됨 — 채팅방 가기 */}
                    {isNoshow && data.roomIdx && (
                        <TouchableOpacity
                            testID={`notification-noshow-room-${item.idx}`}
                            style={styles.actionBtn}
                            activeOpacity={0.85}
                            onPress={handleNoshowGoChat}
                        >
                            <Text style={styles.actionBtnText} allowFontScaling={false}>채팅방 가기</Text>
                        </TouchableOpacity>
                    )}

                    {/* 노쇼 자동/관리자 확정 — 이의 신청하기 */}
                    {isNoshowConfirmed && (
                        <TouchableOpacity
                            testID={`notification-noshow-appeal-${item.idx}`}
                            style={styles.actionBtn}
                            activeOpacity={0.85}
                            onPress={handleNoshowAppeal}
                        >
                            <Text style={styles.actionBtnText} allowFontScaling={false}>이의 신청하기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }, [readIds, handleNotificationPress, handleDelete, router]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {Platform.OS === 'android' && <StatusBar style="dark" />}

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle} allowFontScaling={false}>알림</Text>
            </View>

            {/* 매칭 알림 설정 카드 (스크롤 영역 밖 고정) */}
            <TouchableOpacity
                testID="notification-alarm-setting-card"
                style={styles.settingCard}
                activeOpacity={0.85}
                onPress={() => router.navigate('/settings/match-alarm')}
            >
                <View style={styles.settingCardLeft}>
                    <Image
                        source={require('../../assets/icons/settings-bell.svg')}
                        style={styles.bellIcon}
                        contentFit="contain"
                    />
                    <Text style={styles.settingCardTitle} allowFontScaling={false}>매칭 알림 설정</Text>
                </View>
                <View style={styles.settingCardRight}>
                    {alarmCount > 0 && (
                        <Text style={styles.alarmCountText} allowFontScaling={false}>
                            {alarmCount}개 설정
                        </Text>
                    )}
                    <Image
                        source={require('../../assets/icons/chevron-right.svg')}
                        style={styles.chevronIcon}
                        contentFit="contain"
                    />
                </View>
            </TouchableOpacity>

            {/* 알림 목록 */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <SectionList
                    testID="notification-list"
                    sections={visibleSections}
                    keyExtractor={(item) => String(item.idx)}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText} allowFontScaling={false}>알림이 없습니다</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                            progressBackgroundColor={COLORS.white}
                        />
                    }
                />
            )}

            {/* 하단 안내 바 */}
            <View style={[styles.bottomBar, { }]}>
                <Text style={styles.bottomBarText} allowFontScaling={false}>
                    최대 14일 전까지의 알림을 확인할 수 있습니다.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        height: HEADER_BAR_HEIGHT,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.black,
        lineHeight: 30,
    },

    // 매칭 알림 설정 카드
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.xl,
        marginBottom: SPACING.md,
        padding: SPACING.xl,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    settingCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    bellIcon: { width: 24, height: 24 },
    settingCardTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.black,
        lineHeight: 24,
    },
    settingCardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    alarmCountText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.grayMedium,
        lineHeight: 20,
    },
    chevronIcon: { width: 24, height: 24 },

    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 섹션 리스트
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        flexGrow: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    sectionDay: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.black,
        lineHeight: 30,
    },
    sectionDate: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.grayMedium,
        lineHeight: 20,
    },

    // 빈 상태
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.md,
        color: COLORS.textMedium,
    },

    // 타임라인
    timelineRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        minHeight: 12,
    },
    timelineLeft: {
        width: 12,
        alignItems: 'center',
        paddingTop: 2, // 시간 텍스트 상단에 정렬
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#D9D9D9',
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
        gap: SPACING.md,
        paddingBottom: SPACING.md,
    },
    timeText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: '#231F20',
        lineHeight: 20,
        height: 20,
    },

    // 알림 카드
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 16,
    },
    cardBody: {
        flex: 1,
        gap: 4,
    },
    bodyText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMedium,
        lineHeight: 20,
    },
    subText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        color: '#E02E2E',
        lineHeight: 20,
    },
    deleteIcon: { width: 20, height: 20 },

    // 노쇼 이의신청 버튼
    actionBtn: {
        backgroundColor: '#070B25',
        borderRadius: 8,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.white,
        lineHeight: 20,
    },

    // 하단 안내 바
    bottomBar: {
        backgroundColor: '#EEEEEE',
        paddingHorizontal: SPACING.xl,
        height: 44,
        justifyContent: 'center',
    },
    bottomBarText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMedium,
        lineHeight: 20,
    },
});
