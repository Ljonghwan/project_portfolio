import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { authApi } from '../../src/api/auth';
import AppHeader from '../../src/components/AppHeader';
import { COLORS } from '../../src/constants/config';
import { buildTiptapHtml } from '../../src/utils/tiptapHtml';

// TERM_TB type: 2=개인정보처리방침
const TERM_TYPE = 2;

export default function PrivacyScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await authApi.getTerms();
                const terms = res.data || [];
                const term = Array.isArray(terms)
                    ? terms.find(t => t.type === TERM_TYPE)
                    : null;
                setContent(term?.comment || '');
            } catch {
                setContent('<p>약관 내용을 불러올 수 없습니다.</p>');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const showLoading = loading || (content !== null && !editorReady);
    const bottomPadding = insets.bottom + 20;

    const handleMessage = useCallback((event) => {
        if (event.nativeEvent.data === 'TIPTAP_READY') {
            setEditorReady(true);
        }
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="개인정보 처리방침" onBack={() => router.back()} />
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
