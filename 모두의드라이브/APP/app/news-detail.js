import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import WebView from 'react-native-webview';
import AppHeader from '../src/components/AppHeader';
import { COLORS, FONTS, STORAGE_URL } from '../src/constants/config';
import { buildTiptapHtml } from '../src/utils/tiptapHtml';
import { getEventDetail } from '../src/api/event';
import { showToast } from '../src/utils/toast';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
}

export default function NewsDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { idx } = useLocalSearchParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorReady, setEditorReady] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const data = await getEventDetail(Number(idx));
            setEvent(data);
        } catch {
            showToast('error', '이벤트 정보를 불러오지 못했습니다.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [idx]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleMessage = useCallback((e) => {
        if (e.nativeEvent.data === 'TIPTAP_READY') {
            setEditorReady(true);
        }
    }, []);

    const bottomPadding = insets.bottom + 20;
    const showLoading = loading || (event !== null && !editorReady);

    return (
        <View testID="news-detail-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="상세보기" onBack={() => router.back()} />

            {event !== null && (
                <View style={styles.header}>
                    <Text allowFontScaling={false} style={styles.date}>
                        {formatDate(event.createdAt)}
                    </Text>
                    <Text allowFontScaling={false} style={styles.title}>
                        {event.title}
                    </Text>
                </View>
            )}

            {/* {event?.mainImageUrl ? (
                <Image
                    source={{ uri: STORAGE_URL + event.mainImageUrl }}
                    style={styles.mainImage}
                    contentFit="cover"
                />
            ) : null} */}

            <View style={styles.body}>
                {event !== null && (
                    <WebView
                        source={{ html: buildTiptapHtml(event.content, bottomPadding) }}
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
    mainImage: {
        width: '100%',
        height: 200,
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
