import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useIAP, ErrorCode } from 'react-native-iap';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import AppHeader from '../../src/components/AppHeader';
import { showToast } from '../../src/utils/toast';
import useBottomSheetBackHandler from '../../src/hooks/useBottomSheetBackHandler';
import { chargePointRequest, chargePointIAP } from '../../src/api/point';
import useConfigStore from '../../src/store/configStore';
import usePointStore from '../../src/store/pointStore';

export default function PointCharge() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { pointProducts, pointProductsIAP, referralMaxCount } = useConfigStore();
    const refreshBalance = usePointStore((s) => s.refreshBalance);

    const [loading, setLoading] = useState(false);

    // [C123] Android 결제수단 선택 바텀시트 (카드/카카오페이)
    const methodSheetRef = useRef(null);
    const [methodSheetOpen, setMethodSheetOpen] = useState(false);
    const selectedProductRef = useRef(null);
    useBottomSheetBackHandler(methodSheetRef, methodSheetOpen);

    const isIOS = Platform.OS === 'ios';
    const products = useMemo(
        () => (isIOS ? pointProductsIAP : pointProducts),
        [isIOS, pointProductsIAP, pointProducts],
    );

    const iapSkus = useMemo(
        () => (pointProductsIAP || []).map((p) => p.sku || p.id).filter(Boolean),
        [pointProductsIAP],
    );

    const pendingProductRef = useRef(null);
    const productsByIdRef = useRef({});

    useEffect(() => {
        const map = {};
        (pointProductsIAP || []).forEach((p) => {
            if (p?.id) map[p.id] = p;
            if (p?.sku) map[p.sku] = p;
        });
        productsByIdRef.current = map;
    }, [pointProductsIAP]);

    const { connected, fetchProducts, requestPurchase, finishTransaction } = useIAP({
        onPurchaseSuccess: async (purchase) => {
            const productId = purchase?.productId;
            const product =
                pendingProductRef.current?.id === productId ||
                pendingProductRef.current?.sku === productId
                    ? pendingProductRef.current
                    : productsByIdRef.current[productId];
            const receipt =
                purchase?.purchaseToken || purchase?.transactionId || '';

            if (!product || !receipt) {
                try {
                    if (purchase) {
                        await finishTransaction({ purchase, isConsumable: true });
                    }
                } catch (finishErr) {
                    console.warn('IAP finishTransaction error', finishErr);
                }
                setLoading(false);
                pendingProductRef.current = null;
                return;
            }

            try {
                await chargePointIAP({
                    productId: product.id,
                    receipt,
                    platform: 'ios',
                });
                try {
                    await finishTransaction({ purchase, isConsumable: true });
                } catch (finishErr) {
                    console.warn('IAP finishTransaction error', finishErr);
                }
                showToast(
                    'success',
                    `${Number(product.points).toLocaleString()}P가 충전되었습니다.`,
                );
                await refreshBalance();
                setLoading(false);
                pendingProductRef.current = null;
                router.back();
            } catch (e) {
                try {
                    await finishTransaction({ purchase, isConsumable: true });
                } catch (finishErr) {
                    console.warn('IAP finishTransaction error', finishErr);
                }
                const msg =
                    e?.response?.data?.message || '포인트 충전에 실패했습니다.';
                showToast('error', msg);
                setLoading(false);
                pendingProductRef.current = null;
            }
        },
        onPurchaseError: (err) => {
            console.warn('IAP purchaseError', err);
            const code = err?.code;
            if (code !== ErrorCode.UserCancelled) {
                showToast('error', err?.message || '결제가 취소되었습니다.');
            }
            setLoading(false);
            pendingProductRef.current = null;
        },
    });

    useEffect(() => {
        if (!isIOS) return;
        if (!connected) return;
        if (!iapSkus.length) return;
        fetchProducts({ skus: iapSkus })
            .catch((e) => console.warn('[IAP] fetchProducts error', e));
    }, [isIOS, connected, iapSkus, fetchProducts]);

    // 상품 카드 탭: iOS는 즉시 IAP, Android는 결제수단 선택 시트 표시
    const handleProductPress = (product) => {
        if (loading) return;
        if (isIOS) {
            handlePurchaseIOS(product);
        } else {
            selectedProductRef.current = product;
            methodSheetRef.current?.present();
        }
    };

    // iOS 인앱결제
    const handlePurchaseIOS = async (product) => {
        setLoading(true);
        try {
            if (!connected) {
                showToast('error', '결제 모듈 준비 중입니다. 잠시 후 다시 시도해주세요.');
                setLoading(false);
                return;
            }
            const sku = product.sku || product.id;
            pendingProductRef.current = product;
            await requestPurchase({
                request: {
                    apple: { sku  },
                    google: { skus: [sku] },
                }
            });
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || '포인트 충전에 실패했습니다.';
            showToast('error', msg);
            pendingProductRef.current = null;
            setLoading(false);
        }
    };

    // [C123] Android: 결제수단(card/kakaopay) 선택 → 페이레터 결제 요청 → WebView 이동
    // 이중 결제 방지: setLoading은 비동기라 빠른 두 번째 탭이 loading=false를 볼 수 있으므로
    // 동기 ref 가드로 즉시 차단 (money path)
    const submittingRef = useRef(false);
    const handleSelectMethod = async (method) => {
        if (submittingRef.current) return;
        const product = selectedProductRef.current;
        methodSheetRef.current?.dismiss();
        if (!product) return;
        submittingRef.current = true;
        setLoading(true);
        try {
            const { paymentUrl, orderNo } = await chargePointRequest({ productId: product.id, method });
            setLoading(false);
            submittingRef.current = false;
            if (!paymentUrl) {
                showToast('error', '결제창을 불러오지 못했습니다.');
                return;
            }
            router.navigate({
                pathname: '/point/payment',
                params: { paymentUrl, orderNo },
            });
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || '포인트 충전에 실패했습니다.';
            showToast('error', msg);
            setLoading(false);
            submittingRef.current = false;
        }
    };

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior="close"
            />
        ),
        [],
    );

    const formatNumber = (num) => {
        return Number(num).toLocaleString();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="포인트 충전" onBack={() => router.back()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: SPACING.xl + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Section 1: 포인트 구매 */}
                <View style={styles.section}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>
                        포인트 구매
                    </Text>
                    <View style={styles.productGrid}>
                        {products.map((product, index) => (
                            <TouchableOpacity
                                key={product.id || index}
                                testID={`charge-product-${index}`}
                                activeOpacity={0.7}
                                disabled={loading}
                                style={[
                                    styles.productCard,
                                    styles.productCardUnselected,
                                    loading && { opacity: 0.5 },
                                ]}
                                onPress={() => handleProductPress(product)}
                            >
                                <Text
                                    allowFontScaling={false}
                                    style={styles.productPoint}
                                >
                                    {formatNumber(product.points)} P
                                </Text>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.productPrice}
                                >
                                    ₩{formatNumber(product.price)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Section 2: 무료 포인트 얻기 */}
                <View style={styles.section}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>
                        <Text allowFontScaling={false} style={styles.freeTitleAccent}>
                            무료 포인트
                        </Text>
                        {' 얻기'}
                    </Text>

                    <TouchableOpacity
                        testID="charge-invite-btn"
                        activeOpacity={0.7}
                        style={styles.inviteCard}
                        onPress={() => router.navigate('/invite')}
                    >
                        <View style={styles.inviteLeft}>
                            <Image
                                source={require('../../assets/icons/point.svg')}
                                style={{ width: 24, height: 24 }}
                                contentFit="contain"
                            />
                            <Text allowFontScaling={false} style={styles.invitePoint}>
                                10,000 P
                            </Text>
                        </View>
                        <View style={styles.inviteRight}>
                            <Image
                                source={require('../../assets/icons/gift.svg')}
                                style={{ width: 20, height: 20 }}
                                contentFit="contain"
                            />
                            <Text
                                allowFontScaling={false}
                                style={styles.inviteLabel}
                            >
                                친구초대
                            </Text>
                            <Image
                                source={require('../../assets/icons/chevron-right.svg')}
                                style={{ width: 24, height: 24 }}
                                contentFit="contain"
                            />
                        </View>
                    </TouchableOpacity>

                    <Text allowFontScaling={false} style={styles.inviteDesc}>
                        {'친구초대 포인트는 최대 '}
                        <Text allowFontScaling={false} style={styles.inviteDescBold}>
                            {referralMaxCount}
                        </Text>
                        {'회까지 가능합니다.'}
                    </Text>
                </View>

            </ScrollView>

            {loading && (
                <Animated.View style={styles.iapOverlay} entering={FadeIn} exiting={FadeOut} pointerEvents="auto">
                    <ActivityIndicator size="large" color={COLORS.white} />
                </Animated.View>
            )}

            {/* [C123] Android 결제수단 선택 시트 (카드 / 카카오페이) */}
            {!isIOS && (
                <BottomSheetModal
                    testID="charge-method-sheet"
                    ref={methodSheetRef}
                    snapPoints={['32%']}
                    enableOverDrag={false}
                    enableDynamicSizing={false}
                    enablePanDownToClose
                    onChange={(index) => setMethodSheetOpen(index >= 0)}
                    backdropComponent={renderBackdrop}
                >
                    <View style={styles.sheetHeader}>
                        <Text allowFontScaling={false} style={styles.sheetTitle}>
                            결제수단 선택
                        </Text>
                    </View>
                    <View style={[styles.sheetContent, { paddingBottom: SPACING.xl + insets.bottom }]}>
                        <TouchableOpacity
                            testID="charge-method-card"
                            activeOpacity={0.7}
                            disabled={loading}
                            style={styles.methodItem}
                            onPress={() => handleSelectMethod('card')}
                        >
                            <Text allowFontScaling={false} style={styles.methodItemText}>
                                카드결제
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            testID="charge-method-kakaopay"
                            activeOpacity={0.7}
                            disabled={loading}
                            style={[styles.methodItem, styles.methodItemKakao]}
                            onPress={() => handleSelectMethod('kakaopay')}
                        >
                            <Text allowFontScaling={false} style={[styles.methodItemText, styles.methodItemTextKakao]}>
                                카카오페이
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetModal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xxxl,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    freeTitleAccent: {
        color: '#251B07',
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    productCard: {
        width: '48.5%',
        borderRadius: 12,
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    productCardUnselected: {
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    productPoint: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    productPrice: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: '#969698',
    },
    inviteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    inviteLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    inviteRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    invitePoint: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: COLORS.point,
    },
    inviteLabel: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    inviteDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
    },
    inviteDescBold: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    iapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },

    /* 결제수단 선택 시트 */
    sheetHeader: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
        alignItems: 'center',
    },
    sheetTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },
    sheetContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.sm,
        gap: SPACING.sm,
    },
    methodItem: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    methodItemKakao: {
        backgroundColor: '#FEE500',
        borderColor: '#FEE500',
    },
    methodItemText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },
    methodItemTextKakao: {
        color: '#3C1E1E',
    },
});
