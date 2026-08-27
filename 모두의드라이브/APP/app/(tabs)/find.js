import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Platform,
    ScrollView,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useBottomSheetBackHandler from '../../src/hooks/useBottomSheetBackHandler';
import useConfigStore from '../../src/store/configStore';
import useLikeStore from '../../src/store/likeStore';
import { userApi } from '../../src/api/user';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import FindFilterBottomSheet from '../../src/components/find/FindFilterBottomSheet';

const HEADER_BAR_HEIGHT = 56;

// ponytail: idx 기반 중복 탭 방지 — 로컬 state 대신 모듈 Set (FlashList 셀 재활용에 안전)
const likingSet = new Set();

const SORT_OPTIONS = [
    { key: 'recent', label: '최근가입순' },
    { key: 'matchCount', label: '매칭많은순' },
    { key: 'manner', label: '매너높은순' },
];

const ROLE_CHIPS = [
    { key: 'owner', label: '오너' },
    { key: 'guest', label: '게스트' },
];

function FindCard({ item, configStore, onPress }) {
    // 프로필 상세에서 토글한 값이 있으면 그것을 우선 (뒤로가기 시 즉시 반영)
    const isLiked = useLikeStore((s) => s.likes[item.idx]) ?? item.isLiked ?? false;
    const setLike = useLikeStore((s) => s.setLike);
    const roleLabel = configStore.getLabel('roles', item.role);
    const roleBgColor = item.role === 'owner' ? COLORS.secondary : COLORS.safety;
    const ageText = item.ageDecade ? `${item.ageDecade}대` : '';
    const genderText = item.gender === 'M' ? '남' : item.gender === 'F' ? '여' : '';
    const ageGender = [ageText, genderText].filter(Boolean).join(',');
    const regionText = [item.regionSido, item.regionSigungu].filter(Boolean).join(' ');

    const handleLike = async () => {
        if (likingSet.has(item.idx)) return;
        likingSet.add(item.idx);
        setLike(item.idx, !isLiked); // 낙관적 반영 — 성공 시 userApi.like가 서버값으로 갱신
        try {
            await userApi.like(item.idx);
        } catch {
            setLike(item.idx, isLiked);
            showToast('error', '관심등록 처리에 실패했습니다.');
        } finally {
            likingSet.delete(item.idx);
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={onPress}
            testID={`find-card-${item.idx}`}
        >
            <View style={styles.cardTopRow}>
                <View style={styles.avatarWrap}>
                    {item.profileImage ? (
                        <Image
                            source={{ uri: STORAGE_URL + item.profileImage }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <Image
                            source={require('../../assets/icons/profile-avatar.svg')}
                            style={styles.avatar}
                        />
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.cardNameRow}>
                        <Text style={styles.cardNickname} allowFontScaling={false} numberOfLines={1}>
                            {item.nickname}
                        </Text>
                        <View style={[styles.roleBadge, { backgroundColor: roleBgColor }]}>
                            <Text style={styles.roleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                        </View>
                    </View>
                    <View style={styles.cardMetaRow}>
                        {ageGender ? (
                            <Text style={styles.cardMeta} allowFontScaling={false}>{ageGender}</Text>
                        ) : null}
                        {regionText ? (
                            <View style={styles.regionRow}>
                                <Image
                                    source={require('../../assets/icons/basil_location-solid.svg')}
                                    style={{ width: 16, height: 16 }}
                                    tintColor={COLORS.textMedium}
                                />
                                <Text style={styles.cardMeta} allowFontScaling={false} numberOfLines={1}>
                                    {regionText}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                {/* ponytail: 프로필 상세 이동만 하므로 카드 onPress가 처리 — 개별 핸들러 불필요 */}
                <View style={styles.profileViewBtn} testID={`find-profile-view-btn-${item.idx}`}>
                    <Text style={styles.profileViewBtnText} allowFontScaling={false}>프로필보기</Text>
                </View>
            </View>
            <View style={styles.cardBottomRow}>
                {item.bio ? (
                    <Text style={styles.cardBio} allowFontScaling={false} numberOfLines={2}>
                        {item.bio}
                    </Text>
                ) : null}
                <Pressable
                    style={styles.likeBtn}
                    onPress={handleLike}
                    hitSlop={8}
                    testID={`find-like-btn-${item.idx}`}
                >
                    <Image
                        source={isLiked
                            ? require('../../assets/icons/heart-fill.svg')
                            : require('../../assets/icons/heart.svg')
                        }
                        style={{ width: 16, height: 16 }}
                        contentFit="contain"
                        tintColor={COLORS.white}
                    />
                    <Text style={styles.likeBtnText} allowFontScaling={false}>관심등록</Text>
                </Pressable>
            </View>
        </TouchableOpacity>
    );
}

export default function FindScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const configStore = useConfigStore();
    const filterSheetRef = useRef(null);
    const sortSheetRef = useRef(null);
    const listRef = useRef(null);
    const isLoadingMore = useRef(false);
    const reqIdRef = useRef(0); // 필터 연타 시 늦게 도착한 이전 응답 폐기용
    const [sortSheetOpen, setSortSheetOpen] = useState(false);
    useBottomSheetBackHandler(sortSheetRef, sortSheetOpen);

    const [sort, setSort] = useState('recent');
    const [roles, setRoles] = useState({ owner: true, guest: true });
    const [activeFilters, setActiveFilters] = useState({});
    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle('dark');
    }, []));

    const sortLabel = useMemo(
        () => SORT_OPTIONS.find((o) => o.key === sort)?.label || '정렬',
        [sort],
    );

    const FILTERS = useMemo(() => {
        const regionLabel = activeFilters.region
            ? `${activeFilters.region.sido}${activeFilters.region.sigungu ? ' ' + activeFilters.region.sigungu : ''}`
            : '지역';
        const ageLabel = activeFilters.age
            ? configStore.getLabel('filterAges', activeFilters.age)
            : '나이';
        const carTypeLabel = activeFilters.carType
            ? configStore.getLabel('carTypes', activeFilters.carType)
            : '차종';
        const genderLabel = activeFilters.gender
            ? configStore.getLabel('filterGenders', activeFilters.gender)
            : '성별';
        return [
            { key: 'region', label: regionLabel },
            { key: 'age', label: ageLabel },
            { key: 'carType', label: carTypeLabel },
            { key: 'gender', label: genderLabel },
        ];
    }, [activeFilters, configStore]);

    const buildRequestFilters = useCallback((af) => {
        const out = {};
        // ponytail: 한쪽만 ON일 때만 role 조건 — 둘 다 ON = 전체 (둘 다 OFF는 fetchList가 선처리)
        if (roles.owner !== roles.guest) out.role = roles.owner ? 'owner' : 'guest';
        if (af.region) {
            out.regionSido = af.region.sido;
            if (af.region.sigungu) out.regionSigungu = af.region.sigungu;
        }
        if (af.age) out.age = af.age;
        if (af.carType) out.carType = af.carType;
        if (af.gender) out.gender = af.gender;
        return out;
    }, [roles]);

    const fetchList = useCallback(async (pageNum = 1, isSilent = false) => {
        console.log('pageNum', pageNum);
        if (pageNum > 1 && isLoadingMore.current) return;
        const reqId = ++reqIdRef.current; // 이 시점 이전 요청은 모두 무효화
        // 오너/게스트 둘 다 OFF = 조건 만족 대상 없음
        if (!roles.owner && !roles.guest) {
            setList([]);
            setHasMore(false);
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
            isLoadingMore.current = false;
            return;
        }
        if (pageNum > 1) {
            isLoadingMore.current = true;
            setLoadingMore(true);
        }
        try {
            if (pageNum === 1 && !isSilent) {
                setList([]);
                setLoading(true);
            }
            const res = await userApi.findList({
                page: pageNum,
                limit: 20,
                sort,
                filters: buildRequestFilters(activeFilters),
            });
            if (reqId !== reqIdRef.current) return; // 그 사이 필터가 바뀜 → 응답 폐기
            const data = res.data || {};
            const rows = Array.isArray(data.list) ? data.list : [];
            if (pageNum === 1) {
                setList(rows);
            } else {
                setList((prev) => [...prev, ...rows]);
            }
            console.log('rows.length', rows.length);
            setHasMore(rows.length >= 20);
            setPage(pageNum);
        } catch (e) {
            console.warn('find/list error', e);
        } finally {
            // 최신 요청만 로딩 상태를 내린다 (폐기된 응답이 새 요청의 스피너를 끄지 않도록)
            if (reqId === reqIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
                setRefreshing(false);
                isLoadingMore.current = false;
            }
        }
    }, [sort, roles, activeFilters, buildRequestFilters]);

    useEffect(() => {
        fetchList(1);
    }, [sort, roles, activeFilters]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchList(1, true);
    }, [fetchList]);

    const handleLoadMore = useCallback(() => {
        console.log('more!!!!!', loading, loadingMore, hasMore);
        if (loading || loadingMore || !hasMore) return;
        fetchList(page + 1);
    }, [loading, loadingMore, hasMore, page, fetchList]);

    const handleFilterPress = useCallback((key, clear) => {
        if (clear) {
            setActiveFilters((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
            return;
        }
        filterSheetRef.current?.open(key);
    }, []);

    const handleRoleToggle = useCallback((key) => {
        setRoles((prev) => ({ ...prev, [key]: !prev[key] }));
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setActiveFilters((prev) => {
            const next = { ...prev };
            if (value == null) delete next[key];
            else next[key] = value;
            return next;
        });
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []);

    const handleSortPress = useCallback(() => {
        sortSheetRef.current?.present();
    }, []);

    const handleSortPick = useCallback((key) => {
        setSort(key);
        sortSheetRef.current?.dismiss();
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []);

    const handleScrollToTop = useCallback(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const handleScroll = useCallback((e) => {
        const y = e.nativeEvent.contentOffset.y;
        setShowScrollTop((prev) => {
            const next = y > 400;
            return prev === next ? prev : next;
        });
    }, []);

    const renderItem = useCallback(({ item }) => (
        <FindCard
            item={item}
            configStore={configStore}
            onPress={() => router.navigate(`/profile/${item.idx}`)}
        />
    ), [configStore, router]);

    const keyExtractor = useCallback((item) => String(item.idx), []);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.7}
                pressBehavior="close"
            />
        ),
        [],
    );

    const ListFooter = useMemo(() => {
        if (loadingMore) {
            return (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            );
        }
        return null;
    }, [loadingMore]);

    const ListEmpty = useMemo(() => {
        if (loading) {
            return (
                <View style={styles.emptyWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            );
        }
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText} allowFontScaling={false}>
                    조건에 맞는 회원이 없습니다.
                </Text>
            </View>
        );
    }, [loading]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {Platform.OS === 'android' && <StatusBar style="dark" />}

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle} allowFontScaling={false}>친구 찾기</Text>
                <Pressable
                    style={styles.sortBtn}
                    onPress={handleSortPress}
                    hitSlop={8}
                    testID="find-sort-btn"
                >
                    <Text style={styles.sortText} allowFontScaling={false}>{sortLabel}</Text>
                    <Image
                        source={require('../../assets/icons/chevron-down.svg')}
                        style={{ width: 16, height: 16 }}
                        tintColor={COLORS.textPrimary}
                    />
                </Pressable>
            </View>

            {/* 필터 칩 */}
            <View style={styles.chipBarWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    {ROLE_CHIPS.map((r) => {
                        const isOn = roles[r.key];
                        return (
                            <Pressable
                                key={r.key}
                                style={[styles.filterChip, isOn ? styles.filterChipActive : styles.filterChipInactive]}
                                onPress={() => handleRoleToggle(r.key)}
                                testID={`find-role-chip-${r.key}`}
                            >
                                <Text
                                    style={[styles.filterChipText, isOn ? styles.filterChipTextActive : styles.filterChipTextInactive]}
                                    allowFontScaling={false}
                                >
                                    {r.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                    {FILTERS.map((f) => {
                        const isActive = !!activeFilters[f.key];
                        return (
                            <Pressable
                                key={f.key}
                                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                                onPress={() => handleFilterPress(f.key)}
                                testID={`find-filter-chip-${f.key}`}
                            >
                                <Text
                                    style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}
                                    allowFontScaling={false}
                                >
                                    {f.label}
                                </Text>
                                {isActive && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation?.();
                                            handleFilterPress(f.key, true);
                                        }}
                                        hitSlop={8}
                                        testID={`find-filter-chip-close-${f.key}`}
                                    >
                                        <Image
                                            source={require('../../assets/icons/close-chip.svg')}
                                            style={{ width: 16, height: 16 }}
                                            tintColor={COLORS.white}
                                        />
                                    </Pressable>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* 리스트 */}
            <FlashList
                ref={listRef}
                data={list}
                renderItem={renderItem}
                // keyExtractor={keyExtractor}
                // estimatedItemSize={140}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                onScroll={handleScroll}
                scrollEventThrottle={100}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.textPrimary}
                        colors={[COLORS.primary]}
                    />
                }
            />

            {/* FAB — scroll to top */}
            {showScrollTop && (
                <View style={[styles.fabContainer, { bottom: 20 }]}>
                    <Pressable
                        style={styles.fabScrollTop}
                        onPress={handleScrollToTop}
                        testID="find-fab-scrolltop-btn"
                    >
                        <Image
                            source={require('../../assets/icons/arrow-up-line.svg')}
                            style={{ width: 24, height: 24 }}
                        />
                    </Pressable>
                </View>
            )}

            {/* 필터 바텀시트 */}
            <FindFilterBottomSheet
                ref={filterSheetRef}
                filters={activeFilters}
                onChange={handleFilterChange}
            />

            {/* 정렬 바텀시트 */}
            <BottomSheetModal
                ref={sortSheetRef}
                enableDynamicSizing={true}
                enableOverDrag={false}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                onChange={(index) => setSortSheetOpen(index >= 0)}
                backgroundStyle={styles.sortSheetBg}
                handleIndicatorStyle={styles.sortHandleIndicator}
            >
                <BottomSheetView style={[styles.sortSheet, { paddingBottom: SPACING.xl + insets.bottom }]}>
                    <Text style={styles.sortTitle} allowFontScaling={false}>정렬</Text>
                    {SORT_OPTIONS.map((o) => {
                        const active = sort === o.key;
                        return (
                            <Pressable
                                key={o.key}
                                style={styles.sortItem}
                                onPress={() => handleSortPick(o.key)}
                                testID={`find-sort-option-${o.key}`}
                            >
                                <Text
                                    style={[styles.sortItemText, active && styles.sortItemTextActive]}
                                    allowFontScaling={false}
                                >
                                    {o.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </BottomSheetView>
            </BottomSheetModal>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.black,
        lineHeight: 30,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sortText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },

    /* 필터 칩 */
    chipBarWrap: {
        backgroundColor: COLORS.white,
        paddingBottom: SPACING.sm,
    },
    filterContainer: {
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
    },
    filterChip: {
        height: 32,
        borderRadius: 100,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
    },
    filterChipInactive: {
        backgroundColor: COLORS.primaryBg,
    },
    filterChipText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        textAlign: 'center',
    },
    filterChipTextActive: {
        color: COLORS.white,
    },
    filterChipTextInactive: {
        color: COLORS.primaryMediumDark,
    },

    /* 리스트 */
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl,
    },

    /* 카드 */
    card: {
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        gap: SPACING.md,
        backgroundColor: COLORS.white,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarWrap: {
        width: 62,
        height: 62,
        borderRadius: 100,
        overflow: 'hidden',
        backgroundColor: COLORS.grayF1,
    },
    avatar: {
        width: 62,
        height: 62,
    },
    cardInfo: {
        flex: 1,
        gap: 4,
    },
    cardNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cardNickname: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    roleBadge: {
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    roleBadgeText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.textPrimary,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
    },
    cardMeta: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textMedium,
    },
    regionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        flexShrink: 1,
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
    },
    cardBio: {
        flex: 1,
        minWidth: 0,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    profileViewBtn: {
        alignSelf: 'flex-end',
        flexShrink: 0,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.grayEE,
        borderRadius: 8,
        width: 80,
        paddingVertical: 6,
    },
    profileViewBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
    likeBtn: {
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        width: 80,
        paddingVertical: 6,
    },
    likeBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.white,
    },

    /* 빈 상태 / 로딩 */
    emptyWrap: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 120,
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md,
        color: COLORS.textMedium,
    },
    loadingMore: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },

    /* FAB */
    fabContainer: {
        position: 'absolute',
        right: SPACING.xl,
        gap: SPACING.sm,
        alignItems: 'center',
    },
    fabScrollTop: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },

    /* 정렬 바텀시트 */
    sortSheetBg: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    sortHandleIndicator: {
        backgroundColor: COLORS.disabledBtn,
        width: 40,
    },
    sortSheet: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        gap: SPACING.sm,
    },
    sortTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    sortItem: {
        paddingVertical: SPACING.md,
    },
    sortItemText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textMedium,
    },
    sortItemTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
});
