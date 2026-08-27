import { useEffect, useCallback, useRef } from 'react';
import { Text, TextInput, AppState, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../src/utils/pushNotification';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useIAP } from 'react-native-iap';

import useAuthStore from '../src/store/authStore';
import useConfigStore from '../src/store/configStore';
import usePointStore from '../src/store/pointStore';
import useChatStore from '../src/store/chatStore';
import useNotificationStore from '../src/store/notificationStore';
import chatApi from '../src/api/chat';
import notificationApi from '../src/api/notification';
import { toastConfig } from '../src/components/ToastConfig';
import { COLORS } from '../src/constants/config';
import { initAnalytics } from '../src/utils/analytics';
import usePopupStore from '../src/store/popupStore';
import PopupManager from '../src/components/PopupManager';

// 휴대폰 개인설정 글꼴 크기 조정 비적용
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

SplashScreen.preventAutoHideAsync();
try { SplashScreen.setOptions({ duration: 200, fade: true }); } catch {}

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

function compareVersions(current, latest) {
    const c = current.split('.').map(Number);
    const l = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(c.length, l.length); i++) {
        const cv = c[i] || 0;
        const lv = l[i] || 0;
        if (cv < lv) return -1;
        if (cv > lv) return 1;
    }
    return 0;
}

export default function RootLayout() {
    const initialize = useAuthStore((s) => s.initialize);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const isLoading = useAuthStore((s) => s.isLoading);
    const router = useRouter();
    const wasLoggedIn = useRef(false);

    const appState = useRef(AppState.currentState);
    const showPopup = usePopupStore((s) => s.show);
    const fetchConfig = useConfigStore((s) => s.fetchConfig);
    const pointProductsIAP = useConfigStore((s) => s.pointProductsIAP);

    const { connected, products: iapProducts, fetchProducts } = useIAP();

    const checkAppVersion = useCallback(async () => {
        await fetchConfig();
        const { appVersion, forceUpdate, iosStoreUrl, aosStoreUrl } = useConfigStore.getState();
        if (appVersion && compareVersions(APP_VERSION, appVersion) < 0) {
            const isForce = !!forceUpdate;
            usePopupStore.getState().closeByType('update');
            usePopupStore.getState().closeByType('forceUpdate');
            showPopup(isForce ? 'forceUpdate' : 'update', {
                currentVersion: APP_VERSION,
                latestVersion: appVersion,
                forceUpdate: isForce,
                iosStoreUrl: iosStoreUrl || '',
                aosStoreUrl: aosStoreUrl || '',
            }, isForce ? 100 : 90);
        }
    }, []);

    const [fontsLoaded] = useFonts({
        'Jalnan': require('../assets/fonts/Jalnan.ttf'),
        'Pretendard-Thin': require('../assets/fonts/Pretendard-Thin.ttf'),
        'Pretendard-ExtraLight': require('../assets/fonts/Pretendard-ExtraLight.ttf'),
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.ttf'),
        'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.ttf'),
        'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.ttf'),
        'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.ttf'),
        'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.ttf'),
        'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.ttf'),
        'Pretendard-Black': require('../assets/fonts/Pretendard-Black.ttf'),
    });

    useEffect(() => {
        initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_APP_KEY);
        initAnalytics();
        initialize();
    }, []);

    // 로그아웃 감지 → 스플래시(index)로 리셋
    useEffect(() => {
        if (isLoading) return;
        if (wasLoggedIn.current && !isLoggedIn) {
            if (router.canDismiss()) router.dismissAll();
            router.replace('/');
        }
        wasLoggedIn.current = isLoggedIn;
    }, [isLoggedIn, isLoading, router]);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        if (!isLoading && isLoggedIn) {
            usePointStore.getState().fetchBalance();
            chatApi.getUnreadTotal().then(res => {
                useChatStore.getState().setUnreadTotal(res.data?.total || 0);
            }).catch(() => {});
            notificationApi.getUnreadCount().then(res => {
                useNotificationStore.getState().setUnreadCount(res.data?.count ?? 0);
            }).catch(() => {});
        }
    }, [isLoading, isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) {
            // 토큰 저장 완료 후 충분한 시간을 두고 등록
            const timer = setTimeout(() => {
                registerForPushNotifications().catch(() => {});
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn]);

    // 포그라운드 푸시 수신 시 채팅/알림 unread 동기화
    useEffect(() => {
        if (!isLoggedIn) return;

        const sub = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data;
            if (data?.type === 'chat') {
                chatApi.getUnreadTotal().then(res => {
                    useChatStore.getState().setUnreadTotal(res.data?.total || 0);
                }).catch(() => {});
            } else {
                notificationApi.getUnreadCount().then(res => {
                    useNotificationStore.getState().setUnreadCount(res.data?.count ?? 0);
                }).catch(() => {});
            }
        });

        return () => sub.remove();
    }, [isLoggedIn]);

    // 푸시 탭 시 해당 화면으로 이동
    useEffect(() => {
        if (!isLoggedIn) return;

        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            if (data?.type === 'noshow' && data?.roomIdx) {
                router.navigate(`/chat/${data.roomIdx}`);
            } else if (data?.type === 'noshow_confirmed') {
                const params = new URLSearchParams();
                params.set('category', 'noshow');
                if (data?.driveDate) params.set('driveDate', String(data.driveDate));
                router.navigate(`/inquiry-create?${params.toString()}`);
            } else if (data?.type === 'chat' && data?.roomIdx) {
                router.navigate(`/chat/${data.roomIdx}`);
            } else if (
                ['matchAccept', 'matchReject', 'matchAbsent', 'match_apply', 'match_accept', 'match_reject', 'match_absent', 'like', 'match_filter', 'manner_eval'].includes(data?.type) &&
                data?.matchIdx
            ) {
                router.navigate(`/match/${data.matchIdx}`);
            } else if (data?.type === 'notice') {
                router.navigate('/notice');
            } else if (data?.type === 'event') {
                router.navigate('/news');
            }
        });

        return () => sub.remove();
    }, [isLoggedIn, router]);

    // 앱 실행 시 + foreground 복귀 시 버전 체크 (폰트 로딩 완료 후)
    useEffect(() => {
        if (!fontsLoaded) return;

        checkAppVersion();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                checkAppVersion();
                if (useAuthStore.getState().isLoggedIn) {
                    chatApi.getUnreadTotal().then(res => {
                        useChatStore.getState().setUnreadTotal(res.data?.total || 0);
                    }).catch(() => {});
                    notificationApi.getUnreadCount().then(res => {
                        useNotificationStore.getState().setUnreadCount(res.data?.count ?? 0);
                    }).catch(() => {});
                }
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [fontsLoaded, checkAppVersion]);

    // iOS IAP 상품 정보 사전 로드 (앱 시작 시점부터 캐시)
    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        if (!connected) return;
        if (!Array.isArray(pointProductsIAP) || pointProductsIAP.length === 0) return;

        const skus = pointProductsIAP.map((p) => p.sku || p.id).filter(Boolean);
        if (!skus.length) return;

        console.log('[IAP/_layout] fetchProducts request', skus);
        fetchProducts({ skus, type: 'in-app' })
            .then(() => console.log('[IAP/_layout] fetchProducts done'))
            .catch((e) => console.warn('[IAP/_layout] fetchProducts error', e));
    }, [connected, pointProductsIAP, fetchProducts]);

    useEffect(() => {
        console.log(
            '[IAP/_layout] products updated',
            iapProducts?.length,
            iapProducts?.map((p) => ({ id: p.id, title: p.title, price: p.displayPrice })),
        );
    }, [iapProducts]);

    if (!fontsLoaded) return null;

    return (
        <>
            <ReducedMotionConfig mode={ReduceMotion.Never} />
            <SafeAreaProvider>
                <GestureHandlerRootView >
                    <KeyboardProvider>
                        <SafeAreaInsetsContext.Consumer>
                            {insets =>
                                <BottomSheetModalProvider>
                                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.white } }}>
                                        <Stack.Screen name="index" />
                                        <Stack.Screen name="link" />
                                        <Stack.Screen name="auth/terms" />
                                        <Stack.Screen name="auth/term-detail" />
                                        <Stack.Screen name="auth/personal-info" />
                                        <Stack.Screen name="auth/select-type" />
                                        <Stack.Screen name="auth/basic-profile" />
                                        <Stack.Screen name="auth/detail-profile" />
                                        <Stack.Screen name="auth/referral" />
                                        <Stack.Screen name="auth/complete" />
                                        <Stack.Screen name="(tabs)" />
                                        <Stack.Screen name="profile/edit" />
                                        <Stack.Screen name="profile/edit-detail" />
                                        <Stack.Screen name="profile/[userIdx]" />
                                        <Stack.Screen name="profile/payment" />
                                        <Stack.Screen name="viewer"  />
                                        <Stack.Screen name="point" />
                                        <Stack.Screen name="invite" />
                                        <Stack.Screen name="news" />
                                        <Stack.Screen name="news-detail" />
                                        <Stack.Screen name="notice" />
                                        <Stack.Screen name="notice-detail" />
                                        <Stack.Screen name="faq" />
                                        <Stack.Screen name="faq-detail" />
                                        <Stack.Screen name="inquiry" />
                                        <Stack.Screen name="inquiry-create" />
                                        <Stack.Screen name="settings" />
                                        <Stack.Screen name="settings/block-list" options={{ headerShown: false }} />
                                        <Stack.Screen name="settings/terms" options={{ headerShown: false }} />
                                        <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
                                        <Stack.Screen name="match/[idx]" />
                                        <Stack.Screen name="match/point-use" />
                                        <Stack.Screen name="match/apply" />
                                        <Stack.Screen name="match/create" />
                                        <Stack.Screen name="review/[idx]" options={{ headerShown: false }} />
                                        <Stack.Screen name="review/manner-eval" options={{ headerShown: false }} />
                                        <Stack.Screen name="review/write" options={{ headerShown: false }} />
                                        <Stack.Screen name="review/place-search" options={{ headerShown: false }} />
                                        <Stack.Screen name="review/my-evaluations" options={{ headerShown: false }} />
                                        <Stack.Screen name="match/like-list" options={{ headerShown: false }} />
                                        <Stack.Screen name="chat" options={{ headerShown: false }} />
                                    </Stack>
                                    <Toast config={toastConfig} position="bottom" bottomOffset={120} />
                                    <PopupManager />
                                </BottomSheetModalProvider>
                            }
                        </SafeAreaInsetsContext.Consumer>
                        
                    </KeyboardProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </>
    );
}
