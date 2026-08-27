import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { matchApi } from '../../src/api/match';
import usePointStore from '../../src/store/pointStore';
import usePopupStore from '../../src/store/popupStore';
import { showToast } from '../../src/utils/toast';
import AppHeader from '../../src/components/AppHeader';

const APPLY_COST = 3000;

export default function ApplyScreen() {
    const { matchIdx } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { total, fetchBalance } = usePointStore();
    const showPopup = usePopupStore(s => s.show);

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    useFocusEffect(useCallback(() => { fetchBalance(); }, [fetchBalance]));

    const insufficient = total < APPLY_COST;

    async function handleApply() {
        if (loading) return;
        if (insufficient) {
            showPopup('confirm', {
                title: '포인트가 부족합니다.',
                message: '포인트 충전 후 신청 가능합니다.',
                cancelText: '닫기',
                confirmText: '충전',
                onConfirm: () => router.navigate('/point/charge'),
            });
            return;
        }
        setLoading(true);
        try {
            const res = await matchApi.apply(Number(matchIdx), message.trim() || undefined);
            if (res.data?.newBalance != null) {
                await fetchBalance();
            }
            showToast('success', '매칭 신청이 완료되었습니다.');
            router.back();
        } catch (e) {
            const msg = e?.response?.data?.message || '신청에 실패했습니다.';
            if (msg.includes('노쇼')) {
                showPopup('confirm', {
                    title: '노쇼로 신고된 상태입니다.',
                    titleColor: '#E02E2E',
                    message: '노쇼 신고 후 1시간 이후 신청 가능합니다.',
                    confirmText: '확인',
                });
            } else if (msg === '포인트가 부족합니다.') {
                showPopup('confirm', {
                    title: '포인트가 부족합니다.',
                    message: '포인트 충전 후 신청 가능합니다.',
                    cancelText: '닫기',
                    confirmText: '충전',
                    onConfirm: () => router.navigate('/point/charge'),
                });
            } else {
                showToast('error', msg);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="신청하기" onClose={() => router.back()} />
            
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* 신청 메시지 */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel} allowFontScaling={false}>신청 메시지를 남겨주세요.</Text>
                    <TextInput
                        testID="apply-message-input"
                        style={[styles.textarea, focused && styles.textareaFocused]}
                        placeholder="내용 입력"
                        placeholderTextColor={COLORS.disabledBtn}
                        value={message}
                        onChangeText={setMessage}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        multiline
                        textAlignVertical="top"
                        allowFontScaling={false}
                    />
                </View>

                {/* 매칭 포인트 차감 행 */}
                <View style={styles.costRow}>
                    <Text style={styles.costLabel} allowFontScaling={false}>매칭 포인트</Text>
                    <Text style={styles.costValue} allowFontScaling={false}>{APPLY_COST.toLocaleString()}P 차감</Text>
                </View>

                {/* 내 포인트 카드 */}
                <View style={styles.pointCard}>
                    <View style={styles.pointCardHeader}>
                        <Image
                            source={require('../../assets/icons/point.svg')}
                            style={styles.pointIcon}
                            contentFit="contain"
                        />
                        <Text style={styles.pointCardTitle} allowFontScaling={false}>내 포인트</Text>
                    </View>
                    <Text style={styles.pointBalance} allowFontScaling={false}>
                        {total.toLocaleString()} P
                    </Text>
                    <TouchableOpacity
                        testID="apply-charge-btn"
                        style={styles.chargeBtn}
                        onPress={() => router.navigate('/point/charge')}
                    >
                        <Text style={styles.chargeBtnText} allowFontScaling={false}>충전</Text>
                    </TouchableOpacity>
                </View>

                {/* 안내 */}
                <View style={styles.notice}>
                    <Text style={styles.noticeBullet} allowFontScaling={false}>•</Text>
                    <Text style={styles.noticeText} allowFontScaling={false}>
                        매칭 수락후에는 취소/환불은 불가합니다.
                    </Text>
                </View>
            </ScrollView>

            {/* 하단 버튼 바 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    testID="apply-cancel-btn"
                    style={styles.cancelBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelBtnText} allowFontScaling={false}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    testID="apply-submit-btn"
                    style={[styles.submitBtn, (loading || insufficient) && styles.submitBtnDisabled]}
                    onPress={handleApply}
                    disabled={loading || insufficient}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText} allowFontScaling={false}>신청하기</Text>
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
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4 + 4,
        color: COLORS.textPrimary,
    },
    closeIcon: {
        width: 24,
        height: 24,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: SPACING.xl,
        gap: SPACING.xl,
    },
    section: {
        gap: SPACING.sm,
    },
    sectionLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },
    textarea: {
        height: 200,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        padding: SPACING.md,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    textareaFocused: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 0,
    },
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    costLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    costValue: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: '#E02E2E',
    },
    pointCard: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 20,
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
        alignItems: 'center',
    },
    pointCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    pointIcon: {
        width: 24,
        height: 24,
    },
    pointCardTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xl,
        color: COLORS.textPrimary,
    },
    pointBalance: {
        fontFamily: FONTS.jalnan,
        fontSize: FONT_SIZE.xxl,
        color: COLORS.primary,
    },
    chargeBtn: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        height: 40,
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chargeBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.primary,
    },
    notice: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    noticeBullet: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textMedium,
        lineHeight: 24,
    },
    noticeText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textMedium,
        lineHeight: 24,
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
        backgroundColor: COLORS.white,
    },
    cancelBtn: {
        width: 120,
        height: 52,
        backgroundColor: '#EEEEEE',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.grayMedium,
    },
    submitBtn: {
        flex: 1,
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.disabledBtn,
    },
    submitBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
    },
});
