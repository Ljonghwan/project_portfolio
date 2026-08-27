import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// CommonActions 제거 — expo-router의 router.replace로 통일
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { login as loginKakao, logout as logoutKakao, unlink, me as getKakaoMe } from '@react-native-kakao/user';
import { jwtDecode } from 'jwt-decode';
import useAuthStore from '../src/store/authStore';
import useMatchStore from '../src/store/matchStore';
import { authApi } from '../src/api/auth';
import { Image, ImageBackground } from 'expo-image';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../src/constants/config';
import usePopupStore from '../src/store/popupStore';
import useConfigStore from '../src/store/configStore';
import { showToast } from '../src/utils/toast';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import useBottomSheetBackHandler from '../src/hooks/useBottomSheetBackHandler';
const splashBg = require('../assets/images/splash-bg.jpg');

export default function SplashLoginScreen() {
    const router = useRouter();
    const { isLoggedIn, isLoading, setLogin, updateSignupData, resetSignupData } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const showPopup = usePopupStore((s) => s.show);
    const devLoginEnabled = useConfigStore((s) => s.devLoginEnabled);
    // DB(devLoginEnabled)가 마스터 스위치. 프로덕션에선 켜져 있어야 로고 5탭 시 DEV 로그인 시트가 뜬다.
    // 서버 /auth/debug-login 이 devLoginEnabled 를 최종 검증. 로컬 개발빌드(__DEV__)는 항상 허용.
    const devLoginAvailable = __DEV__ || devLoginEnabled;
    const initialCheckDone = useRef(false);
    const logoTapCountRef = useRef(0);
    const logoTapTimerRef = useRef(null);
    const devSheetRef = useRef(null);
    const [devSheetOpen, setDevSheetOpen] = useState(false);
    useBottomSheetBackHandler(devSheetRef, devSheetOpen);

    const renderDevBackdrop = useCallback(
        (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />,
        []
    );

    // 로그인 화면 로고 5번 연속 터치(1.5초 내) → DEV 로그인 바텀시트 (관리자가 devLoginEnabled 켰을 때만)
    const handleLogoTap = useCallback(() => {
        logoTapCountRef.current += 1;
        if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
        if (logoTapCountRef.current >= 5) {
            logoTapCountRef.current = 0;
            if (devLoginAvailable) devSheetRef.current?.present();
            return;
        }
        logoTapTimerRef.current = setTimeout(() => { logoTapCountRef.current = 0; }, 1500);
    }, [devLoginAvailable]);

    // Phase 1: 타이틀 + footer — 위로 올라오면서 스프링 튕김
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(100);
    // Phase 2 진입 시 layout 점프 방지를 위한 별도 shift
    // subtitle 공간이 layout에 미리 reserve돼있어 titleWrap이 위쪽에 위치하므로,
    // 초기엔 +TITLE_SHIFT만큼 아래로 시프트해 시각적 정중앙처럼 보이게 한 뒤
    // phase 2에서 0으로 spring → 자연스럽게 위로 이동
    const TITLE_SHIFT = 22;
    const titleShiftY = useSharedValue(TITLE_SHIFT);
    const footerOpacity = useSharedValue(0);
    const footerTranslateY = useSharedValue(80);

    // Phase 2: 서브타이틀(위로 올라오며 FadeIn), 버튼(좌우로 펼쳐지며 FadeIn)
    const subtitleOpacity = useSharedValue(0);
    const subtitleTranslateY = useSharedValue(30);
    const buttonOpacity = useSharedValue(0);
    const buttonScaleX = useSharedValue(0);

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value + titleShiftY.value }],
    }));
    const footerStyle = useAnimatedStyle(() => ({
        opacity: footerOpacity.value,
        transform: [{ translateY: footerTranslateY.value }],
    }));
    const subtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
        transform: [{ translateY: subtitleTranslateY.value }],
    }));
    // 가운데에서 양쪽으로 width를 애니메이션해 둥근 reveal 효과 (자식 버튼 크기는 고정)
    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        width: `${buttonScaleX.value * 100}%`,
    }));

    const playPhase1 = useCallback(() => {
        // Phase 1: 타이틀 + footer 동시에 빠르게 올라오며 살짝 튕김 (잔여 진동 최소)
        const springConfig = { damping: 14, stiffness: 220, mass: 0.8, velocity: 8 };
        titleOpacity.value = withTiming(1, { duration: 250 });
        titleTranslateY.value = withSpring(0, springConfig);
        footerOpacity.value = withTiming(1, { duration: 250 });
        footerTranslateY.value = withSpring(0, springConfig);
    }, []);

    const playPhase2 = useCallback(() => {
        // 타이틀 영역 + 서브타이틀 동기화 timing
        const SHIFT_DELAY = 200;
        const SHIFT_DURATION = 500;
        const easing = Easing.out(Easing.cubic);
        // 타이틀 영역 자연스럽게 위로 이동 (서브타이틀과 동일 타이밍)
        titleShiftY.value = withDelay(SHIFT_DELAY, withTiming(0, { duration: SHIFT_DURATION, easing }));
        // 푸터 아래쪽으로 FadeOut
        footerOpacity.value = withTiming(0, { duration: 400 });
        footerTranslateY.value = withTiming(40, { duration: 400 });
        // 서브타이틀 위로 올라오며 FadeIn (스프링 없이 timing)
        subtitleOpacity.value = withDelay(SHIFT_DELAY, withTiming(1, { duration: SHIFT_DURATION, easing }));
        subtitleTranslateY.value = withDelay(SHIFT_DELAY, withTiming(0, { duration: SHIFT_DURATION, easing }));
        // 버튼: 가운데에서 좌우로 reveal (scaleX clip) + FadeIn — 크기 고정
        // opacity는 reveal보다 길게 가져가서 페이드인 체감을 키움
        buttonOpacity.value = withDelay(400, withTiming(1, { duration: 1300, easing: Easing.linear }));
        buttonScaleX.value = withDelay(400, withTiming(1, { duration: 1000, easing }));
    }, []);

    const onLayoutRootView = useCallback(async () => {
        playPhase1();
    }, [playPhase1]);

    // 개발용: 애니메이션 재시작
    const replayTimerRef = useRef(null);
    const handleReplayAnimation = useCallback(() => {
        if (replayTimerRef.current) {
            clearTimeout(replayTimerRef.current);
            replayTimerRef.current = null;
        }
        // 모든 애니메이션 값 초기화
        titleOpacity.value = 0;
        titleTranslateY.value = 100;
        titleShiftY.value = TITLE_SHIFT;
        footerOpacity.value = 0;
        footerTranslateY.value = 80;
        subtitleOpacity.value = 0;
        subtitleTranslateY.value = 30;
        buttonOpacity.value = 0;
        buttonScaleX.value = 0;
        setShowLogin(false);

        playPhase1();

        if (!isLoggedIn) {
            replayTimerRef.current = setTimeout(() => {
                setShowLogin(true);
                playPhase2();
            }, 1000);
        }
    }, [isLoggedIn, playPhase1, playPhase2]);

    useEffect(() => () => {
        if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        // 초기 로드에서만 실행 — signup 중 setLogin으로 isLoggedIn 변경 시 간섭 방지
        if (initialCheckDone.current) return;
        initialCheckDone.current = true;

        const timer = setTimeout(() => {
            if (isLoggedIn) {
                useMatchStore.getState().prefetchHome();
                router.replace('/(tabs)/home');
            } else {
                // Phase 2: 로그인 UI 표시
                setShowLogin(true);
                playPhase2();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isLoading, isLoggedIn]);


    const handleLoginResponse = async (res, socialType) => {
        const data = res.data;
        if (data?.code === 'suspended') {
            const reasonsList = useConfigStore.getState().suspendReasons || [];
            const keyLabel = reasonsList.find((r) => r.key === data.suspendReasonKey)?.label;
            const reasonText =
                data.suspendReasonKey === 'other'
                    ? (data.suspendReason || '기타')
                    : (keyLabel || data.suspendReason || '계정이 정지되었습니다.');
            showPopup('suspend', { reason: reasonText }, 80);
            return;
        }
        if (data.isNewUser) {
            resetSignupData();
            updateSignupData({
                socialType,
                socialId: data.socialId,
                email: data.email || null,
                name: data.name || null,
                phone: data.phone || null,
                gender: data.gender || null,
                birthDate: data.birthDate || null,
            });
            router.navigate('/auth/terms');
        } else {
            await setLogin(data.token, data.refreshToken, data.user);
            useMatchStore.getState().prefetchHome();
            router.replace('/(tabs)/home');
        }
    };

    const handleKakaoLogin = async () => {

        // await unlink();

        try {
            const kakaoToken = await loginKakao();
            if (!kakaoToken) throw new Error('인증실패');
            setLoading(true);
            const profile = await getKakaoMe();
            if (__DEV__) console.log('profile', profile);
            // 카카오 응답 예시:
            //   birthyear: "1994" (필수, 항상 옴)
            //   birthday: "1207" (선택, MMDD)
            //   phoneNumber: "+82 10-0000-0000"

            // birthDate 파싱: birthyear 필수, birthday 없으면 0101 (1월 1일)
            let birthDate = null;
            const birthyear = profile?.birthyear;
            const birthdayMMDD = profile?.birthday || '0101';
            if (birthyear && /^\d{4}$/.test(birthyear) && /^\d{4}$/.test(birthdayMMDD)) {
                const mm = birthdayMMDD.substring(0, 2);
                const dd = birthdayMMDD.substring(2, 4);
                birthDate = `${birthyear}-${mm}-${dd}`;
            }

            // phone 정규화: "+82 10-0000-0000" → "01000000000"
            let phone = null;
            if (profile?.phoneNumber) {
                const digits = String(profile.phoneNumber).replace(/[^0-9]/g, '');
                phone = digits.startsWith('82') ? '0' + digits.substring(2) : digits;
                if (!/^01[0-9]{8,9}$/.test(phone)) phone = null;
            }

            let g = profile?.gender?.toLowerCase();

            const res = await authApi.socialLogin({
                socialType: 'kakao',
                socialId: String(profile.id),
                email: profile?.email || null,
                name: profile?.name || null,
                phone,
                gender: g === 'male' ? 'M' : g === 'female' ? 'F' : null,
                birthDate,
            });
            await handleLoginResponse(res, 'kakao');
        } catch (e) {
            console.log('kakao login error:', e);
            if (e?.message !== '인증실패') {
                // 서버 거절 메시지("탈퇴 회원입니다." 등)가 있으면 그대로 표시
                showToast('error', e?.response?.data?.message || '카카오 로그인에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        if (Platform.OS !== 'ios') return;
        setLoading(true);
        try {

           

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
            });
            if (!credential.identityToken) throw new Error('인증실패');
            const decoded = jwtDecode(credential.identityToken);
            console.log(credential, decoded);
            const fullName = credential.fullName
                ? `${credential.fullName.familyName || ''}${credential.fullName.givenName || ''}`.trim()
                : null;
            const res = await authApi.socialLogin({
                socialType: 'apple',
                socialId: decoded.sub,
                email: credential.email || decoded.email || null,
                name: fullName,
            });

            // await AppleAuthentication.signOutAsync({
            //     user: decoded.sub
            // });

            await handleLoginResponse(res, 'apple');
        } catch (e) {
            if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_REQUEST_UNKNOWN') {
                console.log('apple login error:', e);
                // 서버 거절 메시지("탈퇴 회원입니다." 등)가 있으면 그대로 표시
                showToast('error', e?.response?.data?.message || '애플 로그인에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();
    // 버튼 영역의 실제 렌더 폭 — inner를 고정 폭으로 두기 위해 측정
    const [buttonContainerWidth, setButtonContainerWidth] = useState(0);

    const DEBUG_USERS = [
        { idx: 1, label: '오너1(M)' },
        { idx: 2, label: '오너2(F)' },
        { idx: 3, label: '오너3(M)' },
        { idx: 4, label: '게스트1(F)' },
        { idx: 5, label: '게스트2(M)' },
        { idx: 6, label: '게스트3(F)' },
    ];

    const handleDebugLogin = async (userIdx) => {
        devSheetRef.current?.dismiss();
        setLoading(true);
        try {
            const res = await authApi.debugLogin(userIdx);
            await handleLoginResponse(res, 'kakao');
        } catch (e) {
            showToast('error', '디버그 로그인 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={splashBg}
            style={styles.bgImage}
            imageStyle={{ opacity: 0.3 }}
            onLayout={onLayoutRootView}
            transition={200}
        >
            <StatusBar style="light" />

            {/* {__DEV__ && (
                <TouchableOpacity
                    testID="splash-replay-anim"
                    style={[styles.replayBtn, { top: insets.top + 8 }]}
                    onPress={handleReplayAnimation}
                    activeOpacity={0.7}
                >
                    <Text style={styles.replayBtnText} allowFontScaling={false}>↻ 애니 재생</Text>
                </TouchableOpacity>
            )} */}

            <View testID="splash-screen" style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.container}>
                    {/* Center: 타이틀 + 서브타이틀 */}
                    <View style={styles.content}>
                        <Animated.View style={[styles.titleWrap, titleStyle]}>
                            <TouchableOpacity
                                testID="splash-logo-secret"
                                onPress={handleLogoTap}
                                activeOpacity={1}
                            >
                                <Image source={require('../assets/icons/splash-logo.png')} style={{ width: 100, aspectRatio: 100/62 }}/>
                            </TouchableOpacity>
                            <Text style={styles.titleLine1}>모두의 드라이브</Text>
                        </Animated.View>
                        <Animated.Text
                            style={[styles.subtitle, subtitleStyle]}
                            pointerEvents="none"
                        >
                            오늘은 누구와 달려볼까~
                        </Animated.Text>
                    </View>

                    {/* Bottom: 버튼 + footer */}
                    <View style={styles.bottomSection}>
                        {/* 버튼 영역은 항상 layout에 reserve (Phase 2 진입 시 콘텐츠 영역 점프 방지) */}
                        {/* outer: 레이아웃 폭 예약 / 각 SNS 버튼별 개별 mask로 가운데에서 좌우 reveal */}
                        <View
                            style={styles.buttonOuter}
                            onLayout={(e) => setButtonContainerWidth(e.nativeEvent.layout.width)}
                            pointerEvents={showLogin ? 'auto' : 'none'}
                        >
                            <Animated.View style={[styles.buttonWrap, buttonStyle]}>
                                {buttonContainerWidth > 0 && (
                                    <View style={{ width: buttonContainerWidth }}>
                                        <TouchableOpacity
                                            testID="splash-kakao-btn"
                                            style={styles.kakaoBtn}
                                            onPress={handleKakaoLogin}
                                            disabled={loading || !showLogin}
                                            activeOpacity={0.85}
                                        >
                                            <Image source={require('../assets/icons/kakao-icon.svg')} style={styles.btnIcon} />
                                            <Text style={styles.kakaoBtnText}>Kakao로 시작하기</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Animated.View>

                            {Platform.OS === 'ios' && (
                                <Animated.View style={[styles.buttonWrap, buttonStyle]}>
                                    {buttonContainerWidth > 0 && (
                                        <View style={{ width: buttonContainerWidth }}>
                                            <TouchableOpacity
                                                testID="splash-apple-btn"
                                                style={styles.appleBtn}
                                                onPress={handleAppleLogin}
                                                disabled={loading || !showLogin}
                                                activeOpacity={0.85}
                                            >
                                                <Image source={require('../assets/icons/apple-icon.svg')} style={styles.btnIcon} />
                                                <Text style={styles.appleBtnText}>Apple로 시작하기</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Animated.View>
                            )}
                        </View>

                        {/* Footer: 스플래시에서 보이고, 로그인 전환 시 사라짐 */}
                        <Animated.View style={[styles.footer, footerStyle]}>
                            <Text style={styles.footerTitle}>드라이브 라이프 플랫폼</Text>
                            <Text style={styles.footerCopy}>© 2026 엠코스. All rights reserved.</Text>
                        </Animated.View>
                    </View>
                </View>

            </View>

            {/* DEV 로그인 바텀시트 (로고 5탭 + devLoginEnabled 시 노출) */}
            <BottomSheetModal
                ref={devSheetRef}
                enableDynamicSizing
                enablePanDownToClose
                onChange={(index) => setDevSheetOpen(index >= 0)}
                backdropComponent={renderDevBackdrop}
            >
                <BottomSheetView style={[styles.devSheetContent, { paddingBottom: insets.bottom + SPACING.xl }]}>
                    <Text allowFontScaling={false} style={styles.devSheetTitle}>DEV 로그인</Text>
                    <View style={styles.devUserGrid}>
                        {DEBUG_USERS.map((u) => (
                            <TouchableOpacity
                                testID={`splash-debug-user-${u.idx}`}
                                key={u.idx}
                                style={styles.devUserBtn}
                                onPress={() => handleDebugLogin(u.idx)}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Text allowFontScaling={false} style={styles.devUserText}>{u.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bgImage: {
        flex: 1,
        backgroundColor: COLORS.splashBg,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 13
    },
    titleWrap: {
        alignItems: 'center',
        gap: 11
    },
    titleLine1: {
        fontSize: FONT_SIZE.splash,
        fontFamily: FONTS.jalnan,
        color: COLORS.white,
    },
    titleLine2: {
        fontSize: FONT_SIZE.splash,
        fontFamily: FONTS.jalnan,
        color: COLORS.white,
        marginBottom: SPACING.xl,
    },
    subtitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.jalnan,
        color: COLORS.white,
    },
    bottomSection: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingBottom: 41,
    },
    buttonOuter: {
        width: '100%',
        maxWidth: 320,
        marginBottom: SPACING.xxl,
        alignItems: 'center',
        gap: SPACING.md,
    },
    buttonWrap: {
        overflow: 'hidden',
        borderRadius: 8,
        alignItems: 'center',
    },
    btnIcon: {
        width: 20,
        height: 20,
    },
    kakaoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.kakao,
        borderRadius: 8,
        height: 52,
        gap: 6,
        width: '100%',
    },
    kakaoBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.kakaoText,
    },
    appleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.apple,
        borderRadius: 8,
        height: 52,
        gap: 6,
        width: '100%',
    },
    appleBtnText: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    footer: {
        alignItems: 'center',
        gap: 4,
    },
    footerTitle: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
    footerCopy: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: COLORS.copyrightText,
    },
    devSheetContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },
    devSheetTitle: {
        fontSize: FONT_SIZE.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    devUserGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: SPACING.md,
    },
    devUserBtn: {
        width: '48.5%',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    devUserText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
    replayBtn: {
        position: 'absolute',
        right: 12,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    replayBtnText: {
        fontSize: 12,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
});
