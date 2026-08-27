import { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { authApi } from '../../src/api/auth';
import { matchApi } from '../../src/api/match';
import { getPointBalance } from '../../src/api/point';
import usePopupStore from '../../src/store/popupStore';
import AppHeader from '../../src/components/AppHeader';
import { COLORS } from '../../src/constants/config';
import { buildTiptapHtml } from '../../src/utils/tiptapHtml';

export default function WithdrawTermsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const showPopup = usePopupStore((s) => s.show);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await authApi.getWithdrawTerms();
                const term = res.data;
                setContent(term?.comment || '');
            } catch (e) {
                setContent('<p>약관 내용을 불러올 수 없습니다.</p>');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const [checking, setChecking] = useState(false);
    const showLoading = loading || (content !== null && !editorReady);
    const bottomPadding = insets.bottom + 20;

    const handleMessage = useCallback((event) => {
        if (event.nativeEvent.data === 'TIPTAP_READY') {
            setEditorReady(true);
        }
    }, []);

    const handleWithdraw = useCallback(async () => {
        if (checking) return;
        setChecking(true);

        // 진행중 매칭 가드
        try {
            const res = await matchApi.getActiveCount();
            const activeCount = res.data?.count ?? 0;
            if (activeCount > 0) {
                showPopup('confirm', {
                    title: '현재 진행중인 매칭이 있습니다.\n매칭 취소 후 탈퇴 가능합니다.',
                    confirmText: '확인',
                });
                setChecking(false);
                return;
            }
        } catch (e) {
            // 조회 실패 시 진행 (서버 장애로 탈퇴 자체를 막지 않음)
        }

        try {
            const balance = await getPointBalance();
            const paidBalance = balance?.paid || 0;
            if (paidBalance > 0) {
                router.navigate({ pathname: '/settings/withdraw-refund', params: { paidBalance } });
            } else {
                router.navigate('/settings/withdraw-reason');
            }
        } catch {
            router.navigate('/settings/withdraw-reason');
        } finally {
            setChecking(false);
        }
    }, [checking, router]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader
                testIDPrefix="withdraw-terms"
                title="회원 탈퇴하기"
                onBack={() => router.back()}
                rightLabel="탈퇴하기"
                rightDisabled={checking}
                onRightPress={handleWithdraw}
            />

            <View style={styles.body}>
                {content !== null && (
                    <WebView
                        source={{ html: buildTiptapHtml(content, bottomPadding) }}
                        style={[styles.webview, !editorReady && styles.hidden]}
                        originWhitelist={['*']}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        scrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                        scalesPageToFit={false}
                        onMessage={handleMessage}
                    />
                )}
                {showLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    body: {
        flex: 1,
    },
    webview: {
        flex: 1,
        opacity: 0.99,
    },
    hidden: {
        opacity: 0,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
});
