import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';

import AppHeader from '../../src/components/AppHeader';
import { userApi } from '../../src/api/user';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import useConfigStore from '../../src/store/configStore';

const TAB_ROUTES = [
    { key: 'sent', title: '내가 좋아요한' },
    { key: 'received', title: '나를 좋아요한' },
];

function ageDecadeLabel(age) {
    if (!age) return '';
    return `${Math.floor(age / 10) * 10}대`;
}

function PersonRowCard({ person, isSent, isUpdating, onUnlike, onPress, testID }) {
    const driveLevels = useConfigStore((s) => s.driveLevels);
    const avatarUri = person.profileImage ? STORAGE_URL + person.profileImage : null;
    const ageLabel = ageDecadeLabel(person.age);
    const genderLabel = person.gender === 'M' ? '남' : person.gender === 'F' ? '여' : '';
    const isOwner = person.role === 'owner';
    const driveLevelLabel = isOwner && person.driveLevel
        ? (driveLevels.find((l) => l.key === person.driveLevel)?.label || '').replace(/\s*\(.*\)$/, '') || null
        : null;

    return (
        <TouchableOpacity
            style={styles.card}
            testID={testID}
            onPress={() => onPress(person.idx)}
            activeOpacity={0.7}
        >
            {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
                <Image
                    source={require('../../assets/icons/profile-avatar.svg')}
                    style={styles.avatar}
                    contentFit="cover"
                />
            )}

            <View style={styles.info}>
                <View style={styles.nicknameRow}>
                    <Text style={styles.nickname} allowFontScaling={false} numberOfLines={1}>
                        {person.nickname || ''}
                    </Text>
                    {person.role === 'guest' || person.role === 'owner' ? (
                        <View style={[styles.roleBadge, { backgroundColor: isOwner ? COLORS.secondary : COLORS.safety }]}>
                            <Text style={styles.roleBadgeText} allowFontScaling={false}>
                                {isOwner ? '오너' : '게스트'}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.tagRow}>
                    {ageLabel ? (
                        <View style={styles.tag}>
                            <Text style={styles.tagText} allowFontScaling={false}>{ageLabel}</Text>
                        </View>
                    ) : null}
                    {genderLabel ? (
                        <View style={styles.tag}>
                            <Text style={styles.tagText} allowFontScaling={false}>{genderLabel}</Text>
                        </View>
                    ) : null}
                    {driveLevelLabel ? (
                        <View style={styles.tag}>
                            <Text style={styles.tagText} allowFontScaling={false}>{driveLevelLabel}</Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {isSent ? (
                <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => onUnlike(person.idx)}
                    disabled={isUpdating}
                    activeOpacity={0.7}
                    testID={`like-list-unlike-btn-${person.idx}`}
                >
                    {isUpdating ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                    ) : (
                        <Image
                            source={require('../../assets/icons/heart-fill.svg')}
                            style={styles.heartIcon}
                            contentFit="contain"
                            tintColor={COLORS.error}
                        />
                    )}
                </TouchableOpacity>
            ) : (
                <Image
                    source={require('../../assets/icons/heart-fill.svg')}
                    style={styles.heartIconStatic}
                    contentFit="contain"
                    tintColor={COLORS.error}
                />
            )}
        </TouchableOpacity>
    );
}

function SentCard({ item, updatingKeys, onUnlike, onPress }) {
    const person = item.user;
    if (!person) return null;
    return (
        <PersonRowCard
            person={person}
            isSent
            isUpdating={updatingKeys.has(person.idx)}
            onUnlike={onUnlike}
            onPress={onPress}
            testID={`like-list-sent-${person.idx}`}
        />
    );
}

function ReceivedCard({ item, onPress }) {
    const person = item.user;
    if (!person) return null;
    return (
        <PersonRowCard
            person={person}
            isSent={false}
            onPress={onPress}
            testID={`like-list-received-${person.idx}`}
        />
    );
}

function LikeList({ data, loading, isSent, emptyText, bottomInset, updatingKeys, onUnlike, onPress }) {
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
            </View>
        );
    }
    return (
        <FlatList
            data={data}
            keyExtractor={item => String(item.user?.idx)}
            renderItem={({ item }) =>
                isSent
                    ? <SentCard item={item} updatingKeys={updatingKeys} onUnlike={onUnlike} onPress={onPress} />
                    : <ReceivedCard item={item} onPress={onPress} />
            }
            contentContainerStyle={[
                styles.listContent,
                {
                    paddingBottom: SPACING.xl + bottomInset,
                    flex: data?.length < 1 ? 1 : undefined,
                },
            ]}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.emptyText} allowFontScaling={false}>
                        {emptyText}
                    </Text>
                </View>
            }
            showsVerticalScrollIndicator={false}
        />
    );
}

export default function LikeListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [tabIndex, setTabIndex] = useState(0);
    const [sentList, setSentList] = useState([]);
    const [receivedList, setReceivedList] = useState([]);
    const [loadingSent, setLoadingSent] = useState(true);
    const [loadingReceived, setLoadingReceived] = useState(true);
    const [updatingKeys, setUpdatingKeys] = useState(new Set());
    const fetchedRef = useRef({ sent: false, received: false });

    const loadSent = useCallback(async () => {
        if (fetchedRef.current.sent) return;
        fetchedRef.current.sent = true;
        try {
            const res = await userApi.getLikeList('sent');
            setSentList(res.data?.list || []);
        } catch {
            showToast('error', '좋아요 목록을 불러올 수 없습니다.');
        } finally {
            setLoadingSent(false);
        }
    }, []);

    const loadReceived = useCallback(async () => {
        if (fetchedRef.current.received) return;
        fetchedRef.current.received = true;
        try {
            const res = await userApi.getLikeList('received');
            setReceivedList(res.data?.list || []);
        } catch {
            showToast('error', '좋아요 목록을 불러올 수 없습니다.');
        } finally {
            setLoadingReceived(false);
        }
    }, []);

    useEffect(() => {
        loadSent();
    }, []);

    useEffect(() => {
        if (tabIndex === 1) loadReceived();
    }, [tabIndex]);

    const handleUnlike = useCallback(async (targetUserIdx) => {
        if (updatingKeys.has(targetUserIdx)) return;
        setUpdatingKeys(prev => new Set(prev).add(targetUserIdx));
        try {
            await userApi.like(targetUserIdx);
            setSentList(prev => prev.filter(item => item.user?.idx !== targetUserIdx));
            showToast('success', '좋아요가 취소되었습니다.');
        } catch {
            showToast('error', '좋아요 취소에 실패했습니다.');
        } finally {
            setUpdatingKeys(prev => {
                const next = new Set(prev);
                next.delete(targetUserIdx);
                return next;
            });
        }
    }, [updatingKeys]);

    const handleCardPress = useCallback((targetUserIdx) => {
        router.navigate(`/profile/${targetUserIdx}`);
    }, [router]);

    const renderScene = useCallback(({ route }) => {
        if (route.key === 'sent') {
            return (
                <LikeList
                    data={sentList}
                    loading={loadingSent}
                    isSent
                    emptyText="좋아요한 사람이 없습니다."
                    bottomInset={insets.bottom}
                    updatingKeys={updatingKeys}
                    onUnlike={handleUnlike}
                    onPress={handleCardPress}
                />
            );
        }
        return (
            <LikeList
                data={receivedList}
                loading={loadingReceived}
                isSent={false}
                emptyText="아직 받은 좋아요가 없습니다."
                bottomInset={insets.bottom}
                updatingKeys={updatingKeys}
                onUnlike={handleUnlike}
                onPress={handleCardPress}
            />
        );
    }, [sentList, loadingSent, receivedList, loadingReceived, insets.bottom, updatingKeys, handleUnlike, handleCardPress]);

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            tabStyle={{ width: 'auto' }}
            gap={24}
            renderTabBarItem={({ route, navigationState, onPress }) => {
                const routeIndex = navigationState.routes.findIndex((r) => r.key === route.key);
                const focused = navigationState.index === routeIndex;

                return (
                    <Pressable
                        style={[
                            styles.tabBox,
                            { borderBottomColor: focused ? COLORS.primary : COLORS.white },
                        ]}
                        onPress={onPress}
                        testID={`likelist-tab-${route.key}`}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                { color: focused ? COLORS.primary : '#C5C5CD' },
                                { fontFamily: focused ? FONTS.extraBold : FONTS.semiBold },
                            ]}
                        >
                            {route.title}
                        </Text>
                    </Pressable>
                )
            }}
            pressColor="transparent"
        />
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="좋아요" onBack={() => router.back()} />
            <TabView
                navigationState={{ index: tabIndex, routes: TAB_ROUTES }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setTabIndex}
                style={styles.tabView}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    tabView: {
        flex: 1,
    },
    tabBar: {
        backgroundColor: COLORS.white,
        elevation: 0,
        shadowOpacity: 0,
        paddingHorizontal: SPACING.xl,
    },
    tabIndicator: {
        backgroundColor: COLORS.primary,
        height: 2,
    },
    tabBox: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.white,
    },
    tabLabel: {
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        margin: 0,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
    },
    listContent: {
        paddingTop: SPACING.sm,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        backgroundColor: COLORS.grayF1
    },
    info: {
        flex: 1,
        gap: 4,
        justifyContent: 'center',
    },
    nicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nickname: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.extraBold,
        color: '#070B25',
        flexShrink: 1,
        lineHeight: 20,
    },
    roleBadge: {
        backgroundColor: '#FFC72C',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: '#070B25',
        lineHeight: 16,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 4,
    },
    tag: {
        backgroundColor: '#F1F1F1',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.extraBold,
        color: '#969698',
        lineHeight: 16,
    },
    heartBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartIcon: {
        width: 24,
        height: 24,
    },
    heartIconStatic: {
        width: 24,
        height: 24,
    },
});
