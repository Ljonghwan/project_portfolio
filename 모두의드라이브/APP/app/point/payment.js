import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, BackHandler, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../src/constants/config';
import AppHeader from '../../src/components/AppHeader';
import { showToast } from '../../src/utils/toast';
import usePointStore from '../../src/store/pointStore';

// [C123] 미설치 외부앱 스킴 → 플레이스토어 매핑 (대표 카드사/간편결제만, 나머지는 일반 처리)
const SCHEME_MARKET = {
    ispmobile: 'market://details?id=kvp.jjy.MispAndroid320',         // ISP/페이북
    'kb-acp': 'market://details?id=com.kbcard.cxh.appcard',          // KB Pay
    'kb-screen': 'market://details?id=com.kbcard.cxh.appcard',
    hdcardappcardansimclick: 'market://details?id=com.hyundaicard.appcard',  // 현대카드
    'shinhan-sr-ansimclick': 'market://details?id=com.shcard.smartpay',      // 신한카드
    'mpocket': 'market://details?id=com.shcard.smartpay',
    'lottesmartpay': 'market://details?id=com.lottecard.lpay',       // 롯데카드
    'lotteappcard': 'market://details?id=com.lcacApp',
    'nhappvardansimclick': 'market://details?id=nh.smart.nhallonepay',
    'nhallonepayansimclick': 'market://details?id=nh.smart.nhallonepay',
    'kakaotalk': 'market://details?id=com.kakao.talk',
    'supertoss': 'market://details?id=viva.republica.toss',
    'tauthlink': 'market://details?id=com.sktelecom.tauth',          // SKT PASS
    'ktauthexternalcall': 'market://details?id=com.kt.ktauth',       // KT PASS
    'upluscorporation': 'market://details?id=com.lguplus.smartotp',  // U+ PASS
    'payco': 'market://details?id=com.nhnent.payapp',
    'lpayapp': 'market://details?id=com.lottemembers.android',
    'samsungpay': 'market://details?id=com.samsung.android.spay',
};

export default function PointPaymentWebView() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { paymentUrl, orderNo } = useLocalSearchParams();
    const refreshBalance = usePointStore((s) => s.refreshBalance);

    const [loading, setLoading] = useState(true);
    const doneRef = useRef(false); // 성공/취소 1회 처리 가드

    const finish = useCallback((type) => {
        if (doneRef.current) return;
        doneRef.current = true;
        if (type === 'success') {
            refreshBalance();
            showToast('success', '충전되었습니다.');
        } else {
            showToast('info', '결제가 취소되었습니다.');
        }
        if (router.canGoBack()) router.back();
        else router.replace('/point');
    }, [refreshBalance, router]);

    // [C123] 결제 취소 확인 팝업. 결제완료 처리중(doneRef)이면 무시 (완료중 취소 혼란 제거)
    const confirmCancel = useCallback(() => {
        if (doneRef.current) return true; // 이미 완료/취소 처리중 → 백버튼 무시
        Alert.alert(
            '결제 취소',
            '결제를 취소하시겠습니까?',
            [
                { text: '아니오', style: 'cancel' },
                { text: '예', style: 'destructive', onPress: () => finish('cancel') },
            ],
            { cancelable: true }
        );
        return true; // 기본 뒤로가기 차단 (팝업 선택으로만 종료)
    }, [finish]);

    // 안드로이드 하드웨어 뒤로가기 → 확인 팝업
    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', confirmCancel);
            return () => sub.remove();
        }, [confirmCancel])
    );

    // [C123] WebView → 앱 결과 수신 (서버 return/cancel 페이지의 postMessage)
    const onMessage = useCallback((e) => {
        try {
            const data = JSON.parse(e.nativeEvent.data || '{}');
            if (data.result === 'success') finish('success');
            else if (data.result === 'cancel') finish('cancel');
        } catch (_) {}
    }, [finish]);

    const openExternal = useCallback(async (url) => {
        try {
            // intent://xxx#Intent;scheme=xxx;package=xxx;end 파싱
            // const matched = url.match(/scheme=(.+?);.*?package=(.+?);/);
    
            // intent:hdcardappcardansimclick://appcard?acctid=202507081524071225935149716821#Intent;package=com.hyundaicard.appcard;end
            // intent://pay?srCode=1717217#Intent;scheme=shinhan-sr-ansimclick;package=com.shcard.smartpay;end;
            // intent:hdcardappcardansimclick://appcard?acctid=...#Intent;package=com.hyundaicard.appcard;end;
    
            // hdcardappcardansimclick://hdcardappcardansimclick://appcard?acctid=202507081541574961126087778721
    
            // tauthlink:////sktauth?agentTID=DS250711143300192327&appToken=202507116Di9VzVKnmOc
    
            let intentUrl = url;
            let schemeMatch = intentUrl.match(/scheme=([a-zA-Z0-9\-\+\.]+);/);
            let packageMatch = intentUrl.match(/package=([a-zA-Z0-9\.\-_]+);/);
    
            let scheme = schemeMatch?.[1];
            let pkg = packageMatch?.[1];
    
            if (!scheme) {
                schemeMatch = intentUrl.match(/^intent:([a-zA-Z0-9\.\-\+]+):\/\//);
                scheme = schemeMatch?.[1];
            }
    
            let path = intentUrl.replace("intent:", "").replace(/^intent:\/\//, '').split('#Intent')[0];
            // 슬래시 정리
            path = path.replace(/^\/+/, '');
    
            let finalUrl = path;

            if (!path.startsWith(scheme + "://")) {
                finalUrl = `${scheme}://${path}`;
            }

            await Linking.openURL(finalUrl);

        } catch (e) {
            Alert.alert('앱 실행 실패', '해당 앱이 설치되어 있지 않습니다.');
        }
    }, []);

    // [C123] 결제완료 감지는 onMessage 주력. 여기선 외부 앱 스킴 처리 전용 + return/cancel 은 fallback 유지.
    const onShouldStart = useCallback((request) => {
        const url = request.url || '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // fallback: onMessage 미수신 환경 대비 URL 마커 감지도 유지
            if (url.includes('/v1/point/payment/return')) { finish('success'); return false; }
            if (url.includes('/v1/point/payment/cancel')) { finish('cancel'); return false; }
            return true; // 일반 결제창/카드사 web 로드 허용
        }
        // 비 http(s) 스킴(intent://, 카드사앱, 간편결제, 백신 등) → 외부 앱
        openExternal(url);
        return false;
    }, [finish, openExternal]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar style="dark" />
            <AppHeader title="결제하기" onBack={confirmCancel} />
            <WebView
                source={{ uri: String(paymentUrl) }}
                originWhitelist={['*']}
                onShouldStartLoadWithRequest={onShouldStart}
                onMessage={onMessage}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                onLoadEnd={() => setLoading(false)}
            />
            {loading && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    loadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
});
