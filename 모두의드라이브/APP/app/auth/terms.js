import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import useConfigStore from '../../src/store/configStore';
import { authApi } from '../../src/api/auth';
import { isSignupAgeValid, isSignupHardMinValid, showSignupAgeRestricted, showSignupHardMinRestricted } from '../../src/utils/age';
import { Image } from 'expo-image';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

function renderCheckbox(checked) {
    if (checked) {
        return (
            <View style={styles.checkboxChecked}>
                <Image source={require('../../assets/icons/checkbox-bg.svg')} style={styles.checkboxIcon} />
                <Image source={require('../../assets/icons/checkbox-check.svg')} style={styles.checkboxIcon} />
            </View>
        );
    }
    return <View style={styles.checkbox} />;
}

export default function TermsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { updateSignupData } = useAuthStore();
    const signupAgeLimitEnabled = useConfigStore(s => s.signupAgeLimitEnabled);
    const signupAgeHardMin = useConfigStore(s => s.signupAgeHardMin);
    const signupAgeMin = useConfigStore(s => s.signupAgeMin);
    const signupAgeMax = useConfigStore(s => s.signupAgeMax);
    const [terms, setTerms] = useState([]);
    const [agreed, setAgreed] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTerms();
    }, []);

    const loadTerms = async () => {
        try {
            const res = await authApi.getTerms();
            const list = res.data;
            const all = Array.isArray(list) ? list : [];
            const data = all.filter(t => [1, 2, 3].includes(t.type));
            setTerms(data);
            const init = {};
            data.forEach(t => { init[t.idx] = false; });
            setAgreed(init);
        } catch (e) {
            const defaultTerms = [
                { idx: 1, type: 1, title: '서비스 이용약관' },
                { idx: 2, type: 2, title: '개인정보 수집 및 이용 동의' },
                { idx: 3, type: 3, title: '이벤트 및 마케팅 활용 동의' },
            ];
            setTerms(defaultTerms);
            const init = {};
            defaultTerms.forEach(t => { init[t.idx] = false; });
            setAgreed(init);
        } finally {
            setLoading(false);
        }
    };

    const isRequired = (term) => term.type === 1 || term.type === 2;
    const allChecked = terms.length > 0 && terms.every(t => agreed[t.idx]);
    const requiredChecked = terms.filter(isRequired).every(t => agreed[t.idx]);

    const toggleAll = useCallback(() => {
        setAgreed(prev => {
            const allOn = terms.length > 0 && terms.every(t => prev[t.idx]);
            const newVal = !allOn;
            const next = {};
            terms.forEach(t => { next[t.idx] = newVal; });
            return next;
        });
    }, [terms]);

    const toggleOne = useCallback((idx) => {
        setAgreed(prev => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const handleAgree = useCallback(() => {
        if (!requiredChecked) return;
        const marketingTerm = terms.find(t => t.type === 3);
        updateSignupData({
            marketingAgree: marketingTerm ? agreed[marketingTerm.idx] : false,
        });
        // SNS에서 필수 개인정보(이름/생년월일/성별/휴대폰)가 누락된 경우 별도 페이지로
        const { signupData } = useAuthStore.getState();
        // SNS(카카오)가 생년월일을 내려준 경우 여기서 먼저 연령 검증한다.
        // 이 값은 사용자가 고칠 수 없으므로, personal-info 로 보내 SMS 인증까지 시킨 뒤 막으면
        // 불필요한 문자 과금과 이탈이 생긴다. 위반 시 가입 중단(팝업 → 로그인 화면 복귀).
        if (signupData.birthDate && !isSignupHardMinValid(signupData.birthDate, signupAgeHardMin)) {
            showSignupHardMinRestricted(router, signupAgeHardMin);
            return;
        }
        if (signupAgeLimitEnabled && signupData.birthDate && !isSignupAgeValid(signupData.birthDate, signupAgeMin, signupAgeMax)) {
            showSignupAgeRestricted(router, signupAgeMin, signupAgeMax);
            return;
        }
        const needPersonalInfo = !signupData.name || !signupData.birthDate || !signupData.gender || !signupData.phone;
        if (needPersonalInfo) {
            router.navigate('/auth/personal-info');
            return;
        }
        router.navigate('/auth/select-type');
    }, [requiredChecked, terms, agreed, updateSignupData, router, signupAgeLimitEnabled, signupAgeHardMin, signupAgeMin, signupAgeMax]);

    const getTermLabel = useCallback((term) => {
        const prefix = isRequired(term) ? '[필수]' : '[선택]';
        const title = term.title?.replace(/^\[필수\]|\[선택\]/g, '') || term.title;
        return `${prefix}${title}`;
    }, []);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="서비스 이용 동의" rightLabel="취소" onRightPress={() => router.back()} testIDPrefix="terms-header" />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title} allowFontScaling={false}>
                    서비스 약관에 동의해주세요.
                </Text>

                <View style={styles.termListWrap}>
                    {/* 모두 동의 카드 */}
                    <Pressable
                        style={[styles.allAgreeCard, allChecked ? styles.allAgreeCardActive : null]}
                        onPress={toggleAll}
                        testID="terms-all-agree-btn"
                    >
                        {renderCheckbox(allChecked)}
                        <View style={styles.allAgreeContent}>
                            <Text style={styles.allAgreeTitle} allowFontScaling={false}>
                                모두 동의합니다.
                            </Text>
                            <Text style={styles.allAgreeDesc} allowFontScaling={false}>
                                전체동의는 필수 및 선택정보에 대한 동의도 포함되어 있으며, 개별적으로도 동의를 선택하실 수 있습니다. 선택항목에 대한 동의를 거부하시는 경우에도 서비스 이용이 가능합니다.
                            </Text>
                        </View>
                    </Pressable>

                    {/* 개별 약관 */}
                    {terms.map(term => (
                        <View key={term.idx} style={styles.termRow}>
                            <Pressable
                                style={styles.termCheckArea}
                                onPress={() => toggleOne(term.idx)}
                                testID={`terms-check-${term.idx}`}
                            >
                                {renderCheckbox(agreed[term.idx])}
                                <Text style={styles.termText} allowFontScaling={false}>
                                    {getTermLabel(term)}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={styles.arrowBtn}
                                hitSlop={8}
                                onPress={() => router.navigate({ pathname: '/auth/term-detail', params: { title: term.title, idx: term.idx } })}
                                testID={`terms-detail-${term.idx}`}
                            >
                                <Image source={require('../../assets/icons/chevron-right.svg')} style={styles.arrowIcon} />
                            </Pressable>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                <Pressable
                    style={[styles.agreeBtn, requiredChecked ? styles.agreeBtnActive : null]}
                    onPress={handleAgree}
                    disabled={!requiredChecked}
                    testID="terms-agree-btn"
                >
                    <Text style={styles.agreeBtnText} allowFontScaling={false}>동의</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xxxl,
        gap: SPACING.xl,
    },

    /* Title */
    title: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },

    /* Term list wrapper */
    termListWrap: {
        flex: 1,
        gap: SPACING.xl,
    },

    /* 모두 동의 카드 */
    allAgreeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        borderCurve: 'continuous',
        backgroundColor: COLORS.white,
        gap: SPACING.sm,
    },
    allAgreeCardActive: {
        borderColor: COLORS.primary,
    },
    allAgreeContent: {
        flex: 1,
        gap: SPACING.xs,
    },
    allAgreeTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    allAgreeDesc: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.grayMedium,
    },

    /* 개별 약관 row */
    termRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    termCheckArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    termText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    arrowBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowIcon: {
        width: 24,
        height: 24,
    },

    /* Checkbox */
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    checkboxChecked: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxIcon: {
        width: 24,
        height: 24,
        position: 'absolute',
    },

    /* 하단 버튼 */
    bottomBar: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    },
    agreeBtn: {
        height: 52,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: COLORS.disabledBtn,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agreeBtnActive: {
        backgroundColor: COLORS.primary,
    },
    agreeBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        lineHeight: 24,
        color: COLORS.white,
    },
});
