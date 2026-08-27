import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import usePopupStore from '../../src/store/popupStore';
import AppHeader from '../../src/components/AppHeader';
import { matchApi } from '../../src/api/match';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

const REASONS = [
    '기록 삭제 목적',
    '재가입 목적',
    '서비스 기능 불편',
    '수수료가 비싸서',
    '다른 서비스 이용',
    '사용빈도가 낮아서',
    '컨텐츠 불편',
    '기타',
];

export default function WithdrawReasonScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const withdraw = useAuthStore((s) => s.withdraw);
    const showPopup = usePopupStore((s) => s.show);
    const [selected, setSelected] = useState(null);
    const [etcText, setEtcText] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const isEtc = selected === REASONS.length - 1;
    const canSubmit = selected !== null && (!isEtc || etcText.trim().length > 0);

    const handleWithdraw = useCallback(async () => {
        if (!canSubmit || withdrawing) return;
        Keyboard.dismiss();

        // 진행중 매칭 가드
        try {
            const res = await matchApi.getActiveCount();
            const activeCount = res.data?.count ?? 0;
            if (activeCount > 0) {
                showPopup('confirm', {
                    title: '현재 진행중인 매칭이 있습니다.\n매칭 취소 후 탈퇴 가능합니다.',
                    confirmText: '확인',
                });
                return;
            }
        } catch (e) {
            // 조회 실패 시 진행 (서버 장애로 탈퇴 자체를 막지 않음)
        }

        const reasonText = isEtc ? etcText.trim() : REASONS[selected];

        // withdraw-refund에서 전달받은 환불 데이터
        const refundData = {};
        if (params.refundOption) {
            refundData.refundOption = params.refundOption;
            if (params.refundOption === 'refund') {
                refundData.bankName = params.bankName;
                refundData.accountHolder = params.accountHolder;
                refundData.accountNumber = params.accountNumber;
            }
        }

        showPopup('withdrawConfirm', {
            onConfirm: () => {
                setWithdrawing(true);
                withdraw(reasonText, refundData).then(() => {
                    if (router.canDismiss()) router.dismissAll();
                    router.replace('/');
                }).catch(() => {
                    setWithdrawing(false);
                    showPopup('confirm', {
                        title: '탈퇴 실패',
                        message: '회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                        confirmText: '확인',
                    });
                });
            },
        });
    }, [canSubmit, withdrawing, isEtc, etcText, selected, withdraw, showPopup, router, params]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="회원 탈퇴" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 52 + SPACING.xl + insets.bottom + SPACING.xl },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bottomOffset={80}
            >
                <Text style={styles.title} allowFontScaling={false}>
                    탈퇴 사유를 알려주세요
                </Text>

                <View style={styles.reasonList}>
                    {REASONS.map((reason, idx) => (
                        <Pressable
                            testID={`withdraw-reason-item-${idx}`}
                            key={idx}
                            style={styles.reasonRow}
                            onPress={() => setSelected(idx)}
                        >
                            <Image
                                source={
                                    selected === idx
                                        ? require('../../assets/icons/radio-on.svg')
                                        : require('../../assets/icons/radio-off.svg')
                                }
                                style={styles.radioIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.reasonText} allowFontScaling={false}>
                                {reason}
                            </Text>
                        </Pressable>
                    ))}

                    {/* 기타 텍스트 입력 */}
                    <TextInput
                        testID="withdraw-reason-etc-input"
                        style={styles.etcInput}
                        placeholder="탈퇴사유를 입력해 주세요."
                        placeholderTextColor={COLORS.disabledBtn}
                        value={etcText}
                        onChangeText={setEtcText}
                        multiline
                        textAlignVertical="top"
                        allowFontScaling={false}
                        editable={isEtc}
                    />
                </View>
            </KeyboardAwareScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable testID="withdraw-reason-cancel-btn" style={styles.cancelBtn} onPress={() => router.back()}>
                    <Text style={styles.cancelBtnText} allowFontScaling={false}>취소</Text>
                </Pressable>
                <Pressable
                    testID="withdraw-reason-submit-btn"
                    style={[styles.withdrawBtn, !canSubmit && styles.withdrawBtnDisabled]}
                    onPress={handleWithdraw}
                    disabled={!canSubmit || withdrawing}
                >
                    {withdrawing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.withdrawBtnText} allowFontScaling={false}>탈퇴하기</Text>
                    )}
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xxxl,
        gap: SPACING.xl,
    },
    title: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    reasonList: {
        gap: SPACING.xl,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    radioIcon: {
        width: 24,
        height: 24,
    },
    reasonText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    etcInput: {
        height: 120,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: SPACING.md,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
        ...Platform.select({
            android: { paddingHorizontal: SPACING.md },
        }),
    },
    bottomBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4 },
        }),
    },
    cancelBtn: {
        width: 120,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    withdrawBtn: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.textMedium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawBtnDisabled: {
        opacity: 0.5,
    },
    withdrawBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
});
