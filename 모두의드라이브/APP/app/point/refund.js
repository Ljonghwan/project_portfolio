import { useState, useEffect, useRef, useCallback } from 'react';
import { Image } from 'expo-image';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import useBottomSheetBackHandler from '../../src/hooks/useBottomSheetBackHandler';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import AppHeader from '../../src/components/AppHeader';
import { showToast } from '../../src/utils/toast';
import { requestRefund } from '../../src/api/point';
import useConfigStore from '../../src/store/configStore';
import usePointStore from '../../src/store/pointStore';

export default function PointRefund() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { bankList, refundFeeRate, refundMinAmount } = useConfigStore();
    const { paid: paidBalance, loaded: balanceLoaded, refreshBalance } = usePointStore();

    const bottomSheetRef = useRef(null);
    const [bankSheetOpen, setBankSheetOpen] = useState(false);
    useBottomSheetBackHandler(bottomSheetRef, bankSheetOpen);

    const loading = !balanceLoaded;
    const [saving, setSaving] = useState(false);

    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [agreed, setAgreed] = useState(false);

    const isInsufficient = paidBalance <= refundMinAmount;
    const isFormValid =
        !isInsufficient &&
        bankName.length > 0 &&
        accountHolder.trim().length > 0 &&
        accountNumber.trim().length > 0 &&
        agreed;

    const handleOpenBankSheet = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const handleSelectBank = useCallback((name) => {
        setBankName(name);
        bottomSheetRef.current?.dismiss();
    }, []);

    const handleSubmit = async () => {
        if (!isFormValid || saving) return;

        setSaving(true);
        try {
            await requestRefund({
                bankName,
                accountNumber: accountNumber.trim(),
                accountHolder: accountHolder.trim(),
            });
            showToast('success', '환불 신청이 완료되었습니다.');
            refreshBalance();
            router.back();
        } catch (err) {
            showToast('error', err?.response?.data?.message || '환불 신청에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const formatNumber = (num) => Number(num).toLocaleString();

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

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <AppHeader title="환불하기" onBack={() => router.back()} />
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="환불하기" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* Balance Box */}
                <View style={styles.balanceBox}>
                    <Text allowFontScaling={false} style={styles.balanceLabel}>
                        환불가능한 유료 포인트
                    </Text>
                    <Text allowFontScaling={false} style={styles.balanceAmount}>
                        {formatNumber(paidBalance)}P
                    </Text>
                    {isInsufficient && (
                        <Text allowFontScaling={false} style={styles.insufficientText}>
                            환불 가능한 잔여 포인트가 부족합니다.
                        </Text>
                    )}
                </View>

                {/* Account Label */}
                <View style={styles.labelRow}>
                    <Text allowFontScaling={false} style={styles.label}>
                        환급 받으실 계좌번호
                    </Text>
                    <Text allowFontScaling={false} style={styles.labelRequired}>
                        *
                    </Text>
                </View>

                {/* Bank Selector */}
                <TouchableOpacity
                    testID="refund-bank-select"
                    activeOpacity={0.7}
                    style={styles.selectBox}
                    onPress={handleOpenBankSheet}
                >
                    <Text
                        allowFontScaling={false}
                        style={[
                            styles.selectText,
                            !bankName && styles.selectPlaceholder,
                        ]}
                    >
                        {bankName || '은행선택'}
                    </Text>
                    <Image
                        source={require('../../assets/icons/chevron-down.svg')}
                        style={{ width: 20, height: 20 }}
                        contentFit="contain"
                        tintColor="#C5C5CD"
                    />
                </TouchableOpacity>

                {/* Account Holder */}
                <TextInput
                    testID="refund-holder-input"
                    style={styles.input}
                    placeholder="예금주"
                    placeholderTextColor="#C5C5CD"
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    allowFontScaling={false}
                    autoCorrect={false}
                />

                {/* Account Number */}
                <TextInput
                    testID="refund-account-input"
                    style={styles.input}
                    placeholder="계좌번호"
                    placeholderTextColor="#C5C5CD"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    allowFontScaling={false}
                    autoCorrect={false}
                />

                {/* Bullet List */}
                <View style={styles.bulletList}>
                    <Text allowFontScaling={false} style={styles.bulletText}>
                        • 환불시 예금주와 가입 계정의 성함이 같아야 합니다.
                    </Text>
                    <Text allowFontScaling={false} style={styles.bulletText}>
                        • 환불은 영업일 기준 3일이내 지급됩니다.
                    </Text>
                </View>

                {/* Info Row (동의 체크박스) */}
                <TouchableOpacity
                    testID="refund-agree-btn"
                    activeOpacity={0.7}
                    style={styles.infoRow}
                    onPress={() => setAgreed((v) => !v)}
                >
                    <Image
                        source={
                            agreed
                                ? require('../../assets/icons/check.svg')
                                : require('../../assets/icons/uncheck.svg')
                        }
                        style={{ width: 24, height: 24, flexShrink: 0 }}
                        contentFit="contain"
                    />
                    <Text allowFontScaling={false} style={styles.infoText}>
                        잔여 포인트 {formatNumber(refundMinAmount)}P 초과 시 환불 가능합니다.
                        (단, 잔여 포인트의 {Math.round(refundFeeRate * 100)}%를 수수료로 공제 후 환급)
                    </Text>
                </TouchableOpacity>

                {/* Bottom spacer */}
                <View style={{ height: 100 }} />
            </KeyboardAwareScrollView>

            {/* Bottom Fixed Bar */}
            <View
                style={[
                    styles.bottomBar,
                    { paddingBottom: SPACING.xl + insets.bottom },
                ]}
            >
                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        testID="refund-cancel-btn"
                        activeOpacity={0.7}
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                    >
                        <Text allowFontScaling={false} style={styles.cancelButtonText}>
                            취소
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        testID="refund-submit-btn"
                        activeOpacity={0.7}
                        disabled={!isFormValid || saving}
                        style={[
                            styles.submitButton,
                            (!isFormValid || saving) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.submitButtonText,
                                    !isFormValid && styles.submitButtonTextDisabled,
                                ]}
                            >
                                환불 신청
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bank Selection BottomSheet */}
            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={['50%']}
                enableOverDrag={false}
                enableDynamicSizing={false}
                enablePanDownToClose
                onChange={(index) => setBankSheetOpen(index >= 0)}
                backdropComponent={renderBackdrop}
            >
                <View style={styles.sheetHeader}>
                    <Text allowFontScaling={false} style={styles.sheetTitle}>
                        은행 선택
                    </Text>
                </View>
                <BottomSheetScrollView
                    contentContainerStyle={styles.sheetContent}
                    showsVerticalScrollIndicator={false}
                >
                    {bankList.map((bank) => (
                        <TouchableOpacity
                            testID={`refund-bank-${bank}`}
                            key={bank}
                            activeOpacity={0.7}
                            style={[
                                styles.bankItem,
                                bankName === bank && styles.bankItemSelected,
                            ]}
                            onPress={() => handleSelectBank(bank)}
                        >
                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.bankItemText,
                                    bankName === bank && styles.bankItemTextSelected,
                                ]}
                            >
                                {bank}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: insets.bottom + SPACING.xl }} />
                </BottomSheetScrollView>
            </BottomSheetModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },

    /* Balance Box */
    balanceBox: {
        backgroundColor: '#F1F1F1',
        borderRadius: 12,
        paddingVertical: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    balanceLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    balanceAmount: {
        fontSize: FONT_SIZE.xxl,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },
    insufficientText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#E02E2E',
        marginTop: SPACING.sm,
    },

    /* Label */
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    labelRequired: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: '#E02E2E',
        marginLeft: 2,
    },

    /* Bank Selector */
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        paddingLeft: SPACING.md,
        paddingRight: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    selectText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    selectPlaceholder: {
        color: '#C5C5CD',
    },

    /* Inputs */
    input: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },

    /* Bullet List */
    bulletList: {
        marginTop: SPACING.lg,
        gap: SPACING.xs,
    },
    bulletText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },

    /* Info Row */
    infoRow: {
        flexDirection: 'row',
        marginTop: SPACING.lg,
        gap: SPACING.sm,
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },

    /* Bottom Bar */
    bottomBar: {
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    bottomButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    cancelButton: {
        width: 120,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: '#969698',
    },
    submitButton: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#EEEEEE',
    },
    submitButtonText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    submitButtonTextDisabled: {
        color: '#969698',
    },

    /* BottomSheet */
    sheetHeader: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    sheetTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    sheetContent: {
        paddingHorizontal: SPACING.xl,
    },
    bankItem: {
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },
    bankItemSelected: {
        backgroundColor: COLORS.lightGray,
    },
    bankItemText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
    bankItemTextSelected: {
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
});
