import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePointStore from '../../src/store/pointStore';
import { authApi } from '../../src/api/auth';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import AppHeader from '../../src/components/AppHeader';

const VIEW_COST = 1000;

export default function ProfilePaymentScreen() {
    const { userIdx } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const myTotal = usePointStore((s) => s.total);
    const fetchBalance = usePointStore((s) => s.fetchBalance);
    const [purchasing, setPurchasing] = useState(false);
    const insufficient = myTotal < VIEW_COST;

    useEffect(() => {
        fetchBalance();
    }, []);

    async function handlePurchase() {
        if (purchasing || insufficient) return;
        setPurchasing(true);
        try {
            await authApi.viewProfile(Number(userIdx));
            await fetchBalance();
            showToast('success', '상세프로필을 열람합니다.');
            router.back();
        } catch (e) {
            const msg = e?.response?.data?.message || '열람에 실패했습니다.';
            showToast('error', msg);
        } finally {
            setPurchasing(false);
        }
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="포인트 결제" />

            <View style={styles.body}>
                {/* 보라 배경 카드 */}
                <View style={styles.card}>
                    {/* 사용 포인트 행 */}
                    <View style={styles.cardRow}>
                        <View style={styles.cardRowLeft}>
                            <Image
                                source={require('../../assets/icons/image-add.svg')}
                                style={styles.cardIcon}
                                contentFit="contain"
                                tintColor="#686869"
                            />
                            <Text style={styles.cardLabel} allowFontScaling={false}>사진첩/매칭리뷰 보기</Text>
                        </View>
                        <Text style={styles.costValue} allowFontScaling={false}>
                            {VIEW_COST.toLocaleString()}
                            <Text style={styles.costUnit}>P</Text>
                        </Text>
                    </View>

                    {/* 구분선 */}
                    <View style={styles.cardDivider} />

                    {/* 내 포인트 행 */}
                    <View style={styles.cardRow}>
                        <View style={styles.cardRowLeft}>
                            <Image
                                source={require('../../assets/icons/point.svg')}
                                style={styles.cardIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.cardLabel} allowFontScaling={false}>내 포인트</Text>
                        </View>
                        <View style={styles.myPointRight}>
                            <Text style={styles.myPointValue} allowFontScaling={false}>
                                {myTotal.toLocaleString()}
                                <Text style={styles.myPointUnit}>P</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.chargeBtn}
                                onPress={() => router.navigate('/point/charge')}
                                testID="payment-charge-btn"
                            >
                                <Text style={styles.chargeBtnText} allowFontScaling={false}>충전</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 안내 bullet 리스트 */}
                <View style={styles.bulletList}>
                    <Text style={styles.bulletText} allowFontScaling={false}>
                        {'•  결제 시 24시간 동안 해당 회원의 사진첩/매칭리뷰를 볼 수 있습니다.'}
                    </Text>
                    <Text style={styles.bulletText} allowFontScaling={false}>
                        {'•  포인트 사용 후 취소/환불은 불가합니다.'}
                    </Text>
                    <Text style={styles.bulletText} allowFontScaling={false}>
                        {'•  타인이 프로필을 무단 캡처/유출할 경우 사용정지 및 법적 제재를 받을 수 있습니다.'}
                    </Text>
                </View>

                {/* 포인트 부족 배너 */}
                {insufficient && (
                    <View style={styles.insufficientBanner}>
                        <Text style={styles.insufficientText} allowFontScaling={false}>
                            보유 포인트가 부족합니다.
                        </Text>
                    </View>
                )}
            </View>

            {/* 하단 고정 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => router.back()}
                    testID="payment-cancel-btn"
                >
                    <Text style={styles.cancelBtnText} allowFontScaling={false}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitBtn, insufficient && styles.submitBtnDisabled]}
                    onPress={handlePurchase}
                    disabled={purchasing || insufficient}
                    testID="payment-submit-btn"
                >
                    {purchasing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText} allowFontScaling={false}>사용하기</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    body: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
    },
    card: {
        backgroundColor: '#EDEFFF',
        borderRadius: 20,
        padding: 24,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardIcon: {
        width: 20,
        height: 20,
    },
    cardLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    costValue: {
        fontFamily: FONTS.jalnanGothic,
        fontSize: 24,
        color: '#E02E2E',
    },
    costUnit: {
        fontSize: 16,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#B8C1FF',
        marginVertical: 16,
    },
    myPointRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    myPointValue: {
        fontFamily: FONTS.jalnanGothic,
        fontSize: 16,
        color: '#384FEE',
    },
    myPointUnit: {
        fontSize: 13,
    },
    chargeBtn: {
        borderWidth: 1,
        borderColor: '#384FEE',
        borderRadius: 8,
        width: 100,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chargeBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: '#384FEE',
    },
    bulletList: {
        marginTop: 24,
        gap: 8,
    },
    bulletText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: '#686869',
        lineHeight: 18,
    },
    insufficientBanner: {
        marginTop: 16,
        backgroundColor: '#FFE8E8',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    insufficientText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: '#E02E2E',
    },
    bottomBar: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    cancelBtn: {
        width: 120,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: '#969698',
    },
    submitBtn: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#384FEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.white,
    },
});
