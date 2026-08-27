import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, ScrollView, Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import dayjs from 'dayjs';

import AppHeader from '../../src/components/AppHeader';
import { reviewApi } from '../../src/api/review';
import useConfigStore from '../../src/store/configStore';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';

const TAB_ROUTES = [
    { key: 'received', title: '받은 평가' },
    { key: 'sent', title: '보낸 평가' },
];

function EvalCard({ item }) {
    const mannerEvalItems = useConfigStore(s => s.mannerEvalItems) || [];
    const avatarUri = item.partnerProfileImage ? STORAGE_URL + item.partnerProfileImage : null;
    const scoreColor = item.mannerScore >= 80 ? COLORS.primary : item.mannerScore >= 60 ? '#F59E0B' : '#EF4444';
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <Image
                            source={require('../../assets/icons/profile-avatar.svg')}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    )}
                </View>
                <View style={styles.cardMeta}>
                    <Text style={styles.partnerName} allowFontScaling={false} numberOfLines={1}>
                        {item.partnerNickname || '탈퇴한 회원'}
                    </Text>
                    <Text style={styles.cardDate} allowFontScaling={false}>
                        {dayjs(item.createdAt).format('YYYY.MM.DD')}
                    </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '1A' }]}>
                    <Text style={[styles.scoreText, { color: scoreColor }]} allowFontScaling={false}>
                        {Math.round(Number(item.mannerScore))}점
                    </Text>
                </View>
            </View>

            {Array.isArray(item.items) && item.items.length > 0 && (
                <View style={styles.tagRow}>
                    {item.items.map(key => (
                        <View key={key} style={styles.tag}>
                            <Text style={styles.tagText} allowFontScaling={false}>
                                {mannerEvalItems.find(i => i.key === key)?.label || key}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {!!item.content && (
                <Text style={styles.contentText} allowFontScaling={false} numberOfLines={3}>
                    {item.content}
                </Text>
            )}
        </View>
    );
}

function EvalList({ data, loading, bottomInset }) {
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
            keyExtractor={item => String(item.idx)}
            renderItem={({ item }) => <EvalCard item={item} />}
            contentContainerStyle={[
                styles.listContent,
                { 
                    paddingBottom: SPACING.xl + bottomInset,
                    flex: data?.length < 1 ? 1 : 'unset',
                },
            ]}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.emptyText} allowFontScaling={false}>
                        평가 내역이 없습니다.
                    </Text>
                </View>
            }
            showsVerticalScrollIndicator={false}
        />
    );
}

export default function MyEvaluationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [tabIndex, setTabIndex] = useState(0);
    const [receivedList, setReceivedList] = useState([]);
    const [sentList, setSentList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [loadingReceived, setLoadingReceived] = useState(true);
    const [loadingSent, setLoadingSent] = useState(true);
    const [loadingPending, setLoadingPending] = useState(true);

    const loadPending = useCallback(async () => {
        try {
            const res = await reviewApi.getPendingEvaluations();
            setPendingList(res.data?.list || []);
        } catch {
            // 미완료 목록 오류는 조용히 처리
        } finally {
            setLoadingPending(false);
        }
    }, []);

    const loadReceived = useCallback(async () => {
        try {
            const res = await reviewApi.getMyEvaluations('received');
            setReceivedList(res.data?.list || []);
        } catch {
            showToast('error', '받은 평가를 불러올 수 없습니다.');
        } finally {
            setLoadingReceived(false);
        }
    }, []);

    const loadSent = useCallback(async () => {
        try {
            const res = await reviewApi.getMyEvaluations('sent');
            setSentList(res.data?.list || []);
        } catch {
            showToast('error', '보낸 평가를 불러올 수 없습니다.');
        } finally {
            setLoadingSent(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadPending();
        loadReceived();
        loadSent();
    }, [loadPending, loadReceived, loadSent]));

    const renderScene = useCallback(({ route }) => {
        if (route.key === 'received') {
            return <EvalList data={receivedList} loading={loadingReceived} bottomInset={insets.bottom} />;
        }
        return <EvalList data={sentList} loading={loadingSent} bottomInset={insets.bottom} />;
    }, [receivedList, loadingReceived, sentList, loadingSent, insets.bottom]);

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            tabStyle={{ width: 'auto' }}
            gap={24}
            renderTabBarItem={({ route, navigationState, onPress }) => {
                const routeIndex = navigationState.routes.findIndex(r => r.key === route.key);
                const focused = navigationState.index === routeIndex;
                return (
                    <Pressable
                        style={[styles.tabBox, { borderBottomColor: focused ? COLORS.primary : COLORS.white }]}
                        onPress={onPress}
                        testID={`my-evaluations-tab-${route.key}`}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                { color: focused ? COLORS.primary : '#C5C5CD' },
                                { fontFamily: focused ? FONTS.extraBold : FONTS.semiBold },
                            ]}
                            allowFontScaling={false}
                        >
                            {route.title}
                        </Text>
                    </Pressable>
                );
            }}
            pressColor="transparent"
        />
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="내 평가 보기" onBack={() => router.back()} />

            {/* 미완료 평가 섹션 */}
            {(loadingPending || pendingList.length > 0) && (
                <View style={styles.pendingSection}>
                    <Text style={styles.pendingSectionTitle} allowFontScaling={false}>
                        평가 미완료
                    </Text>
                    {loadingPending ? (
                        <ActivityIndicator size="small" color={COLORS.textPrimary} style={{ marginTop: 8 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
                            {pendingList.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.pendingCard}
                                    onPress={() => router.navigate(
                                        `/review/manner-eval?matchIdx=${item.matchIdx}&targetNickname=${encodeURIComponent(item.partnerNickname || '')}&targetUserIdx=${item.partnerIdx || ''}`
                                    )}
                                    activeOpacity={0.75}
                                    testID={`my-evaluations-pending-${item.matchIdx}`}
                                >
                                    <View style={styles.pendingAvatarWrap}>
                                        {item.partnerProfileImage ? (
                                            <Image
                                                source={{ uri: STORAGE_URL + item.partnerProfileImage }}
                                                style={styles.pendingAvatar}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <Image
                                                source={require('../../assets/icons/profile-avatar.svg')}
                                                style={styles.pendingAvatar}
                                                contentFit="cover"
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.pendingName} allowFontScaling={false} numberOfLines={1}>
                                        {item.partnerNickname || '상대방'}
                                    </Text>
                                    <Text style={styles.pendingDate} allowFontScaling={false}>
                                        {dayjs(item.driveDate).format('MM.DD')}
                                    </Text>
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText} allowFontScaling={false}>평가하기</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

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
    },
    tabLabel: {
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
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
        paddingHorizontal: SPACING.xl,
    },
    card: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayEE,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarWrap: {
        marginRight: SPACING.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardMeta: {
        flex: 1,
    },
    partnerName: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        marginBottom: 2,
    },
    cardDate: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.bold,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '1A',
    },
    tagText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    contentText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    // 미완료 섹션
    pendingSection: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayEE,
        backgroundColor: COLORS.grayF8,
    },
    pendingSectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    pendingScroll: {
        paddingBottom: 4,
        gap: 10,
    },
    pendingCard: {
        alignItems: 'center',
        width: 76,
    },
    pendingAvatarWrap: {
        marginBottom: 6,
    },
    pendingAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    pendingName: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.medium,
        color: COLORS.black,
        marginBottom: 4,
        textAlign: 'center',
        width: 76,
    },
    pendingDate: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        marginBottom: 6,
    },
    pendingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    pendingBadgeText: {
        fontSize: 10,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
});
