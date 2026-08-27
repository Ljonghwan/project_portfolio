import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import usePopupStore from '../../src/store/popupStore';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

export default function ChangePhoneScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const showPopup = usePopupStore((s) => s.show);

    const [phone, setPhone] = useState('');
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    const [smsCodeFocused, setSmsCodeFocused] = useState(false);
    const [smsSent, setSmsSent] = useState(false);
    const [smsVerified, setSmsVerified] = useState(false);
    const [smsLoading, setSmsLoading] = useState(false);
    const [smsError, setSmsError] = useState('');

    const currentPhone = user?.phone
        ? user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
        : '';

    const formatPhone = useCallback((text) => {
        const nums = text.replace(/[^0-9]/g, '').slice(0, 11);
        if (nums.length <= 3) return nums;
        if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
        return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
    }, []);

    const handleSendSms = useCallback(async () => {
        const cleanPhone = phone.replace(/-/g, '');
        if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
            setSmsError('올바른 전화번호를 입력해주세요.');
            return;
        }
        if (cleanPhone === user?.phone) {
            setSmsError('현재 사용 중인 번호와 동일합니다.');
            return;
        }
        setSmsLoading(true);
        setSmsError('');
        setSmsCode('');
        try {
            await authApi.sendSms(cleanPhone);
            setSmsSent(true);
        } catch (e) {
            setSmsError(e.response?.data?.message || '인증코드 전송에 실패했습니다.');
        } finally {
            setSmsLoading(false);
        }
    }, [phone, user?.phone]);

    const handleVerifySms = useCallback(async () => {
        if (smsCode.length !== 6) {
            setSmsError('6자리 인증코드를 입력해주세요.');
            return;
        }
        setSmsLoading(true);
        setSmsError('');
        try {
            const cleanPhone = phone.replace(/-/g, '');
            const res = await authApi.updatePhone(cleanPhone, smsCode);
            if (res.data?.updated) {
                setSmsVerified(true);
                setUser({ ...user, phone: res.data.phone });
                showPopup('confirm', {
                    title: '변경 완료',
                    message: '휴대폰번호가 변경되었습니다.',
                    confirmText: '확인',
                    onConfirm: () => router.back(),
                    autoDismissMs: 1500,
                    onDismiss: () => router.back(),
                });
            }
        } catch (e) {
            setSmsError(e.response?.data?.message || '번호 변경에 실패했습니다.');
        } finally {
            setSmsLoading(false);
        }
    }, [phone, smsCode, user, setUser, showPopup, router]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="휴대폰번호 변경" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: SPACING.xl + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
            >
                {/* 현재 번호 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>현재 휴대폰번호</Text>
                    <View style={styles.currentPhoneBox}>
                        <Text style={styles.currentPhoneText} allowFontScaling={false}>
                            {currentPhone || '-'}
                        </Text>
                    </View>
                </View>

                {/* 새 번호 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>새 휴대폰번호</Text>
                    <View style={styles.rowGapSm}>
                        <TextInput
                            testID="change-phone-phone-input"
                            style={[
                                styles.phoneInput,
                                phoneFocused ? styles.inputFieldFocused : null,
                                smsVerified ? styles.inputFieldVerified : null,
                            ]}
                            value={phone}
                            onChangeText={(t) => {
                                setPhone(formatPhone(t));
                                setSmsVerified(false);
                                setSmsSent(false);
                                setSmsError('');
                            }}
                            onFocus={() => setPhoneFocused(true)}
                            onBlur={() => setPhoneFocused(false)}
                            placeholder="010-0000-0000"
                            placeholderTextColor={COLORS.disabledBtn}
                            keyboardType="phone-pad"
                            editable={!smsVerified}
                            allowFontScaling={false}
                        />
                        <Pressable
                            testID="change-phone-send-sms-btn"
                            style={[styles.smsBtn, phone.length >= 13 && !smsVerified ? styles.smsBtnActive : null]}
                            onPress={handleSendSms}
                            disabled={phone.length < 13 || smsVerified || smsLoading}
                        >
                            {smsLoading && !smsSent ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={styles.smsBtnText} allowFontScaling={false}>
                                    {smsVerified ? '변경완료' : smsSent ? '재전송' : '인증요청'}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                    {smsSent && !smsVerified ? (
                        <View style={styles.smsCodeRow}>
                            <TextInput
                                testID="change-phone-sms-code-input"
                                style={[
                                    styles.smsCodeInput,
                                    smsCodeFocused ? styles.inputFieldFocused : null,
                                ]}
                                value={smsCode}
                                onChangeText={(t) => {
                                    setSmsCode(t.replace(/[^0-9]/g, '').slice(0, 6));
                                    setSmsError('');
                                }}
                                onFocus={() => setSmsCodeFocused(true)}
                                onBlur={() => setSmsCodeFocused(false)}
                                placeholder="인증코드 6자리"
                                placeholderTextColor={COLORS.disabledBtn}
                                keyboardType="number-pad"
                                maxLength={6}
                                allowFontScaling={false}
                            />
                            <Pressable
                                testID="change-phone-verify-btn"
                                style={[styles.smsBtn, smsCode.length === 6 ? styles.smsBtnActive : null]}
                                onPress={handleVerifySms}
                                disabled={smsCode.length !== 6 || smsLoading}
                            >
                                {smsLoading && smsSent ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.smsBtnText} allowFontScaling={false}>확인</Text>
                                )}
                            </Pressable>
                        </View>
                    ) : null}
                    {smsError ? (
                        <Text style={styles.errorText} allowFontScaling={false}>{smsError}</Text>
                    ) : null}
                </View>
            </KeyboardAwareScrollView>
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
        padding: SPACING.xl,
        gap: SPACING.xxl,
    },

    /* Field group */
    fieldGroup: {
        gap: SPACING.sm,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },

    /* Current phone */
    currentPhoneBox: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
    },
    currentPhoneText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.grayMedium,
    },

    /* Shared row */
    rowGapSm: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },

    /* Phone + SMS */
    phoneInput: {
        flex: 1,
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),

    },
    inputFieldFocused: {
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },
    inputFieldVerified: {
        borderColor: COLORS.success,
        paddingHorizontal: SPACING.md,
        backgroundColor: '#F0FFF4',
    },
    smsBtn: {
        width: 90,
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smsBtnActive: {
        backgroundColor: COLORS.primary,
    },
    smsBtnText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    smsCodeRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    smsCodeInput: {
        flex: 1,
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        letterSpacing: 8,
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),
    },
    errorText: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        lineHeight: 16,
        color: COLORS.error,
    },
});
