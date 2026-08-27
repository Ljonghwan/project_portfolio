import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import BirthDatePickerSheet from '../../src/components/BirthDatePickerSheet';
import { isSignupAgeValid, isSignupHardMinValid, showSignupAgeRestricted, showSignupHardMinRestricted } from '../../src/utils/age';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signupData, updateSignupData } = useAuthStore();
    const filterGenders = useConfigStore(s => s.filterGenders);
    const signupAgeLimitEnabled = useConfigStore(s => s.signupAgeLimitEnabled);
    const signupAgeHardMin = useConfigStore(s => s.signupAgeHardMin);
    const signupAgeMin = useConfigStore(s => s.signupAgeMin);
    const signupAgeMax = useConfigStore(s => s.signupAgeMax);
    const genders = useMemo(
        () => (filterGenders ?? []).filter(g => g.key !== 'any'),
        [filterGenders]
    );

    // const needName = !signupData.name;
    const needBirth = !signupData.birthDate;
    const needGender = !signupData.gender;
    const needPhone = !signupData.phone;

    const [name, setName] = useState(signupData.name || '');
    const [nameError, setNameError] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [gender, setGender] = useState(signupData.gender || '');
    const [phone, setPhone] = useState(signupData.phone || '');
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    const [smsCodeFocused, setSmsCodeFocused] = useState(false);
    const [smsSent, setSmsSent] = useState(false);
    const [smsVerified, setSmsVerified] = useState(!!signupData.phone);
    const [smsLoading, setSmsLoading] = useState(false);
    const [smsError, setSmsError] = useState('');
    const [birthPickerVisible, setBirthPickerVisible] = useState(false);

    useEffect(() => {
        setNameError('');
    }, [name])

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
        setSmsLoading(true);
        setSmsError('');
        setSmsCode('');
        try {
            await authApi.sendSms(cleanPhone);
            setSmsSent(true);
        } catch (e) {
            setSmsError(e?.response?.data?.message || '인증코드 전송에 실패했습니다.');
        } finally {
            setSmsLoading(false);
        }
    }, [phone]);

    const handleVerifySms = useCallback(async () => {
        if (smsCode.length !== 6) {
            setSmsError('6자리 인증코드를 입력해주세요.');
            return;
        }
        setSmsLoading(true);
        setSmsError('');
        try {
            const res = await authApi.verifySms(phone.replace(/-/g, ''), smsCode);
            if (res.data?.verified) {
                setSmsVerified(true);
            } else {
                setSmsError('인증코드가 일치하지 않습니다.');
            }
        } catch (e) {
            setSmsError(e.response?.data?.message || '인증에 실패했습니다.');
        } finally {
            setSmsLoading(false);
        }
    }, [phone, smsCode]);

    const birthDate = birthYear && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : signupData.birthDate || null;

    // 입력 완료 여부만 판단 — 연령 검증은 handleNext 에서 수행
    // (여기서 나이까지 막으면 버튼이 비활성이라 눌러도 제한 팝업이 뜨지 않음)
    const birthOk = !needBirth || !!(birthYear && birthMonth && birthDay);

    // 한국 이름 검증: 완성형 한글 + 공백만 허용 (자음/모음만 불가)
    const isKoreanNameValid = useCallback((text) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) return false;
        return /^[가-힣][가-힣\s]*[가-힣]$/.test(trimmed) || /^[가-힣]{1}$/.test(trimmed);
    }, []);

    const handleNameChange = useCallback((text) => {
        setName(text);
       
    }, [isKoreanNameValid]);

    const handleNameBlur = () => {
        if (name.trim().length > 0 && !isKoreanNameValid(name)) {
            setNameError('한글 이름만 입력 가능합니다. (자음/모음만 불가)');
        } else {
            setNameError('');
        }
    }

    const nameValid = isKoreanNameValid(name);

    const canNext =
        nameValid &&
        birthOk &&
        (!needGender || gender) &&
        (!needPhone || smsVerified);

    const handleNext = useCallback(() => {
        if (!canNext) return;
        // 최소 연령 하한 (만 18세 미만 상시 차단 — 플래그 무관)
        if (!isSignupHardMinValid(birthDate, signupAgeHardMin)) {
            showSignupHardMinRestricted(router, signupAgeHardMin);
            return;
        }
        // 상세 연령 제한 (플래그 on 일 때만) — 위반 시 팝업 노출 후 가입 중단
        if (signupAgeLimitEnabled && !isSignupAgeValid(birthDate, signupAgeMin, signupAgeMax)) {
            showSignupAgeRestricted(router, signupAgeMin, signupAgeMax);
            return;
        }
        updateSignupData({
            name: name.trim() || signupData.name,
            birthDate,
            gender: gender || signupData.gender,
            phone: needPhone ? phone.replace(/-/g, '') : signupData.phone,
        });
        router.replace('/auth/select-type');
    }, [canNext, name, signupData, birthDate, gender, needPhone, phone, updateSignupData, router, signupAgeLimitEnabled, signupAgeHardMin, signupAgeMin, signupAgeMax]);

    const openBirthPicker = useCallback(() => setBirthPickerVisible(true), []);
    const closeBirthPicker = useCallback(() => setBirthPickerVisible(false), []);

    const handleBirthSelect = useCallback((year, month, day) => {
        setBirthYear(year);
        setBirthMonth(month);
        setBirthDay(day);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="개인정보 입력" onBack={() => router.back()} />

            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={80}
                keyboardShouldPersistTaps={'handled'}
            >
                <View style={styles.titleSection}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>본인 인증</Text>
                    <Text style={styles.sectionDesc} allowFontScaling={false}>
                        안전한 서비스 이용을 위해 본인정보를 입력해주세요.
                    </Text>
                </View>

                {/* 이름 */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel} allowFontScaling={false}>이름</Text>
                    <TextInput
                        autoFocus
                        style={styles.inputFieldGray}
                        value={name}
                        onChangeText={handleNameChange}
                        onBlur={handleNameBlur}
                        placeholder="실명을 입력하세요"
                        placeholderTextColor={COLORS.disabledBtn}
                        maxLength={50}
                        allowFontScaling={false}
                        testID="personal-info-name-input"
                    />
                    {nameError ? (
                        <Text style={styles.errorText} allowFontScaling={false}>{nameError}</Text>
                    ) : null}
                </View>

                {/* 생년월일 */}
                {needBirth ? (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>생년월일</Text>
                        <Pressable style={styles.birthSelectRow} onPress={openBirthPicker} testID="personal-info-birth-btn">
                            <View style={[styles.birthSelectBox, { flex: 2 }]}>
                                <Text style={birthYear ? styles.selectText : styles.selectPlaceholder} allowFontScaling={false}>
                                    {birthYear || 'YYYY'}
                                </Text>
                            </View>
                            <View style={[styles.birthSelectBox, { flex: 1 }]}>
                                <Text style={birthMonth ? styles.selectText : styles.selectPlaceholder} allowFontScaling={false}>
                                    {birthMonth || 'MM'}
                                </Text>
                            </View>
                            <View style={[styles.birthSelectBox, { flex: 1 }]}>
                                <Text style={birthDay ? styles.selectText : styles.selectPlaceholder} allowFontScaling={false}>
                                    {birthDay || 'DD'}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                ) : null}

                {/* 성별 */}
                {needGender ? (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>성별</Text>
                        <View style={styles.rowGapSm}>
                            {(genders.length > 0 ? genders : [{ key: 'M', label: '남성' }, { key: 'F', label: '여성' }]).map(g => (
                                <Pressable
                                    key={g.key}
                                    style={[styles.genderBtn, gender === g.key ? styles.genderBtnActive : styles.genderBtnInactive]}
                                    onPress={() => setGender(g.key)}
                                    testID={`personal-info-gender-${g.key}`}
                                >
                                    <Text style={[styles.genderBtnText, gender === g.key ? styles.genderBtnTextActive : null]} allowFontScaling={false}>
                                        {g.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* 휴대폰번호 */}
                {needPhone ? (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel} allowFontScaling={false}>휴대폰번호</Text>
                        <View style={styles.rowGapSm}>
                            <TextInput
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
                                testID="personal-info-phone-input"
                            />
                            <Pressable
                                style={[styles.smsBtn, phone.length >= 13 && !smsVerified ? styles.smsBtnActive : null]}
                                onPress={handleSendSms}
                                disabled={phone.length < 13 || smsVerified || smsLoading}
                                testID="personal-info-sms-send-btn"
                            >
                                {smsLoading && !smsSent ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.smsBtnText} allowFontScaling={false}>
                                        {smsVerified ? '인증완료' : smsSent ? '재전송' : '인증요청'}
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                        {smsSent && !smsVerified ? (
                            <View style={styles.smsCodeRow}>
                                <TextInput
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
                                    testID="personal-info-sms-code-input"
                                />
                                <Pressable
                                    style={[styles.smsBtn, smsCode.length === 6 ? styles.smsBtnActive : null]}
                                    onPress={handleVerifySms}
                                    disabled={smsCode.length !== 6 || smsLoading}
                                    testID="personal-info-sms-verify-btn"
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
                ) : null}
            </KeyboardAwareScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.nextBtn, canNext ? styles.nextBtnActive : null]}
                    onPress={handleNext}
                    disabled={!canNext}
                    testID="personal-info-next-btn"
                >
                    <Text style={styles.nextBtnText} allowFontScaling={false}>다음</Text>
                </Pressable>
            </View>

            <BirthDatePickerSheet
                visible={birthPickerVisible}
                onClose={closeBirthPicker}
                onSelect={handleBirthSelect}
                initialYear={birthYear ? parseInt(birthYear) : null}
                initialMonth={birthMonth ? parseInt(birthMonth) : null}
                initialDay={birthDay ? parseInt(birthDay) : null}
            />
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

    /* Title */
    titleSection: {
        gap: 4,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    sectionDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
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

    /* Shared row */
    rowGapSm: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },

    /* Input */
    inputFieldGray: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    inputFieldFocused: {
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        ...Platform.select({
            ios: { boxShadow: '2px 2px 12px rgba(56, 79, 238, 0.3)' },
            android: { elevation: 4, backgroundColor: COLORS.white },
        }),
    },

    /* Birth date */
    birthSelectRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    birthSelectBox: {
        height: 52,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    selectPlaceholder: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.disabledBtn,
    },

    /* Gender */
    genderBtn: {
        flex: 1,
        height: 52,
        borderWidth: 1,
        borderRadius: 8,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryBg,
    },
    genderBtnInactive: {
        borderColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
    },
    genderBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    genderBtnTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
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
        backgroundColor: COLORS.white,
        ...Platform.select({ android: { elevation: 0 } }),
    },
    errorText: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        lineHeight: 16,
        color: COLORS.error,
    },

    /* Bottom bar */
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
