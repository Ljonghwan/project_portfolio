import { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Platform, Pressable, Keyboard,
} from 'react-native';
import useBottomSheetBackHandler from '../../src/hooks/useBottomSheetBackHandler';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetScrollView,
    BottomSheetView
} from '@gorhom/bottom-sheet';
import AppHeader from '../../src/components/AppHeader';
import useConfigStore from '../../src/store/configStore';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

const formatNumber = (num) => Number(num).toLocaleString();

export default function WithdrawRefundScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { paidBalance: paidBalanceParam } = useLocalSearchParams();
    const paidBalance = Number(paidBalanceParam) || 0;

    const { bankList, refundFeeRate, refundMinAmount } = useConfigStore();

    // Android: 'refund' | 'none', iOS: 'apple'
    const isIOS = Platform.OS === 'ios';
    const isRefundable = paidBalance >= refundMinAmount;
    const [refundOption, setRefundOption] = useState(isIOS ? 'apple' : (isRefundable ? 'refund' : 'none'));

    // 계좌 정보 (Android 환불신청용)
    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    // 체크박스 상태
    const [agreedNoRefund, setAgreedNoRefund] = useState(false); // Android 환불없이 탈퇴
    const [agreedPolicy, setAgreedPolicy] = useState(false); // 바텀시트 환불정책 동의
    const [agreedApple, setAgreedApple] = useState(false); // iOS 동의

    // 바텀시트 refs
    const bankSheetRef = useRef(null);
    const policySheetRef = useRef(null);
    const [bankSheetOpen, setBankSheetOpen] = useState(false);
    const [policySheetOpen, setPolicySheetOpen] = useState(false);
    useBottomSheetBackHandler(bankSheetRef, bankSheetOpen);
    useBottomSheetBackHandler(policySheetRef, policySheetOpen);

    // 유효성 검증
    const isRefundFormValid =
        refundOption === 'refund' &&
        bankName.length > 0 &&
        accountHolder.trim().length > 0 &&
        accountNumber.trim().length > 0;

    const canProceed = (() => {
        if (isIOS) return agreedApple;
        if (refundOption === 'refund') return isRefundFormValid;
        if (refundOption === 'none') return agreedNoRefund;
        return false;
    })();

    // 다음 단계로 이동
    const handleNext = useCallback(() => {
        if (!canProceed) return;
        Keyboard.dismiss();

        if (isIOS) {
            // iOS: 바로 탈퇴 사유 화면으로
            router.navigate({
                pathname: '/settings/withdraw-reason',
                params: { refundOption: 'apple' },
            });
            return;
        }

        if (refundOption === 'none') {
            // 환불없이 탈퇴 → 탈퇴 사유 화면
            router.navigate({
                pathname: '/settings/withdraw-reason',
                params: { refundOption: 'none' },
            });
            return;
        }

        // 환불신청 → 환불정책 바텀시트 열기
        policySheetRef.current?.present();
    }, [canProceed, isIOS, refundOption, router]);

    // 환불정책 동의 후 탈퇴 사유 화면으로
    const handlePolicyConfirm = useCallback(() => {
        if (!agreedPolicy) return;
        policySheetRef.current?.dismiss();
        router.navigate({
            pathname: '/settings/withdraw-reason',
            params: {
                refundOption: 'refund',
                bankName,
                accountHolder: accountHolder.trim(),
                accountNumber: accountNumber.trim(),
            },
        });
    }, [agreedPolicy, bankName, accountHolder, accountNumber, router]);

    const handleSelectBank = useCallback((name) => {
        setBankName(name);
        bankSheetRef.current?.dismiss();
    }, []);

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

    // --- Android 렌더 ---
    const renderAndroid = useCallback(() => (
        <>
            <Text style={styles.infoText} allowFontScaling={false}>
                회원 탈퇴 시 보유하신 유료 포인트는 소멸됩니다.{'\n'}
                환불을 원하시면 아래에서 환불 신청을 해주세요.
            </Text>

            {/* 잔액 박스 */}
            <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel} allowFontScaling={false}>
                    보유 유료 포인트
                </Text>
                <Text style={styles.balanceAmount} allowFontScaling={false}>
                    {formatNumber(paidBalance)}P
                </Text>
            </View>

            {/* 라디오 선택 */}
            <View style={styles.radioGroup}>
                <Pressable
                    testID="withdraw-refund-radio-refund"
                    style={[styles.radioRow, !isRefundable && styles.radioRowDisabled]}
                    onPress={() => {
                        if (!isRefundable) return;
                        setRefundOption('refund');
                        setAgreedNoRefund(false);
                    }}
                    disabled={!isRefundable}
                >
                    <Image
                        source={
                            refundOption === 'refund'
                                ? require('../../assets/icons/radio-on.svg')
                                : require('../../assets/icons/radio-off.svg')
                        }
                        style={[styles.radioIcon, !isRefundable && styles.radioIconDisabled]}
                        contentFit="contain"
                    />
                    <Text style={[styles.radioText, !isRefundable && styles.radioTextDisabled]} allowFontScaling={false}>
                        환불 신청
                    </Text>
                    {!isRefundable && (
                        <Text style={styles.radioSubText} allowFontScaling={false}>
                            ({formatNumber(refundMinAmount)}P 미만)
                        </Text>
                    )}
                </Pressable>

                <Pressable
                    testID="withdraw-refund-radio-none"
                    style={styles.radioRow}
                    onPress={() => {
                        setRefundOption('none');
                        setAgreedNoRefund(false);
                    }}
                >
                    <Image
                        source={
                            refundOption === 'none'
                                ? require('../../assets/icons/radio-on.svg')
                                : require('../../assets/icons/radio-off.svg')
                        }
                        style={styles.radioIcon}
                        contentFit="contain"
                    />
                    <Text style={styles.radioText} allowFontScaling={false}>
                        환불 없이 탈퇴
                    </Text>
                </Pressable>
            </View>

            {/* 환불 신청 폼 */}
            {refundOption === 'refund' && (
                <View style={styles.formSection}>
                    {/* 안내 문구 */}
                    <View style={styles.checkInfoRow}>
                        <View style={styles.checkCircle}>
                            <Image
                                source={require('../../assets/icons/checkbox-check2.svg')}
                                style={styles.checkIcon}
                            />
                        </View>
                        <Text style={styles.checkInfoText} allowFontScaling={false}>
                            잔여 포인트 {formatNumber(refundMinAmount)}P 이상일 경우 환불
                            가능하며 환불 수수료 {Math.round(refundFeeRate * 100)}%를 차감하고
                            지급됩니다.
                        </Text>
                    </View>

                    {/* 계좌 입력 */}
                    <View style={styles.labelRow}>
                        <Text style={styles.label} allowFontScaling={false}>
                            환급 받으실 계좌번호
                        </Text>
                        <Text style={styles.labelRequired} allowFontScaling={false}>
                            *
                        </Text>
                    </View>

                    <TouchableOpacity
                        testID="withdraw-refund-bank-select"
                        activeOpacity={0.7}
                        style={styles.selectBox}
                        onPress={() => bankSheetRef.current?.present()}
                    >
                        <Text
                            allowFontScaling={false}
                            style={[styles.selectText, !bankName && styles.selectPlaceholder]}
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

                    <TextInput
                        testID="withdraw-refund-holder-input"
                        style={styles.input}
                        placeholder="예금주"
                        placeholderTextColor="#C5C5CD"
                        value={accountHolder}
                        onChangeText={setAccountHolder}
                        allowFontScaling={false}
                        autoCorrect={false}
                    />

                    <TextInput
                        testID="withdraw-refund-account-input"
                        style={styles.input}
                        placeholder="계좌번호"
                        placeholderTextColor="#C5C5CD"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        keyboardType="numeric"
                        allowFontScaling={false}
                        autoCorrect={false}
                    />

                    {/* 안내 */}
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletText} allowFontScaling={false}>
                            • 환불시 예금주와 가입 계정의 성함이 같아야 합니다.
                        </Text>
                        <Text style={styles.bulletText} allowFontScaling={false}>
                            • 환불은 영업일 기준 3일이내 지급됩니다.
                        </Text>
                    </View>
                </View>
            )}

            {/* 환불 없이 탈퇴 동의 */}
            {refundOption === 'none' && (
                <Pressable
                    testID="withdraw-refund-agree-no-refund"
                    style={styles.agreeRow}
                    onPress={() => setAgreedNoRefund((v) => !v)}
                >
                    <Image
                        source={
                            agreedNoRefund
                                ? require('../../assets/icons/checkbox-check2.svg')
                                : require('../../assets/icons/uncheck.svg')
                        }
                        style={styles.checkboxIcon}
                    />
                    <Text style={styles.agreeText} allowFontScaling={false}>
                        환불 받지 않고 탈퇴하겠습니다. 보유 유료 포인트가 모두 소멸되는 것에 동의합니다.
                    </Text>
                </Pressable>
            )}
        </>
    ), [paidBalance, refundOption, isRefundable, refundMinAmount, agreedNoRefund, bankName, accountHolder, accountNumber, agreedPolicy, isRefundFormValid, bankList, refundFeeRate]);

    // --- iOS 렌더 ---
    const renderIOS = useCallback(() => (
        <>
            <Text style={styles.infoText} allowFontScaling={false}>
                회원 탈퇴 시 보유하신 유료 포인트는 소멸됩니다.{'\n'}
                유료 포인트 환불은 Apple 앱 구매내역에서 직접 환불 신청해 주세요.
            </Text>

            {/* 잔액 박스 */}
            <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel} allowFontScaling={false}>
                    보유 유료 포인트
                </Text>
                <Text style={styles.balanceAmount} allowFontScaling={false}>
                    {formatNumber(paidBalance)}P
                </Text>
            </View>

            {/* 동의 체크 */}
            <Pressable
                testID="withdraw-refund-agree-apple"
                style={styles.agreeRow}
                onPress={() => setAgreedApple((v) => !v)}
            >
                <Image
                    source={
                        agreedApple
                            ? require('../../assets/icons/checkbox-check2.svg')
                            : require('../../assets/icons/uncheck.svg')
                    }
                    style={styles.checkboxIcon}
                />
                <Text style={styles.agreeText} allowFontScaling={false}>
                    위 내용을 모두 확인하였으며, 유료 포인트가 소멸되는 것에 동의합니다.
                </Text>
            </Pressable>
        </>
    ), [paidBalance, agreedApple]);

    // --- 하단 버튼 ---
    const renderBottomBar = useCallback(() => {
        const isRefund = !isIOS && refundOption === 'refund';
        const btnLabel = isRefund ? '환불정책 확인' : '탈퇴하기';
        const btnColor = isRefund ? COLORS.primary : '#E02E2E';

        return (
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <TouchableOpacity
                    testID="withdraw-refund-cancel-btn"
                    activeOpacity={0.7}
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText} allowFontScaling={false}>
                        취소
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    testID="withdraw-refund-next-btn"
                    activeOpacity={0.7}
                    disabled={!canProceed}
                    style={[
                        styles.nextButton,
                        { backgroundColor: btnColor },
                        !canProceed && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                >
                    <Text
                        allowFontScaling={false}
                        style={[
                            styles.nextButtonText,
                            !canProceed && styles.nextButtonTextDisabled,
                        ]}
                    >
                        {btnLabel}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }, [isIOS, refundOption, canProceed, handleNext, insets.bottom, router]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="회원 탈퇴" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bottomOffset={80}
            >
                {isIOS ? renderIOS() : renderAndroid()}
                <View style={{ height: 100 }} />
            </KeyboardAwareScrollView>

            {renderBottomBar()}

            {/* 은행 선택 바텀시트 */}
            <BottomSheetModal
                ref={bankSheetRef}
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
                            testID={`withdraw-refund-bank-${bank}`}
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

            {/* 환불정책 확인 바텀시트 */}
            <BottomSheetModal
                ref={policySheetRef}
                enableOverDrag={false}
                enableDynamicSizing={true}
                enablePanDownToClose
                onChange={(index) => setPolicySheetOpen(index >= 0)}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={{ display: 'none' }}
            >
                <BottomSheetView>
                    <View style={styles.policyHeader}>
                        <Text allowFontScaling={false} style={styles.policyTitle}>
                            환불정책
                        </Text>
                        <TouchableOpacity
                            testID="withdraw-refund-policy-close"
                            onPress={() => policySheetRef.current?.dismiss()}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Image
                                source={require('../../assets/icons/close.svg')}
                                style={styles.policyCloseIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.policyBody}>
                        <Text style={styles.policyText} allowFontScaling={false}>
                            • 환불 수수료 {Math.round(refundFeeRate * 100)}%가 차감된 후
                            지급됩니다.{'\n'}
                            • 환불은 영업일 기준 3일 이내 입금됩니다.{'\n'}
                            • 환불 신청 후 탈퇴하시면 환불이 완료될 때까지{'\n'}
                            {'  '}개인정보가 보관됩니다.{'\n'}
                            • 무료 포인트는 환불 대상이 아닙니다.
                        </Text>

                        <Pressable
                            testID="withdraw-refund-agree-policy"
                            style={styles.agreeRow}
                            onPress={() => setAgreedPolicy((v) => !v)}
                        >
                            <Image
                                source={
                                    agreedPolicy
                                        ? require('../../assets/icons/checkbox-check2.svg')
                                        : require('../../assets/icons/uncheck.svg')
                                }
                                style={styles.checkboxIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.agreeText} allowFontScaling={false}>
                                위 내용을 모두 확인하였으며, 환불정책에 동의합니다.
                            </Text>
                        </Pressable>
                    </View>

                    <View style={[styles.policyBottom, { paddingBottom: SPACING.xl + insets.bottom }]}>
                        <TouchableOpacity
                            testID="withdraw-refund-policy-confirm"
                            activeOpacity={0.7}
                            disabled={!agreedPolicy}
                            style={[
                                styles.policyButton,
                                !agreedPolicy && styles.policyButtonDisabled,
                            ]}
                            onPress={handlePolicyConfirm}
                        >
                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.policyButtonText,
                                    !agreedPolicy && styles.policyButtonTextDisabled,
                                ]}
                            >
                                탈퇴하기
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },

    /* Info */
    infoText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
        marginBottom: SPACING.xl,
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

    /* Radio */
    radioGroup: {
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    radioIcon: {
        width: 24,
        height: 24,
    },
    radioText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    radioRowDisabled: {
        opacity: 0.4,
    },
    radioIconDisabled: {
        opacity: 0.5,
    },
    radioTextDisabled: {
        color: COLORS.grayMedium,
    },
    radioSubText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.grayMedium,
    },

    /* Form Section */
    formSection: {
        gap: 0,
    },

    /* Check Info */
    checkInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    
    checkIcon: {
        width: 24,
        height: 24,
    },
    checkInfoText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 20,
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
    chevron: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: '#C5C5CD',
        paddingHorizontal: SPACING.sm,
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

    /* Agree Row */
    agreeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    checkboxIcon: {
        width: 24,
        height: 24,
        flexShrink: 0,
    },
    agreeText: {
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
    nextButton: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: '#EEEEEE',
    },
    nextButtonText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    nextButtonTextDisabled: {
        color: '#969698',
    },

    /* Bank BottomSheet */
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

    /* Policy BottomSheet */
    policyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        paddingTop: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    policyTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    policyCloseIcon: {
        width: 24,
        height: 24,
    },
    policyBody: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        flex: 1,
    },
    policyText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
        lineHeight: 22,
    },
    policyBottom: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
    },
    policyButton: {
        height: 52,
        borderRadius: 8,
        backgroundColor: '#E02E2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    policyButtonDisabled: {
        backgroundColor: '#EEEEEE',
    },
    policyButtonText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    policyButtonTextDisabled: {
        color: '#969698',
    },
});
