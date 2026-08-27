import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../src/constants/config';
import AppHeader from '../src/components/AppHeader';
import { showToast } from '../src/utils/toast';
import { getNoticeList } from '../src/api/notice';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
}

export default function NoticeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [notices, setNotices] = useState([]);

    const fetchNotices = useCallback(async () => {
        try {
            const data = await getNoticeList();
            setNotices(data);
        } catch {
            showToast('error', '공지사항을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    return (
        <View testID="notice-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="공지사항" onBack={() => router.back()} />

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + SPACING.xl },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {notices.length === 0 ? (
                        <View testID="notice-empty" style={styles.emptyWrap}>
                            <Text allowFontScaling={false} style={styles.emptyText}>
                                등록된 공지사항이 없습니다.
                            </Text>
                        </View>
                    ) : (
                        notices.map((item) => (
                            <TouchableOpacity
                                key={item.idx}
                                testID={`notice-item-${item.idx}`}
                                activeOpacity={0.7}
                                onPress={() => router.navigate({ pathname: '/notice-detail', params: { idx: String(item.idx) } })}
                                style={styles.item}
                            >
                                <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <Text allowFontScaling={false} style={styles.date}>
                                    {formatDate(item.createdAt)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    item: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    title: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        color: '#231F20',
        lineHeight: 24,
    },
    date: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#969698',
        lineHeight: 20,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
});
