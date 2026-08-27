import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, FlatList, ActivityIndicator, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import AppHeader from '../../src/components/AppHeader';
import { bannerApi } from '../../src/api/banner';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../../src/constants/config';

const guideCarApp = require('../../assets/images/guide-car-app.gif');

const H_PAD = SPACING.xl;
const CARD_GAP = SPACING.md;

const GUIDE_PAGES = [
    { title: '오늘은 누구와 달려볼까~', desc: '나의 드라이브 타입에 맞는 상대를 선택해 보세요' },
    { title: '매칭 시작하기', desc: '원하는 조건을 설정하고 드라이브 매칭을 시작하세요' },
    { title: '안전한 드라이브', desc: '매너 점수 시스템으로 안전한 드라이브를 즐기세요' },
    { title: '다양한 드라이브 모드', desc: '풍경감상, 음악감상, 핫플코스 등 취향대로 선택하세요' },
];

const Dots = memo(function Dots({ total, current }) {
    return (
        <View style={styles.dots}>
            {Array.from({ length: total }, (_, i) => (
                <View key={i} style={i === current ? styles.dotActive : styles.dot} />
            ))}
        </View>
    );
});

export default function SelectTypeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useSafeAreaFrame();
    const BANNER_WIDTH = SCREEN_WIDTH - H_PAD * 2;
    const BANNER_HEIGHT = Math.round(BANNER_WIDTH * (80 / 350));

    const { updateSignupData } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState(null);
    const [bannerPage, setBannerPage] = useState(0);
    const [guidePage, setGuidePage] = useState(0);
    const [banners, setBanners] = useState([]);
    const [bannerLoading, setBannerLoading] = useState(true);

    const bannerScrollRef = useRef(null);
    const bannerTimerRef = useRef(null);
    const bannerRestartRef = useRef(null);
    const guideRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await bannerApi.getList();
                const list = Array.isArray(res.data) ? res.data : [];
                setBanners(list);
            } catch (e) {
                console.log('banner fetch error:', e);
            } finally {
                setBannerLoading(false);
            }
        })();
    }, []);

    /* ── 배너 자동롤링 ── */
    const stopBannerAutoRoll = useCallback(() => {
        if (bannerTimerRef.current) {
            clearInterval(bannerTimerRef.current);
            bannerTimerRef.current = null;
        }
        if (bannerRestartRef.current) {
            clearTimeout(bannerRestartRef.current);
            bannerRestartRef.current = null;
        }
    }, []);

    const startBannerAutoRoll = useCallback(() => {
        if (banners.length <= 1) return;
        stopBannerAutoRoll();
        bannerTimerRef.current = setInterval(() => {
            setBannerPage(prev => {
                const next = (prev + 1) % banners.length;
                bannerScrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
                return next;
            });
        }, 3000);
    }, [banners.length, BANNER_WIDTH, stopBannerAutoRoll]);

    useEffect(() => {
        if (banners.length > 1) startBannerAutoRoll();
        return () => stopBannerAutoRoll();
    }, [banners.length, startBannerAutoRoll]);

    const handleBannerDragBegin = useCallback(() => {
        stopBannerAutoRoll();
    }, [stopBannerAutoRoll]);

    const handleBannerDragEnd = useCallback((e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
        setBannerPage(idx);
        if (bannerRestartRef.current) {
            clearTimeout(bannerRestartRef.current);
        }
        bannerRestartRef.current = setTimeout(() => startBannerAutoRoll(), 3000);
    }, [BANNER_WIDTH, startBannerAutoRoll]);

    const handleNext = useCallback(() => {
        if (!selectedRole) return;
        updateSignupData({ role: selectedRole });
        router.navigate('/auth/basic-profile');
    }, [selectedRole, updateSignupData, router]);

    const selectOwner = useCallback(() => setSelectedRole('owner'), []);
    const selectGuest = useCallback(() => setSelectedRole('guest'), []);

    const onGuideScroll = useCallback((e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - H_PAD * 2));
        setGuidePage(page);
    }, [SCREEN_WIDTH]);

    const handleBannerPress = useCallback((banner) => {
        const url = banner.linkUrl?.trim();
        if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
            Linking.openURL(url).catch(() => {});
        }
    }, []);

    const renderGuideItem = useCallback(() => (
        <View style={[styles.guideImageBox, { width: SCREEN_WIDTH - H_PAD * 2 }]}>
            <Image source={guideCarApp} style={styles.guideImage} contentFit="contain" />
        </View>
    ), [SCREEN_WIDTH]);

    const getGuideItemLayout = useCallback((_, index) => ({
        length: SCREEN_WIDTH - H_PAD * 2,
        offset: (SCREEN_WIDTH - H_PAD * 2) * index,
        index,
    }), [SCREEN_WIDTH]);

    const guideKeyExtractor = useCallback((_, i) => String(i), []);

    const isOwner = selectedRole === 'owner';
    const isGuest = selectedRole === 'guest';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="회원가입" onBack={() => router.back()} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 타이틀 + 카드 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.titleWrap} allowFontScaling={false}>
                        <Text style={styles.titleBlue}>회원가입 </Text>
                        <Text style={styles.titleBlack}>유형을 선택해 주세요.</Text>
                    </Text>

                    <View style={styles.typeRow}>
                        <Pressable
                            style={[styles.typeCard, isOwner ? styles.typeCardActive : styles.typeCardInactive]}
                            onPress={selectOwner}
                            testID="select-type-owner-btn"
                        >
                            <Text style={[styles.typeTitle, isOwner ? styles.typeTitleActive : styles.typeTitleInactive]} allowFontScaling={false}>
                                오너
                            </Text>
                            <View style={styles.typeIconBox}>
                                <Image source={require('../../assets/icons/car-owner.svg')} style={styles.typeIcon} />
                            </View>
                        </Pressable>

                        <Pressable
                            style={[styles.typeCard, isGuest ? styles.typeCardActive : styles.typeCardInactive]}
                            onPress={selectGuest}
                            testID="select-type-guest-btn"
                        >
                            <Text style={[styles.typeTitle, isGuest ? styles.typeTitleActive : styles.typeTitleInactive]} allowFontScaling={false}>
                                게스트
                            </Text>
                            <View style={styles.typeIconBox}>
                                <Image source={require('../../assets/icons/avatar-guest.svg')} style={styles.typeIcon} />
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* 배너 섹션 */}
                {bannerLoading ? (
                    <View style={[styles.bannerSection, { height: BANNER_HEIGHT }]}>
                        <View style={[styles.bannerItem, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        </View>
                    </View>
                ) : banners.length > 0 ? (
                    <View style={styles.bannerSection}>
                        <ScrollView
                            ref={bannerScrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScrollBeginDrag={handleBannerDragBegin}
                            onMomentumScrollEnd={handleBannerDragEnd}
                            style={{ width: BANNER_WIDTH }}
                        >
                            {banners.map((banner, i) => (
                                <Pressable
                                    key={banner.idx || i}
                                    style={[styles.bannerItem, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}
                                    onPress={() => handleBannerPress(banner)}
                                    disabled={!banner.linkUrl}
                                    testID={`select-type-banner-${banner.idx || i}`}
                                >
                                    <Image
                                        source={{ uri: STORAGE_URL + banner.imageUrl }}
                                        style={styles.bannerImage}
                                    />
                                </Pressable>
                            ))}
                        </ScrollView>
                        {banners.length > 1 ? <Dots total={banners.length} current={bannerPage} /> : null}
                    </View>
                ) : null}

                {/* 가이드 섹션 */}
                <View style={styles.guideSection}>
                    <View style={styles.guideTitleWrap}>
                        <Text style={styles.guideTitle} allowFontScaling={false}>
                            {GUIDE_PAGES[guidePage].title}
                        </Text>
                        <Text style={styles.guideDesc} allowFontScaling={false}>
                            {GUIDE_PAGES[guidePage].desc}
                        </Text>
                    </View>

                    <FlatList
                        ref={guideRef}
                        data={GUIDE_PAGES}
                        renderItem={renderGuideItem}
                        keyExtractor={guideKeyExtractor}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onGuideScroll}
                        scrollEventThrottle={16}
                        getItemLayout={getGuideItemLayout}
                    />

                    <Dots total={GUIDE_PAGES.length} current={guidePage} />
                </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.nextBtn, selectedRole ? styles.nextBtnActive : null]}
                    onPress={handleNext}
                    disabled={!selectedRole}
                    testID="select-type-next-btn"
                >
                    <Text style={styles.nextBtnText} allowFontScaling={false}>
                        {selectedRole ? '다음' : '가입 유형을 선택하세요.'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: H_PAD,
        gap: SPACING.xxxxl,
    },

    /* 섹션 공통 */
    section: {
        gap: SPACING.xl,
    },

    /* 타이틀 */
    titleWrap: {
        fontSize: 24,
        fontFamily: FONTS.extraBold,
        lineHeight: 36,
    },
    titleBlue: {
        fontSize: 24,
        fontFamily: FONTS.extraBold,
        lineHeight: 36,
        color: COLORS.primary,
    },
    titleBlack: {
        fontSize: 24,
        fontFamily: FONTS.extraBold,
        lineHeight: 36,
        color: COLORS.textPrimary,
    },

    /* 유형 카드 */
    typeRow: {
        flexDirection: 'row',
        gap: CARD_GAP,
    },
    typeCard: {
        flex: 1,
        height: 160,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: SPACING.xl,
        backgroundColor: COLORS.white,
        gap: SPACING.sm,
    },
    typeCardActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)',
    },
    typeCardInactive: {
        borderWidth: 2,
        borderColor: COLORS.white,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    },
    typeTitle: {
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
    },
    typeTitleActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    typeTitleInactive: {
        fontFamily: FONTS.semiBold,
        color: COLORS.grayMedium,
    },
    typeIconBox: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    typeIcon: {
        width: 56,
        height: 56,
    },

    /* 배너 */
    bannerSection: {
        gap: SPACING.sm,
    },
    bannerItem: {
        borderRadius: 12,
        borderCurve: 'continuous',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },

    /* 도트 인디케이터 */
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
    },
    dotActive: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },

    /* 가이드 */
    guideSection: {
        gap: SPACING.xl,
        alignItems: 'center',
    },
    guideTitleWrap: {
        gap: 5,
        alignItems: 'center',
        width: '100%',
    },
    guideTitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.jalnan,
        color: COLORS.primary,
        textAlign: 'center',
    },
    guideDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 20,
    },
    guideImageBox: {
        height: 113,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideImage: {
        width: 200,
        height: 113,
    },

    /* 하단 버튼 */
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    },
    nextBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtnActive: {
        backgroundColor: COLORS.primary,
    },
    nextBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
