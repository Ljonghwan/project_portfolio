import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { matchApi } from '../../src/api/match';
import usePointStore from '../../src/store/pointStore';
import { showToast } from '../../src/utils/toast';

const ACCEPT_COST = 3000;

export default function PointUseScreen() {
    const { matchIdx, participantIdx, participantNickname, matchType } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { total, fetchBalance } = usePointStore();

    const [loading, setLoading] = useState(false);

    const insufficient = total < ACCEPT_COST;

    async function handleConfirm() {
        if (loading || insufficient) return;
        setLoading(true);
        try {
            const res = await matchApi.accept(Number(matchIdx), Number(participantIdx));
            await fetchBalance();
            showToast('success', '신청을 수락했습니다.');

            const chatRoomIdx = res?.data?.chatRoomIdx;
            setLoading(false);
            router.back();

            // 1:1매칭 채팅방 이동기능 제거
            // if (matchType === 'one_to_one' && chatRoomIdx) {
            //     // 1:1 매칭: 뒤로가기 → 400ms 지연 후 채팅방 이동
            //     router.back();
            //     setTimeout(() => {
            //         router.navigate(`/chat/${chatRoomIdx}`);
            //     }, 400);
            // } else {
            //     // 그룹 매칭: 뒤로가기만
            //     router.back();
            // }
        } catch (e) {
            const msg = e?.response?.data?.message || '수락에 실패했습니다.';
            showToast('error', msg);
            setLoading(false);
        }
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    testID="point-use-back-btn"
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false} numberOfLines={1}>
                    {participantNickname}님 수락하기
                </Text>
            </View>

            {/* 콘텐츠 */}
            <View style={styles.content}>
                {/* 포인트 사용 카드 */}
                <View style={styles.card}>
                    {/* 수락 정보 행 */}
                    <View style={styles.cardRow}>
                        <View style={styles.cardRowLeft}>
                            <Image
                                source={require('../../assets/icons/confirm.svg')}
                                style={styles.cardIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.cardLabel} allowFontScaling={false}>매칭 수락하기</Text>
                        </View>
                        <Text style={styles.costText} allowFontScaling={false}>{ACCEPT_COST.toLocaleString()}P</Text>
                    </View>

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
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceText} allowFontScaling={false}>{total.toLocaleString()}</Text>
                            <Text style={styles.balanceUnit} allowFontScaling={false}>P</Text>
                        </View>
                    </View>

                    {/* 구분선 */}
                    <View style={styles.divider} />

                    {/* 충전 버튼 */}
                    <TouchableOpacity
                        testID="point-use-charge-btn"
                        onPress={() => router.navigate('/point/charge')}
                        style={styles.chargeBtn}
                    >
                        <Text style={styles.chargeBtnText} allowFontScaling={false}>충전하기</Text>
                    </TouchableOpacity>
                </View>

                {/* 안내 문구 */}
                <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletDot}>·</Text>
                        <Text style={styles.bulletText} allowFontScaling={false}>매칭을 위해서는 포인트가 필요합니다.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletDot} allowFontScaling={false}>·</Text>
                        <Text style={styles.bulletText} allowFontScaling={false}>포인트 사용 후 취소/환불은 불가합니다.</Text>
                    </View>
                </View>

                {/* 포인트 부족 배너 */}
                {insufficient && (
                    <View style={styles.insufficientBanner}>
                        <Text style={styles.insufficientText} allowFontScaling={false}>보유 포인트가 부족합니다.</Text>
                    </View>
                )}
            </View>

            {/* 하단 버튼 바 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    testID="point-use-cancel-btn"
                    onPress={() => router.back()}
                    style={styles.cancelBtn}
                >
                    <Text style={styles.cancelBtnText} allowFontScaling={false}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    testID="point-use-confirm-btn"
                    onPress={handleConfirm}
                    disabled={loading || insufficient}
                    style={[styles.confirmBtn, insufficient && styles.confirmBtnDisabled]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.confirmBtnText} allowFontScaling={false}>사용하기</Text>
                    )}
                </TouchableOpacity>
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
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
        marginRight: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxl,
    },
    card: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 20,
        padding: SPACING.xxl,
        gap: SPACING.lg,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cardIcon: {
        width: 24,
        height: 24,
    },
    cardLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    costText: {
        fontFamily: FONTS.jalnan,
        fontSize: FONT_SIZE.xxl,
        color: COLORS.point,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    balanceText: {
        fontFamily: FONTS.jalnan,
        fontSize: FONT_SIZE.h4,
        color: COLORS.primary,
    },
    balanceUnit: {
        fontFamily: FONTS.jalnan,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.primaryLight,
    },
    chargeBtn: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        height: 40,
        paddingHorizontal: SPACING.lg,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    chargeBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
    },
    bulletList: {
        marginTop: SPACING.xxl,
        gap: SPACING.sm,
    },
    bulletItem: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    bulletDot: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textMedium,
        lineHeight: 22,
    },
    bulletText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textMedium,
        lineHeight: 22,
        flex: 1,
    },
    insufficientBanner: {
        marginTop: SPACING.lg,
        backgroundColor: '#FFE8E8',
        borderRadius: 8,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
    },
    insufficientText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        color: '#E02E2E',
    },
    bottomBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    cancelBtn: {
        width: 120,
        height: 52,
        backgroundColor: '#EEEEEE',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.grayMedium,
    },
    confirmBtn: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnDisabled: {
        backgroundColor: COLORS.disabledBtn,
    },
    confirmBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
    },
});
