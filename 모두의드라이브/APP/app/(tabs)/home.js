import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Share, Linking,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useFocusEffect } from 'expo-router';
import { navigateByLinkType } from '../../src/utils/navigateByLinkType';

import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import useMatchStore from '../../src/store/matchStore';
import usePopupStore from '../../src/store/popupStore';
import { matchApi } from '../../src/api/match';
import { reviewApi } from '../../src/api/review';
import { bannerApi } from '../../src/api/banner';
import { popupApi } from '../../src/api/popup';
import { filterVisiblePopups } from '../../src/utils/mainPopupStorage';
import client from '../../src/api/client';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';
import dayjs from 'dayjs';
import FilterBottomSheet from '../../src/components/home/filters/FilterBottomSheet';
import MatchCard from '../../src/components/MatchCard';

const TAB_BAR_HEIGHT = 64;

const HOME_TABS = ['오너', '게스트', '내매칭', '리뷰'];
const MY_MATCH_FILTERS = [
    { key: 'all', label: '전체' },
    { key: 'active', label: '진행중' },
    { key: 'ended', label: '종료' },
];

/* ──────────── 프로필 헤더 ──────────── */
function ProfileHeader({ user, configStore }) {
    const router = useRouter();
    if (!user) return null;

    const isOwner = user.role === 'owner';
    const roleLabel = configStore.getLabel('roles', user.role);
    const roleBgColor = isOwner ? COLORS.secondary : COLORS.safety;
    const birthYear = user.birthDate ? dayjs(user.birthDate).year() : null;
    const age = birthYear ? `${Math.floor((dayjs().year() - birthYear) / 10) * 10}대` : '';
    const genderLabel = configStore.getLabel('genders', user.gender);

    return (
        <View style={styles.profileSection}>
            <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                    <View style={styles.avatarWrap}>
                        {user.profileImage ? (
                            <Image source={{ uri: STORAGE_URL + user.profileImage }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <Image source={require('../../assets/icons/profile-avatar.svg')} style={styles.avatar} />
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.nicknameRow}>
                            <Text style={styles.nickname} allowFontScaling={false} numberOfLines={1}>
                                {user.nickname}
                            </Text>
                            <View style={[styles.roleBadge, { backgroundColor: roleBgColor }]}>
                                <Text style={styles.roleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                            </View>
                        </View>
                        <View style={styles.tagRow}>
                            {age ? <ProfileTag label={age} /> : null}
                            {genderLabel ? <ProfileTag label={genderLabel} /> : null}
                            {isOwner && user.ownerProfile?.driveLevel && (
                                <ProfileTag label={configStore.getLabel('driveLevels', user.ownerProfile.driveLevel).split('(')[0]} />
                            )}
                        </View>
                    </View>
                </View>
                <View style={styles.mannerCol}>
                    <View style={styles.mannerScoreRow}>
                        <Image source={require('../../assets/icons/smile.svg')} style={{ width: 18, height: 18 }} />
                        <Text style={styles.mannerScore} allowFontScaling={false}>{user.mannerScore != null ? Math.round(Number(user.mannerScore)) : '-'}</Text>
                    </View>
                    <Text style={styles.mannerLabel} allowFontScaling={false}>매너점수</Text>
                </View>
            </View>

        </View>
    );
}

function ProfileTag({ label }) {
    return (
        <View style={styles.profileTag}>
            <Text style={styles.profileTagText} allowFontScaling={false}>{label}</Text>
        </View>
    );
}

/* ──────────── 배너 캐러셀 ──────────── */
function BannerCarousel({ banners: rawBanners }) {
    const router = useRouter();
    const banners = useMemo(
        () => (rawBanners || []).filter(b => b && typeof b.imageUrl === 'string' && b.imageUrl.trim() !== ''),
        [rawBanners]
    );
    const [currentIdx, setCurrentIdx] = useState(0);
    const scrollRef = useRef(null);
    const timerRef = useRef(null);
    const restartTimerRef = useRef(null);
    const { width: frameWidth } = useSafeAreaFrame();
    const bannerWidth = frameWidth - 40; // 좌우 패딩 20씩

    const startAutoRoll = useCallback(() => {
        if (banners.length <= 1) return;
        stopAutoRoll();
        timerRef.current = setInterval(() => {
            setCurrentIdx(prev => {
                const next = (prev + 1) % banners.length;
                scrollRef.current?.scrollTo({ x: next * bannerWidth, animated: true });
                return next;
            });
        }, 3000);
    }, [banners.length, bannerWidth]);

    const stopAutoRoll = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        startAutoRoll();
        return () => stopAutoRoll();
    }, [startAutoRoll]);

    // 사용자 스와이프 시 멈춤 → 3초 후 재시작
    const handleScrollBegin = useCallback(() => {
        stopAutoRoll();
    }, [stopAutoRoll]);

    const handleScrollEnd = useCallback((e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
        setCurrentIdx(idx);
        // 스와이프 후 3초 뒤 자동롤링 재시작 (ref로 관리해 unmount 시 정리)
        restartTimerRef.current = setTimeout(() => startAutoRoll(), 3000);
    }, [bannerWidth, startAutoRoll]);

    if (banners.length === 0) return null;

    return (
        <View style={styles.bannerSection}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollEnd={handleScrollEnd}
                style={{ width: bannerWidth, borderRadius: 12 }}
            >
                {banners.map((banner, i) => (
                    <Pressable
                        key={banner.idx || i}
                        style={[styles.bannerItem, { width: bannerWidth }]}
                        onPress={() => {
                            if (banner.linkType && banner.linkType !== 'none') {
                                navigateByLinkType(router, banner.linkType, banner.linkTarget);
                            } else if (banner.linkUrl && /^https?:\/\//i.test(banner.linkUrl)) {
                                // 레거시: linkType 이전에 등록된 배너
                                Linking.openURL(banner.linkUrl).catch(() => {});
                            }
                        }}
                        testID={`home-banner-${banner.idx || i}`}
                    >
                        <Image
                            source={{ uri: STORAGE_URL + banner.imageUrl }}
                            style={styles.bannerImage}
                            contentFit="cover"
                        />
                    </Pressable>
                ))}
            </ScrollView>
            {banners.length > 1 && (
                <View style={styles.indicatorRowCount}>
                    <Text style={styles.indicatorRowCountText}>{currentIdx + 1} / {banners.length}</Text>
                </View>
            )}
            {/* {banners.length > 1 && (
                <View style={styles.indicatorRow}>
                    {banners.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.indicator,
                                i === currentIdx ? styles.indicatorActive : styles.indicatorInactive,
                            ]}
                        />
                    ))}
                </View>
            )} */}
        </View>
    );
}

/* ──────────── 필터 칩 ──────────── */
function FilterChips({ filters, onReset, onFilterPress, activeFilters }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
        >
            <Pressable style={styles.resetBtn} onPress={onReset} testID="home-filter-reset-btn">
                <Image source={require('../../assets/icons/refresh.svg')} style={{ width: 16, height: 16 }} tintColor={COLORS.white} />
            </Pressable>
            {filters.map((f) => {
                const isActive = activeFilters[f.key];
                return (
                    <Pressable
                        key={f.key}
                        style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                        onPress={() => onFilterPress(f.key)}
                        testID={`home-filter-chip-${f.key}`}
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
                                    onFilterPress(f.key, true);
                                }}
                                hitSlop={8}
                                testID={`home-filter-chip-close-${f.key}`}
                            >
                                <Image source={require('../../assets/icons/close-chip.svg')} style={{ width: 16, height: 16 }} tintColor={COLORS.white} />
                            </Pressable>
                        )}
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

/* ──────────── 리뷰 카드 ──────────── */
function ReviewCard({ item, configStore }) {
    const router = useRouter();
    const user = item.user;
    const roleLabel = configStore.getLabel('roles', user?.role);
    const roleBgColor = user?.role === 'owner' ? COLORS.gold : COLORS.safety;
    const courses = item.courses || [];
    const photos = item.photos || [];
    const courseText = courses.map(c => c.placeName).join(' > ');

    return (
        <TouchableOpacity
            style={styles.reviewCard}
            onPress={() => router.navigate('/review/' + item.idx)}
            activeOpacity={0.85}
            testID={`home-review-card-${item.idx}`}
        >
            {/* 작성자 */}
            <View style={styles.reviewAuthor}>
                <View style={styles.reviewAvatarWrap}>
                    {user?.profileImage ? (
                        <Image source={{ uri: STORAGE_URL + user.profileImage }} style={styles.reviewAvatar} contentFit="cover" />
                    ) : (
                        <Image source={require('../../assets/icons/profile-avatar.svg')} style={styles.reviewAvatar} />
                    )}
                </View>
                <View style={styles.reviewAuthorInfo}>
                    <Text style={styles.reviewNickname} allowFontScaling={false}>{user?.nickname}</Text>
                    <View style={[styles.reviewRoleBadge, { backgroundColor: roleBgColor }]}>
                        <Text style={styles.reviewRoleBadgeText} allowFontScaling={false}>{roleLabel}</Text>
                    </View>
                </View>
            </View>

            {/* 내용 */}
            <Text style={styles.reviewContent} allowFontScaling={false} numberOfLines={3}>
                {item.content}
            </Text>

            {/* 코스 바 */}
            {courses.length > 0 && (
                <View style={styles.courseBar}>
                    <Image source={require('../../assets/icons/basil_location-solid.svg')} style={{ width: 20, height: 20 }} />
                    <Text style={styles.courseText} allowFontScaling={false} numberOfLines={1}>
                        {courseText}
                    </Text>
                </View>
            )}

            {/* 사진 그리드 */}
            {photos.length > 0 && (
                <View style={styles.reviewPhotoGrid}>
                    {photos.slice(0, 5).map((photo, i) => (
                        <View key={i} style={styles.reviewPhotoItem}>
                            <Image
                                source={{ uri: STORAGE_URL + photo.imageUrl }}
                                style={styles.reviewPhotoImg}
                                contentFit="cover"
                            />
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}

/* ──────────── 리뷰 빈 상태 ──────────── */
function ReviewEmpty() {
    return (
        <View style={styles.reviewEmpty}>
            <Image source={require('../../assets/icons/review-empty.svg')} style={{ width: 64, height: 64 }} />
            <Text style={styles.reviewEmptyText} allowFontScaling={false}>리뷰가 없습니다.</Text>
        </View>
    );
}

/* ──────────── 사업자 정보 푸터 ──────────── */
function BusinessFooter({ config }) {

    const { width } = useSafeAreaFrame();

    return (
        <View style={[styles.footer, { }]}>
            <Text style={styles.footerCompany} allowFontScaling={false}>주식회사 엠코스</Text>
            <View style={styles.footerInfo}>
                <View style={styles.footerCol}>
                    <Text style={[styles.footerLabel, { fontSize: width <= 340 ? FONT_SIZE.xs : FONT_SIZE.sm }]} allowFontScaling={false}>
                        {'대표이사\n개인정보보호책임자\n사업자등록번호\nEMAIL\nTEL\n주소'}
                    </Text>
                </View>
                <View style={styles.footerColValue}>
                    <Text style={[styles.footerValue, { fontSize: width <= 340 ? FONT_SIZE.xs : FONT_SIZE.sm }]} allowFontScaling={false}>
                        {`${config?.ceo || ''}\n${config?.ceo || ''}\n${config?.businessNum || ''}\n${config?.email || ''}\n${config?.tel || ''}\n${config?.addr || ''}`}
                    </Text>
                </View>
            </View>
        </View>
    );
}

/* ══════════════════════════════ 메인 홈 화면 ══════════════════════════════ */
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isLoggedIn, fetchMe } = useAuthStore();
    const configStore = useConfigStore();
    const scrollRef = useRef(null);

    // 메인 prefetch 캐시 — 첫 진입에만 사용
    const prefetched = useMatchStore.getState();
    const hasPrefetch = !!(prefetched.prefetchedAt && prefetched.ownerList);

    const [activeTab, setActiveTab] = useState(0); // 0=오너 1=게스트 2=내매칭 3=리뷰
    const [matchList, setMatchList] = useState(hasPrefetch ? (prefetched.ownerList || []) : []);
    const [reviewList, setReviewList] = useState([]);
    const [needsEvaluation, setNeedsEvaluation] = useState({});
    const [banners, setBanners] = useState(hasPrefetch ? (prefetched.banners || []) : []);
    const [loading, setLoading] = useState(!hasPrefetch);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(hasPrefetch ? (prefetched.ownerTotalCount || 0) : 0);
    const [hasMore, setHasMore] = useState(true);
    const isLoadingMore = useRef(false);
    const initialFetchDone = useRef(false);

    // 내매칭 서브필터
    const [myMatchFilter, setMyMatchFilter] = useState('all');

    // 필터: { region: {sido,sigungu}|null, date: 'YYYY-MM-DD'|null, carType, gender, age }
    const [activeFilters, setActiveFilters] = useState({});
    const [config, setConfig] = useState(hasPrefetch ? prefetched.config : null);
    const filterSheetRef = useRef(null);
    // [C125-4] 사업자정보 푸터 제거로 footer 도달 감지 폐기 →
    // 스크롤이 일정량(600px) 내려오면 '맨 위로' 버튼 노출
    const [showScrollTop, setShowScrollTop] = useState(false);
    const SCROLL_TOP_THRESHOLD = 600;

    const handleScroll = useCallback((e) => {
        const y = e.nativeEvent.contentOffset.y;
        const visible = y > SCROLL_TOP_THRESHOLD;
        setShowScrollTop(prev => prev === visible ? prev : visible);
    }, []);

    const FILTERS = useMemo(() => {
        if (activeTab !== 0 && activeTab !== 1) return [];
        const carTypeLabel = activeFilters.carType
            ? configStore.getLabel('carTypes', activeFilters.carType)
            : '차종';
        const genderLabel = activeFilters.gender
            ? configStore.getLabel('filterGenders', activeFilters.gender)
            : '성별';
        const ageLabel = activeFilters.age
            ? configStore.getLabel('filterAges', activeFilters.age)
            : '나이';
        const regionLabel = activeFilters.region
            ? [activeFilters.region.sido, activeFilters.region.sigungu].filter(Boolean).join(' ')
            : '지역';
        const dateLabel = activeFilters.date
            ? dayjs(activeFilters.date).format('M.D')
            : '날짜';
        return [
            { key: 'region', label: regionLabel },
            { key: 'date', label: dateLabel },
            { key: 'carType', label: carTypeLabel },
            { key: 'gender', label: genderLabel },
            { key: 'age', label: ageLabel },
        ];
    }, [activeTab, activeFilters, configStore]);

    // 데이터 가져오기
    const fetchData = useCallback(async (pageNum = 1, isSilent = false) => {
        if (pageNum > 1 && isLoadingMore.current) return;
        if (pageNum > 1) isLoadingMore.current = true;
        try {
            if (pageNum === 1 && !isSilent) setLoading(true);

            // 배너 (첫 로드)
            if (pageNum === 1) {
                try {
                    const bannerRes = await bannerApi.getList();
                    setBanners(bannerRes.data || []);
                } catch {}
            }

            // config (첫 로드)
            if (!config) {
                try {
                    const configRes = await client.post('/config');
                    setConfig(configRes.data);
                } catch {}
            }

            if (activeTab === 3) {
                // 리뷰 탭
                const res = await reviewApi.getList({ page: pageNum, limit: 20 });
                const data = res.data;
                if (pageNum === 1) {
                    setReviewList(data.list || []);
                } else {
                    setReviewList(prev => [...prev, ...(data.list || [])]);
                }
                setTotalCount(data.totalCount || 0);
                setHasMore((data.list || []).length >= 20);
            } else if (activeTab === 2) {
                // 내매칭 탭
                const res = await matchApi.getMyList({
                    page: pageNum, limit: 20,
                    statusFilter: myMatchFilter,
                });
                const data = res.data;
                if (pageNum === 1) {
                    setMatchList(data.list || []);
                } else {
                    setMatchList(prev => [...prev, ...(data.list || [])]);
                }
                setNeedsEvaluation(data.needsEvaluation || {});
                setTotalCount(data.totalCount || 0);
                setHasMore((data.list || []).length >= 20);
            } else {
                // 오너/게스트 탭
                const authorRole = activeTab === 0 ? 'owner' : 'guest';
                const params = { authorRole, page: pageNum, limit: 20 };

                const res = await matchApi.getList(params);
                const data = res.data;
                if (pageNum === 1) {
                    setMatchList(data.list || []);
                } else {
                    setMatchList(prev => [...prev, ...(data.list || [])]);
                }
                setTotalCount(data.totalCount || 0);
                setHasMore((data.list || []).length >= 20);
            }

            setPage(pageNum);
        } catch (e) {
            console.error('fetchData error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            isLoadingMore.current = false;
        }
    }, [activeTab, myMatchFilter, config]);

    const focusCountRef = useRef(0);
    useFocusEffect(useCallback(() => {
        setStatusBarStyle('light');
        focusCountRef.current += 1;
        if (focusCountRef.current === 1) return;
        fetchData(1, true);
    }, [fetchData]));



    // 홈 진입 시 유저 프로필 최신화
    useEffect(() => {
        if (isLoggedIn) fetchMe();
    }, []);

    // 홈 첫 진입 시 메인 팝업 노출 (세션당 1회)
    const mainPopupCheckedRef = useRef(false);
    useEffect(() => {
        if (mainPopupCheckedRef.current) return;
        mainPopupCheckedRef.current = true;
        (async () => {
            try {
                const res = await popupApi.getMain();
                const all = Array.isArray(res.data) ? res.data : [];
                if (all.length === 0) return;
                const visible = await filterVisiblePopups(all);
                if (visible.length === 0) return;
                usePopupStore.getState().show('mainPopup', { popups: visible });
            } catch {}
        })();
    }, []);

    useEffect(() => {
        // 첫 마운트: prefetch 캐시가 있으면 isSilent=true 백그라운드 갱신
        if (!initialFetchDone.current) {
            initialFetchDone.current = true;
            const isSilent = hasPrefetch && activeTab === 0;
            if (isSilent) {
                // 캐시 1회 소진 후 비움 — 다음 진입(로그아웃 후 재로그인 등)을 위해
                useMatchStore.getState().clearHomeCache();
            }
            fetchData(1, isSilent);
            return;
        }
        fetchData(1);
    }, [activeTab, myMatchFilter]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(1, true);
    }, [fetchData]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !loading) {
            fetchData(page + 1);
        }
    }, [hasMore, loading, page, fetchData]);

    const handleScrollToTop = useCallback(() => {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const handleFilterPress = useCallback((key, clear) => {
        if (clear) {
            setActiveFilters(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
            return;
        }
        filterSheetRef.current?.open(key);
    }, []);

    const handleFilterReset = useCallback(() => {
        setActiveFilters({});
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []);

    const handleShare = useCallback(async () => {
        const shareText = config?.shareText || '모두의 드라이브 - 모드';
        const shareUrl = config?.shareUrl || '';
        try {
            if (Platform.OS === 'ios') {
                await Share.share({ message: shareText, url: shareUrl });
            } else {
                await Share.share({ message: shareUrl ? `${shareText}\n${shareUrl}` : shareText });
            }
        } catch (e) {
            console.warn('share error', e);
        }
    }, [config]);

    const handleFilterChange = useCallback((key, value) => {
        setActiveFilters(prev => {
            const next = { ...prev };
            if (value == null) delete next[key];
            else next[key] = value;
            return next;
        });
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []);

    // 클라이언트 사이드 필터링 (오너/게스트 탭 한정)
    const filteredMatchList = useMemo(() => {
        if (activeTab !== 0 && activeTab !== 1) return matchList;
        const f = activeFilters;
        if (!f.region && !f.date && !f.carType && !f.gender && !f.age) return matchList;
        return matchList.filter((m) => {
            if (f.region) {
                const ok = (m.meetingRegions || []).some((r) => {
                    if (f.region.sigungu) {
                        return r.sido === f.region.sido && r.sigungu === f.region.sigungu;
                    }
                    return r.sido === f.region.sido;
                });
                if (!ok) return false;
            }
            if (f.date) {
                if (!m.driveDate || dayjs(m.driveDate).format('YYYY-MM-DD') !== f.date) return false;
            }
            if (f.carType) {
                const cars = m.author?.cars || [];
                if (!cars.some((c) => c.carType === f.carType)) return false;
            }
            if (f.gender && f.gender !== 'any') {
                const isGroup = m.matchType === 'group';
                if (isGroup) {
                    const ownerArr = Array.isArray(m.ownerGender) ? m.ownerGender : [];
                    const guestArr = Array.isArray(m.guestGender) ? m.guestGender : [];
                    if (!ownerArr.includes(f.gender) && !ownerArr.includes('any') &&
                        !guestArr.includes(f.gender) && !guestArr.includes('any')) return false;
                } else {
                    // 오너탭(0) → guestGender, 게스트탭(1) → ownerGender
                    const key = activeTab === 0 ? 'guestGender' : 'ownerGender';
                    const arr = Array.isArray(m[key]) ? m[key] : [];
                    if (!arr.includes(f.gender) && !arr.includes('any')) return false;
                }
            }
            if (f.age && f.age !== 'any') {
                const isGroup = m.matchType === 'group';
                if (isGroup) {
                    const ownerArr = Array.isArray(m.ownerAge) ? m.ownerAge : [];
                    const guestArr = Array.isArray(m.guestAge) ? m.guestAge : [];
                    if (!ownerArr.includes(f.age) && !ownerArr.includes('any') &&
                        !guestArr.includes(f.age) && !guestArr.includes('any')) return false;
                } else {
                    const key = activeTab === 0 ? 'guestAge' : 'ownerAge';
                    const arr = Array.isArray(m[key]) ? m[key] : [];
                    if (!arr.includes(f.age) && !arr.includes('any')) return false;
                }
            }
            return true;
        });
    }, [activeTab, matchList, activeFilters]);

    // [서브탭+필터칩] 서브 헤더 — FlashList sentinel sticky 로 동작
    const renderSubHeader = useCallback(() => (
        <View style={styles.subHeader}>
            <View style={styles.tabSection}>
                <View style={styles.tabRow}>
                    {HOME_TABS.map((tab, i) => (
                        <Pressable key={i} onPress={() => { if (activeTab === i) return; setActiveTab(i); setMatchList([]); setReviewList([]); }} testID={`home-tab-${i}`}>
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === i ? styles.tabTextActive : styles.tabTextInactive,
                                ]}
                                allowFontScaling={false}
                            >
                                {tab}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                
            </View>

            {(activeTab === 0 || activeTab === 1) && (
                <View style={styles.chipBarWrap}>
                    <FilterChips
                        filters={FILTERS}
                        activeFilters={activeFilters}
                        onFilterPress={handleFilterPress}
                        onReset={handleFilterReset}
                    />
                </View>
            )}
            {activeTab === 2 && (
                <View style={styles.myMatchFilterRow}>
                    {MY_MATCH_FILTERS.map(f => (
                        <Pressable
                            key={f.key}
                            style={[
                                styles.myMatchFilterChip,
                                myMatchFilter === f.key && styles.myMatchFilterChipActive,
                            ]}
                            onPress={() => {
                                // [C117-3] 동일 키 재선택 시 리스트 리셋 방지 (깜빡임/재로딩 제거)
                                if (myMatchFilter === f.key) return;
                                setMyMatchFilter(f.key);
                                setMatchList([]);
                            }}
                            testID={`home-subfilter-${f.key}`}
                        >
                            <Text
                                style={[
                                    styles.myMatchFilterText,
                                    myMatchFilter === f.key && styles.myMatchFilterTextActive,
                                ]}
                                allowFontScaling={false}
                            >
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    ), [activeTab, FILTERS, activeFilters, myMatchFilter, handleFilterPress, handleFilterReset]);

    // 리스트 헤더 — 프로필(파란 배경) + 배너만. 서브헤더는 sentinel 로 sticky.
    const ListHeader = useMemo(() => (
        <View style={styles.headerBg}>
            {isLoggedIn && user && (
                <View style={styles.profilePad}>
                    <ProfileHeader user={user} configStore={configStore} />
                </View>
            )}
            <BannerCarousel banners={banners} />
        </View>
    ), [banners, isLoggedIn, user, configStore]);

    const baseList = activeTab === 3 ? reviewList : filteredMatchList;
    // sentinel 첫 항목 + 실데이터. stickyHeaderIndices=[0] 으로 sticky.
    const listData = useMemo(
        () => [{ __sticky: true }, ...baseList],
        [baseList]
    );

    const renderItem = useCallback(({ item }) => {
        if (item && item.__sticky) {
            return renderSubHeader();
        }
        if (activeTab === 3) {
            return <ReviewCard item={item} configStore={configStore} />;
        }
        return <MatchCard item={item} configStore={configStore} needsEvaluation={needsEvaluation} />;
    }, [activeTab, configStore, renderSubHeader, needsEvaluation]);

    const getItemType = useCallback((item) => (item && item.__sticky ? 'sticky' : 'row'), []);
    const keyExtractor = useCallback(
        (item, idx) => (item && item.__sticky ? '__sticky' : String(item.idx ?? idx)),
        []
    );

    // baseList 가 비었을 때 sticky 행 다음에 보여줄 빈 상태 — ListFooter 위쪽에 렌더
    // (주의) 아래 ListFooterComponent 보다 반드시 먼저 선언해야 한다 (TDZ 회피)
    const emptyView = useMemo(() => {
        if (baseList.length > 0) return null;
        if (loading) {
            return (
                <View style={styles.emptyWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            );
        }
        if (activeTab === 3) {
            return <ReviewEmpty />;
        }
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText} allowFontScaling={false}>매칭이 없습니다.</Text>
            </View>
        );
    }, [baseList.length, loading, activeTab]);

    const ListFooterComponent = useMemo(() => {
        let inner = null;
        if (loading && page > 1) {
            inner = (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            );
        }
        // 아래쪽 bounce 시 부모 파란색이 노출되지 않도록, 콘텐츠 하단에 흰색 무한 확장 박스를 부착
        return (
            <View style={{ marginTop: 20 }}>
                {emptyView}
                {inner}
                {/* [C125-4] 사업자정보 푸터(BusinessFooter) 제거됨 */}
                <View pointerEvents="none" style={styles.bottomOverscrollBg} />
            </View>
        );
    }, [loading, page, config, emptyView, baseList.length]);

    return (
        <View style={styles.container}>
            {Platform.OS === 'android' && <StatusBar style="light" />}
            {/* 부모는 파란색 — iOS 위쪽 bounce 시 파란 배경 + RefreshControl 흰색 spinner 노출.
               FlashList contentContainerStyle.backgroundColor=white 로 설정해
               아래쪽 bounce/본문 아래는 흰색이 끝까지 차도록. */}
            <View style={[styles.bouncesBg, { paddingTop: insets.top + 56 }]}>
                <FlashList
                    ref={scrollRef}
                    data={listData}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    stickyHeaderIndices={[0]}
                    estimatedItemSize={280}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={ListFooterComponent}
                    contentContainerStyle={{
                        backgroundColor: COLORS.white,
                        paddingBottom: SPACING.xl,
                    }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.white}
                            colors={[COLORS.primary]}
                            progressBackgroundColor={COLORS.white}
                        />
                    }
                />
            </View>

            {/* 상단 고정 헤더 — 모드 로고 + 공유. 항상 최상단에 떠있다. */}
            <View style={[styles.fixedTopBar, { paddingTop: insets.top, height: insets.top + 56 }]} pointerEvents="box-none">
                <View style={styles.topBar}>
                    <View style={styles.topBarLeft}>
                        <Image source={require('../../assets/icons/logo-car.png')} style={styles.logoImage} contentFit="contain" />
                        <Text style={styles.logoText} allowFontScaling={false}>모두의 드라이브</Text>
                    </View>
                    <Pressable hitSlop={8} onPress={handleShare} testID="home-share-btn">
                        <Image source={require('../../assets/icons/share-line.svg')} style={{ width: 24, height: 24 }} tintColor={COLORS.white} />
                    </Pressable>
                </View>
            </View>

            {/* FAB — 탭바가 일반 layout 이라 콘텐츠 영역은 탭바 위에서 끝남.
                따라서 bottom: 20 만으로 바텀탭 위 20px 에 위치. */}
            {(activeTab === 0 || activeTab === 1) && (
                <View style={[styles.fabContainer, { bottom: 20 }]}>
                    {showScrollTop && (
                        <Pressable style={styles.fabScrollTop} onPress={handleScrollToTop} testID="home-fab-scrolltop-btn">
                            <Image source={require('../../assets/icons/arrow-up-line.svg')} style={{ width: 24, height: 24 }} />
                        </Pressable>
                    )}
                    <Pressable style={styles.fabWrite} onPress={() => router.navigate('/match/create')} testID="home-fab-write-btn">
                        <Image source={require('../../assets/icons/add-fill.svg')} style={{ width: 24, height: 24 }} tintColor={COLORS.white} />
                    </Pressable>
                </View>
            )}

            {/* 통합 필터 바텀시트 */}
            <FilterBottomSheet
                ref={filterSheetRef}
                filters={activeFilters}
                onChange={handleFilterChange}
            />
        </View>
    );
}

/* ══════════════════════════════ 스타일 ══════════════════════════════ */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    /* 부모는 파란색 — iOS 위쪽 bounce 시 파란 배경 + RefreshControl 흰색 spinner 노출.
       FlashList contentContainerStyle 에 backgroundColor:white 를 적용해 본문/아래쪽 bounce 는 흰색. */
    bouncesBg: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },

    /* ── 상단 파란 배경 ── */
    headerBg: {
        backgroundColor: COLORS.primary,
        paddingBottom: SPACING.md
    },
    fixedTopBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        zIndex: 10,
    },
    subHeader: {
        backgroundColor: COLORS.white,
        gap: 4
    },
    chipBarWrap: {
        backgroundColor: COLORS.white,
        paddingBottom: SPACING.sm,
    },
    /* 아래쪽 bounce 시 부모 파란색이 노출되지 않도록 ListFooter 하단에 무한 확장하는 흰색 박스 */
    bottomOverscrollBg: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        height: 1000,
        backgroundColor: COLORS.white,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        height: 56,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    logoImage: {
        width: 32,
        height: 20,
    },
    logoText: {
        fontFamily: FONTS.jalnan,
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
    },

    /* ── 프로필 ── */
    profilePad: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    profileSection: {
        gap: SPACING.sm,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    profileLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: COLORS.grayF1
    },
    avatar: {
        width: 52,
        height: 52,
    },
    profileInfo: {
        flex: 1,
        gap: 4,
    },
    nicknameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 4,
    },
    nickname: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
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
    tagRow: {
        flexDirection: 'row',
        gap: 2,
    },
    profileTag: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 100,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    profileTagText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.white,
    },
    mannerCol: {
        alignItems: 'center',
        gap: 2,
    },
    mannerScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    mannerScore: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: '#FFCE52',
    },
    mannerLabel: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.white,
        textAlign: 'center',
    },


    /* ── 배너 ── */
    bannerSection: {
        // paddingHorizontal: SPACING.xl,
        // paddingBottom: SPACING.xl,
        gap: SPACING.sm,
        alignItems: 'center',
    },
    bannerItem: {
        aspectRatio: 4/1,
        // borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    indicatorRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicatorRowCount: {
        flexDirection: 'row',
        gap: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 5,
        right: 25,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 25,
        paddingHorizontal: SPACING.xs + 2,
        paddingVertical: SPACING.xs,
    },
    indicatorRowCountText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.white
    },
    indicator: {
        borderRadius: 16,
    },
    indicatorActive: {
        width: 32,
        height: 4,
        backgroundColor: COLORS.white,
    },
    indicatorInactive: {
        width: 4,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },

    /* ── 탭 메뉴 ── */
    tabSection: {
        paddingTop: SPACING.md,
        gap: SPACING.xl,
    },
    tabRow: {
        flexDirection: 'row',
        gap: SPACING.xxl,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    tabText: {
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        textAlign: 'center',
    },
    tabTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    tabTextInactive: {
        fontFamily: FONTS.semiBold,
        color: COLORS.primaryMediumDark,
    },

    /* ── 필터 ── */
    filterContainer: {
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
    },
    resetBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
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

    /* ── 내매칭 서브필터 ── */
    myMatchFilterRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingVertical: 4,
    },
    myMatchFilterChip: {
        height: 32,
        borderRadius: 100,
        paddingHorizontal: SPACING.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
    },
    myMatchFilterChipActive: {
        backgroundColor: COLORS.primary,
    },
    myMatchFilterText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.primaryMediumDark,
    },
    myMatchFilterTextActive: {
        color: COLORS.white,
    },

    /* ── 리뷰 카드 ── */
    reviewCard: {
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        padding: SPACING.xl,
        gap: SPACING.md,
    },
    reviewAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    reviewAvatarWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    reviewAvatar: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.grayF1
    },
    reviewAuthorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.safety,
    },
    reviewNickname: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    reviewRoleBadge: {
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    reviewRoleBadgeText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    reviewContent: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    courseBar: {
        backgroundColor: COLORS.grayF1,
        borderRadius: 8,
        padding: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    courseText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#969698',
    },
    reviewPhotoGrid: {
        flexDirection: 'row',
        gap: 4,
    },
    reviewPhotoItem: {
        flex: 1,
        maxWidth: '19.1%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        overflow: 'hidden',
    },
    reviewPhotoImg: {
        width: '100%',
        height: '100%',
    },

    /* ── 리뷰 빈 상태 ── */
    reviewEmpty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 120,
        gap: SPACING.xl,
    },
    reviewEmptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.textMedium,
        textAlign: 'center',
    },

    /* ── 빈 상태 ── */
    emptyWrap: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.textMedium,
    },

    /* ── 로딩 ── */
    loadingMore: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },

    /* ── 푸터 ── */
    footer: {
        paddingHorizontal: SPACING.xxxl,
        paddingVertical: SPACING.xl,
        gap: SPACING.sm,
    },
    footerCompany: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    footerInfo: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    footerCol: {},
    footerColValue: { flex: 1 },
    footerLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: '#969698',
    },
    footerValue: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textMedium,
    },

    /* ── FAB ── */
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
    fabWrite: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4, backgroundColor: COLORS.primary },
        }),
    },
});
