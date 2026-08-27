import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import usePopupStore from '../../src/store/popupStore';

export default function ReferralScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [referralCode, setReferralCode] = useState('');
    const [codeFocused, setCodeFocused] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const showPopup = usePopupStore((s) => s.show);

    const canRegister = referralCode.length > 0;

    const handleRegister = useCallback(async () => {
        if (!referralCode) {
            setError('추천 코드를 입력해주세요.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await authApi.registerReferral(referralCode);

            // 추천코드 등록 완료 팝업 → 2초 후 완료 화면 (신규자측 포인트 미지급)
            router.replace('/auth/complete');
            showPopup('confirm', {
                title: '추천 코드 등록이 완료되었습니다.',
                autoDismissMs: 2000
            }, 50);
        } catch (e) {
            const msg = e.response?.data?.message || '추천 코드가 올바르지 않습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [referralCode, showPopup, router]);

    const handleSkip = useCallback(() => {
        // 스킵 → 바로 완료 화면
        router.replace('/auth/complete');
    }, [router]);

    return (
        <View testID="referral-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader
                title="친구 추천 코드"
                onClose={handleSkip}
                rightDisabled={loading}
            />

            <KeyboardAwareScrollView
                style={styles.content}
                contentContainerStyle={{ flexGrow: 1 }}
                bottomOffset={80}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title} allowFontScaling={false}>
                        <Text style={styles.titleBlue}>친구 추천 코드</Text>
                        <Text>가 있으신가요?</Text>
                    </Text>
                    <Text style={styles.desc} allowFontScaling={false}>
                        추천인에게{' '}
                        <Text style={styles.pointText}>10,000P</Text>
                        가 지급됩니다.
                    </Text>
                </View>

                {/* Input */}
                <View style={styles.inputSection}>
                    <TextInput
                        style={[
                            styles.input,
                            codeFocused && styles.inputFocused,
                            error ? styles.inputError : null,
                        ]}
                        value={referralCode}
                        onChangeText={(t) => {
                            setReferralCode(t.toUpperCase());
                            setError('');
                        }}
                        onFocus={() => setCodeFocused(true)}
                        onBlur={() => setCodeFocused(false)}
                        placeholder="추천코드 입력"
                        placeholderTextColor={COLORS.disabledBtn}
                        autoCapitalize="characters"
                        allowFontScaling={false}
                        testID="referral-code-input"
                    />
                    {error ? (
                        <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
                    ) : null}
                </View>

                {/* 다음에 등록하기 */}
                <Pressable onPress={handleSkip} disabled={loading} testID="referral-skip-btn">
                    <Text style={styles.skipLink} allowFontScaling={false}>다음에 등록하기</Text>
                </Pressable>
            </KeyboardAwareScrollView>

            {/* Bottom button */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[
                        styles.registerBtn,
                        canRegister && styles.registerBtnActive,
                        loading && { opacity: 0.5 },
                    ]}
                    onPress={handleRegister}
                    disabled={!canRegister || loading}
                    testID="referral-register-btn"
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.registerBtnText} allowFontScaling={false}>등록</Text>
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

    /* Content */
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xxxl,
        paddingTop: SPACING.xxxl,
        gap: SPACING.xl,
    },

    /* Title */
    titleSection: {
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    titleBlue: {
        color: COLORS.primary,
    },
    desc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    pointText: {
        fontFamily: FONTS.extraBold,
        color: COLORS.point,
    },

    /* Input */
    inputSection: {
        gap: SPACING.sm,
        marginBottom: SPACING.xxxxl,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        textAlignVertical: 'center',
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),
    },
    inputFocused: {
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },
    inputError: {
        borderColor: '#E02E2E',
    },
    errorText: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        lineHeight: 16,
        color: 'red',
    },

    /* Skip link */
    skipLink: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },

    /* Bottom bar */
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        backgroundColor: COLORS.white,
    },
    registerBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerBtnActive: {
        backgroundColor: COLORS.primary,
    },
    registerBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
