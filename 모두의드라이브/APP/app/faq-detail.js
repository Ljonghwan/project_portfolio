import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../src/constants/config';
import AppHeader from '../src/components/AppHeader';
import { showToast } from '../src/utils/toast';
import { getFaqDetail } from '../src/api/faq';

export default function FaqDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { idx } = useLocalSearchParams();

    const [faq, setFaq] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetail = useCallback(async () => {
        const parsedIdx = Array.isArray(idx) ? Number(idx[0]) : Number(idx);
        if (!parsedIdx || isNaN(parsedIdx) || parsedIdx <= 0) {
            setLoading(false);
            return;
        }
        try {
            const data = await getFaqDetail(parsedIdx);
            setFaq(data);
        } catch {
            showToast('error', '내용을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [idx]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return (
        <View testID="faq-detail-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader onBack={() => router.back()} />

            <View style={styles.body}>
            {faq ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + SPACING.xl },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text allowFontScaling={false} style={styles.question}>
                        {faq.question}
                    </Text>
                    <Text allowFontScaling={false} style={styles.answer}>
                        {faq.answer}
                    </Text>
                </ScrollView>
            ) : !loading ? (
                <View style={styles.emptyWrap}>
                    <Text allowFontScaling={false} style={styles.emptyText}>
                        내용을 불러오지 못했습니다.
                    </Text>
                </View>
            ) : null}

            {loading && (
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    question: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: '#070B25',
        lineHeight: 30,
        padding: SPACING.xl,
    },
    answer: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.regular,
        color: '#070B25',
        lineHeight: 20,
        paddingHorizontal: SPACING.xl,
    },
    emptyWrap: {
        flex: 1,
        paddingTop: 80,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
});
