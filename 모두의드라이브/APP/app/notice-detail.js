import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import AppHeader from '../src/components/AppHeader';
import { COLORS, FONTS } from '../src/constants/config';
import { buildTiptapHtml } from '../src/utils/tiptapHtml';
import { getNoticeDetail } from '../src/api/notice';
import { showToast } from '../src/utils/toast';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
}

export default function NoticeDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { idx } = useLocalSearchParams();

    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorReady, setEditorReady] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const data = await getNoticeDetail(Number(idx));
            setNotice(data);
        } catch {
            showToast('error', '공지사항을 불러오지 못했습니다.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [idx]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleMessage = useCallback((event) => {
        if (event.nativeEvent.data === 'TIPTAP_READY') {
            setEditorReady(true);
        }
    }, []);

    const bottomPadding = insets.bottom + 20;
    const showLoading = loading || (notice !== null && !editorReady);

    return (
        <View testID="notice-detail-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="상세보기" onBack={() => router.back()} />

            {notice !== null && (
                <View style={styles.header}>
                    <Text allowFontScaling={false} style={styles.date}>
                        {formatDate(notice.createdAt)}
                    </Text>
                    <Text allowFontScaling={false} style={styles.title}>
                        {notice.title}
                    </Text>
                </View>
            )}

            <View style={styles.body}>
                {notice !== null && (
                    <WebView
                        source={{ html: buildTiptapHtml(notice.content, bottomPadding) }}
                        style={[styles.webview, !editorReady && styles.hidden]}
                        originWhitelist={['about:blank']}
                        onShouldStartLoadWithRequest={(request) => {
                            if (request.url === 'about:blank') return true;
                            Linking.openURL(request.url);
                            return false;
                        }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        scrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                        scalesPageToFit={false}
                        onMessage={handleMessage}
                        onError={() => setEditorReady(true)}
                        onHttpError={() => setEditorReady(true)}
                    />
                )}
                
            </View>
            {showLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        gap: 20,
    },
    date: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#969698',
        lineHeight: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: FONTS.extraBold,
        color: '#231F20',
        lineHeight: 30,
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
