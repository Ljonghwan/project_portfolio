import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import WebView from 'react-native-webview';
import { authApi } from '../../src/api/auth';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

const buildTiptapHtml = (content, bottomPadding) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-user-select: none; user-select: none; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif;
      font-size: 14px;
      line-height: 22px;
      padding: ${SPACING.xl}px;
      padding-bottom: ${bottomPadding}px;
      -webkit-text-size-adjust: 100%;
    }
    img { max-width: 100% !important; height: auto !important; display: inline-block; }
    .element .tiptap { outline: none; }
    .element .tiptap p[style*="text-align: center"], .element .tiptap h1[style*="text-align: center"], .element .tiptap h2[style*="text-align: center"], .element .tiptap h3[style*="text-align: center"] { text-align: center; }
    .element .tiptap p[style*="text-align: right"], .element .tiptap h1[style*="text-align: right"], .element .tiptap h2[style*="text-align: right"], .element .tiptap h3[style*="text-align: right"] { text-align: right; }
    .element .tiptap h1 { font-size: 20px; font-weight: 700; color: ${COLORS.textPrimary}; margin-bottom: 12px; }
    .element .tiptap h2 { font-size: 18px; font-weight: 700; color: ${COLORS.textPrimary}; margin-bottom: 10px; }
    .element .tiptap h3 { font-size: 16px; font-weight: 600; color: ${COLORS.textPrimary}; margin-bottom: 8px; }
    .element .tiptap p { margin-top: 0; margin-bottom: 8px; }
    .element .tiptap ul, .element .tiptap ol { padding-left: 16px; }
    .element .tiptap li { margin-bottom: 4px; }
    .element .tiptap strong { font-weight: 700; }
    .element .tiptap a { color: ${COLORS.primary}; }
  </style>
</head>
<body>
  <div class="element"></div>
  <script type="module">
    import { Editor } from 'https://esm.sh/@tiptap/core'
    import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
    import Image from 'https://esm.sh/@tiptap/extension-image'
    import TextAlign from 'https://esm.sh/@tiptap/extension-text-align'

    new Editor({
      element: document.querySelector('.element'),
      extensions: [
        StarterKit,
        Image.configure({ inline: true, allowBase64: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: ${JSON.stringify(content || '<p>약관 내용이 준비 중입니다.</p>')},
      editable: false,
      onCreate() {
        window.ReactNativeWebView.postMessage('TIPTAP_READY');
      },
    })
  </script>
</body>
</html>
`;

export default function TermDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { title, idx } = useLocalSearchParams();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
        loadTermDetail();
    }, []);

    const loadTermDetail = async () => {
        try {
            const res = await authApi.getTermDetail(idx);
            const term = res.data;
            setContent(term?.comment || '');
        } catch (e) {
            setContent('<p>약관 내용을 불러올 수 없습니다.</p>');
        } finally {
            setLoading(false);
        }
    };

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
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.backBtnWrap}
                    testID="term-detail-back-btn"
                >
                    <Image source={require('../../assets/icons/arrow-back.svg')} style={{ width: 24, height: 24 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1} allowFontScaling={false}>{title || '약관 상세'}</Text>
            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64,
        paddingHorizontal: SPACING.xl,
        gap: 12,
    },
    backBtnWrap: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
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
