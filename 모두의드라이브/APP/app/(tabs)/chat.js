import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import AppHeader from '../../src/components/AppHeader';
import chatApi from '../../src/api/chat';
import useChatStore from '../../src/store/chatStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = dayjs(dateStr);
    const now = dayjs();
    if (d.isSame(now, 'day')) {
        const h = d.hour();
        const m = d.minute();
        const period = h < 12 ? '오전' : '오후';
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
    }
    if (d.isSame(now.subtract(1, 'day'), 'day')) return '어제';
    if (d.isSame(now, 'year')) return `${d.month() + 1}월 ${d.date()}일`;
    return d.format('YYYY.MM.DD');
}

function SingleAvatar({ uri, size = 48 }) {
    const style = { width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: COLORS.white };
    if (!uri) {
        return (
            <Image
                source={require('../../assets/icons/profile-avatar.svg')}
                style={[style, { backgroundColor: COLORS.grayF1, overflow: 'hidden' }]}
                contentFit="cover"
            />
        );
    }
    return (
        <Image
            source={{ uri }}
            style={[style, { overflow: 'hidden' }]}
            contentFit="cover"
        />
    );
}

function GroupAvatarGrid({ members }) {
    const list = (members || []).slice(0, 4);
    const count = list.length;
    const uri = (m) => (m?.profileImage ? STORAGE_URL + m.profileImage : null);
    if (count === 0) {
        return (
            <View style={[styles.gridWrap, { width: 48, height: 48 }]}>
                <SingleAvatar uri={null} size={48} />
            </View>
        );
    }
    if (count === 1) {
        return (
            <View style={[styles.gridWrap, { width: 48, height: 48 }]}>
                <SingleAvatar uri={uri(list[0])} size={48} />
            </View>
        );
    }
    if (count === 2) {
        return (
            <View style={[styles.gridWrap, { width: 48, height: 48 }]}>
                <View style={[styles.gridCell, { top: 3, left: 0 }]}>
                    <SingleAvatar uri={uri(list[0])} size={28} />
                </View>
                <View style={[styles.gridCell, { top: 20, left: 17 }]}>
                    <SingleAvatar uri={uri(list[1])} size={28} />
                </View>
            </View>
        );
    }
    if (count === 3) {
        return (
            <View style={[styles.gridWrap, { width: 48, height: 48 }]}>
                <View style={[styles.gridCell, { top: 3, left: 12 }]}>
                    <SingleAvatar uri={uri(list[0])} size={24} />
                </View>
                <View style={[styles.gridCell, { top: 21, left: 2 }]}>
                    <SingleAvatar uri={uri(list[1])} size={24} />
                </View>
                <View style={[styles.gridCell, { top: 21, left: 22 }]}>
                    <SingleAvatar uri={uri(list[2])} size={24} />
                </View>
            </View>
        );
    }
    return (
        <View style={[styles.gridWrap, { width: 48, height: 48 }]}>
            <View style={[styles.gridCell, { top: 3, left: 2 }]}>
                <SingleAvatar uri={uri(list[0])} size={24} />
            </View>
            <View style={[styles.gridCell, { top: 3, left: 22 }]}>
                <SingleAvatar uri={uri(list[1])} size={24} />
            </View>
            <View style={[styles.gridCell, { top: 21, left: 2 }]}>
                <SingleAvatar uri={uri(list[2])} size={24} />
            </View>
            <View style={[styles.gridCell, { top: 21, left: 22 }]}>
                <SingleAvatar uri={uri(list[3])} size={24} />
            </View>
        </View>
    );
}

function RoomItem({ item, onPress }) {
    const { partner, lastMessage, unreadCount, memberCount, otherMembers, match, matchTitle } = item;
    const isGroup = match?.matchType === 'group' && (memberCount || 0) >= 3;
    const partnerAvatarUri = partner?.profileImage ? STORAGE_URL + partner.profileImage : null;

    const otherNicknames = (otherMembers || []).map((u) => u?.nickname).filter(Boolean);
    const isEndedAlone = otherNicknames.length === 0;
    const endedFallback = ['cancelled', 'completed', 'no_show'].includes(match?.status)
        ? '종료된 매칭'
        : '혼자 남은 매칭';
    const titleText = isEndedAlone
        ? endedFallback
        : (isGroup ? otherNicknames.join(', ') : (partner?.nickname || '상대방'));

    return (
        <Pressable
            testID={`chat-item-${item.idx}`}
            style={styles.roomItem}
            onPress={onPress}
        >
            {/* 프로필 이미지 */}
            <View style={styles.avatarWrap}>
                {isGroup ? (
                    <GroupAvatarGrid members={otherMembers} />
                ) : (
                    <SingleAvatar uri={partnerAvatarUri} size={48} />
                )}
            </View>

            {/* 중앙 텍스트 영역 */}
            <View style={styles.roomInfo}>
                <View style={styles.topRow}>
                    <View style={styles.titleWrap}>
                        <Text style={styles.nickname} numberOfLines={1} allowFontScaling={false}>
                            {titleText}
                        </Text>
                        {isGroup && (
                            <Text style={styles.memberCount} allowFontScaling={false}>
                                {memberCount}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.time} allowFontScaling={false}>
                        {formatTime(lastMessage?.createdAt)}
                    </Text>
                </View>
                {matchTitle ? (
                    <Text style={styles.matchTitle} numberOfLines={1} allowFontScaling={false}>
                        {matchTitle}
                    </Text>
                ) : null}
                <View style={styles.bottomRow}>
                    <Text style={styles.lastMsg} numberOfLines={1} allowFontScaling={false}>
                        {lastMessage?.type === 'image' ? '사진' : (lastMessage?.content || '')}
                    </Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText} allowFontScaling={false}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const setUnreadTotal = useChatStore((s) => s.setUnreadTotal);

    const isFirstLoad = useRef(true);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRooms = useCallback(async () => {
        try {
            const [roomsRes, unreadRes] = await Promise.all([
                chatApi.getRooms(),
                chatApi.getUnreadTotal(),
            ]);
            setRooms(roomsRes.data || []);
            setUnreadTotal(unreadRes.data?.total || 0);
        } catch (_) {
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [setUnreadTotal]);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle('dark');
    }, []));

    useFocusEffect(
        useCallback(() => {
            if (isFirstLoad.current) {
                setLoading(true);
                isFirstLoad.current = false;
            }
            loadRooms();
        }, [loadRooms])
    );

    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data;
            if (data?.type === 'chat') {
                loadRooms();
            }
        });
        return () => sub.remove();
    }, [loadRooms]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadRooms();
    }, [loadRooms]);

    const handlePress = useCallback((item) => {
        router.navigate({
            pathname: `/chat/${item.idx}`,
            params: {
                nickname: item.partner?.nickname || '',
                matchIdx: item.matchIdx || '',
                matchType: item.match?.matchType || '',
            },
        });
    }, [router]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {Platform.OS === 'android' && <StatusBar style="dark" />}
            <AppHeader title="채팅" />

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <FlashList
                    data={rooms}
                    keyExtractor={(item) => String(item.idx)}
                    estimatedItemSize={78}
                    renderItem={({ item }) => (
                        <RoomItem item={item} onPress={() => handlePress(item)} />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText} allowFontScaling={false}>
                                채팅방이 없습니다
                            </Text>
                        </View>
                    }
                    contentContainerStyle={{ 
                        flex: rooms?.length < 1 ? 1 : 'unset',
                        paddingBottom: SPACING.xl + insets.bottom 
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md,
        color: COLORS.grayMedium,
    },

    // 채팅방 아이템
    roomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    avatarWrap: {
        flexShrink: 0,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    gridWrap: {
        position: 'relative',
    },
    gridCell: {
        position: 'absolute',
    },
    memberCount: {
        flexShrink: 0,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.grayMedium,
    },
    roomInfo: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    titleWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
    },
    nickname: {
        flexShrink: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textMedium,
    },
    time: {
        flexShrink: 0,
        fontFamily: FONTS.regular,
        fontSize: 11,
        lineHeight: 16,
        color: COLORS.grayMedium,
    },
    matchTitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.grayMedium,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lastMsg: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    badge: {
        flexShrink: 0,
        backgroundColor: COLORS.danger,
        borderRadius: 100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        lineHeight: 16,
        color: COLORS.white,
    },
});
