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
import { Image } from 'expo-image';
import { COLORS, FONTS, FONT_SIZE, SPACING, STORAGE_URL } from '../src/constants/config';
import AppHeader from '../src/components/AppHeader';
import { showToast } from '../src/utils/toast';
import { getEventList } from '../src/api/event';

export default function NewsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    const fetchEvents = useCallback(async () => {
        try {
            const data = await getEventList();
            setEvents(data);
        } catch {
            showToast('error', '이벤트 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handlePress = (item) => {
        router.navigate({ pathname: '/news-detail', params: { idx: String(item.idx) } });
    };

    return (
        <View testID="news-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="새소식 · 이벤트" onBack={() => router.back()} />

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
                    {events.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text allowFontScaling={false} style={styles.emptyText}>
                                등록된 이벤트가 없습니다.
                            </Text>
                        </View>
                    ) : (
                        events.map((item) => (
                            <TouchableOpacity
                                key={item.idx}
                                testID={`news-event-${item.idx}`}
                                activeOpacity={0.7}
                                onPress={() => handlePress(item)}
                            >
                                <Image
                                    source={item.imageUrl ? { uri: STORAGE_URL + item.imageUrl } : null}
                                    style={styles.eventImage}
                                    contentFit="cover"
                                />
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    eventImage: {
        width: '100%',
        height: 84,
        borderRadius: 8,
        backgroundColor: COLORS.borderLight,
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
