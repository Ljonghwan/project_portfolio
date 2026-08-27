import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import AppHeader from '../../src/components/AppHeader';
import { authApi } from '../../src/api/auth';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

const TOGGLE_W = 40;
const TOGGLE_H = 22;
const THUMB_SIZE = 18;
const TRACK_PAD = 2;

const NOTIFICATION_ITEMS = [
    { key: 'notifyEvent', label: '이벤트/공지 알림' },
    { key: 'notifyPoint', label: '포인트 알림' },
    { key: 'notifyLike', label: '좋아요 알림' },
    { key: 'notifyEvaluation', label: '평가 알림' },
    { key: 'notifyMatchAccept', label: '매칭 신청 수락 알림' },
    { key: 'notifyMatchFilter', label: '매칭 필터 알림' },
    { key: 'notifyChat', label: '채팅 알림' },
    { key: 'notifyMarketing', label: '혜택, 마케팅 알림' },
];

function Toggle({ value, onToggle, disabled, testID }) {
    const offset = useSharedValue(value ? TOGGLE_W - THUMB_SIZE - TRACK_PAD : TRACK_PAD);
    const bgProgress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        offset.value = withTiming(value ? TOGGLE_W - THUMB_SIZE - TRACK_PAD : TRACK_PAD, { duration: 200 });
        bgProgress.value = withTiming(value ? 1 : 0, { duration: 200 });
    }, [value]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(bgProgress.value, [0, 1], [COLORS.grayF1, COLORS.primary]),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }],
    }));

    return (
        <Pressable testID={testID} onPress={onToggle} disabled={disabled}>
            <Animated.View style={[styles.toggleTrack, trackStyle]}>
                <Animated.View style={[styles.toggleThumb, thumbStyle]} />
            </Animated.View>
        </Pressable>
    );
}

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingKeys, setUpdatingKeys] = useState(new Set());

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await authApi.getNotificationSettings();
            setSettings(res.data);
        } catch {
            // 기본값 (전체 켜짐)
            const defaults = {};
            NOTIFICATION_ITEMS.forEach((item) => { defaults[item.key] = true; });
            setSettings(defaults);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = useCallback((key) => {
        setUpdatingKeys(prev => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
        setSettings((prev) => {
            if (!prev) return prev;
            const newValue = !prev[key];
            // updater 외부로 꺼내 side effect를 React 배치 밖에서 실행
            Promise.resolve().then(() => {
                authApi.updateNotificationSetting(key, newValue)
                    .catch(() => {
                        setSettings((p) => (p ? { ...p, [key]: !newValue } : p));
                    })
                    .finally(() => {
                        setUpdatingKeys(p => {
                            const n = new Set(p);
                            n.delete(key);
                            return n;
                        });
                    });
            });
            return { ...prev, [key]: newValue };
        });
    }, []);

    if (loading || !settings) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="dark" />
                <AppHeader title="알림설정" onBack={() => router.back()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="알림설정" onBack={() => router.back()} />

            <View style={styles.content}>
                <View style={styles.card}>
                    {NOTIFICATION_ITEMS.map((item) => (
                        <View key={item.key} style={styles.row}>
                            <Text style={styles.rowLabel} allowFontScaling={false}>
                                {item.label}
                            </Text>
                            <Toggle
                                testID={`notifications-toggle-${item.key}`}
                                value={!!settings[item.key]}
                                onToggle={() => handleToggle(item.key)}
                                disabled={updatingKeys.has(item.key)}
                            />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        gap: 32,
        ...Platform.select({
            ios: { boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' },
            android: { elevation: 4 },
        }),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    rowLabel: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    toggleTrack: {
        width: TOGGLE_W,
        height: TOGGLE_H,
        borderRadius: TOGGLE_H / 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: COLORS.white,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: { elevation: 2 },
        }),
    },
});
