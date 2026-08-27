import { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AppHeader from '../../src/components/AppHeader';
import matchAlarmApi from '../../src/api/matchAlarm';
import { showToast } from '../../src/utils/toast';
import useConfigStore from '../../src/store/configStore';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';

function buildSummary(alarm, getLabel) {
    const parts = [];
    if (alarm.matchType) parts.push(getLabel('matchTypes', alarm.matchType));
    if (alarm.regionSido) {
        const region = [alarm.regionSido, alarm.regionSigungu].filter(Boolean).join(' ');
        parts.push(region);
    }
    if (alarm.age) parts.push(getLabel('filterAges', alarm.age));
    if (alarm.gender) parts.push(getLabel('filterGenders', alarm.gender));
    return parts.join(', ');
}

export default function MatchAlarmScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const getLabel = useConfigStore(s => s.getLabel);
    const isFirstLoad = useRef(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alarms, setAlarms] = useState([]);
    const [deletingIdx, setDeletingIdx] = useState(null);

    const loadAlarms = useCallback(async () => {
        try {
            const res = await matchAlarmApi.getList();
            setAlarms(res.data || []);
        } catch (_) {
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (isFirstLoad.current) {
                setLoading(true);
                isFirstLoad.current = false;
            }
            loadAlarms();
        }, [loadAlarms])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAlarms();
        setRefreshing(false);
    }, [loadAlarms]);

    const handleDelete = useCallback(async (idx) => {
        if (deletingIdx) return;
        setDeletingIdx(idx);
        try {
            await matchAlarmApi.remove(idx);
            setAlarms((prev) => prev.filter((a) => a.idx !== idx));
        } catch (_) {
            showToast('error', '삭제에 실패했습니다.');
        } finally {
            setDeletingIdx(null);
        }
    }, [deletingIdx]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="매칭 알림 설정" onBack={() => router.back()} />

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: SPACING.xl + insets.bottom },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                >
                    {/* 알림 조건 추가 카드 */}
                    <Pressable
                        testID="match-alarm-add-btn"
                        style={styles.addCard}
                        onPress={() => router.navigate('/settings/match-alarm-add')}
                    >
                        <View style={styles.addCardContent}>
                            <Text style={styles.addCardTitle} allowFontScaling={false}>
                                알림 조건 추가하기
                            </Text>
                            <Text style={styles.addCardDesc} allowFontScaling={false}>
                                해당 매칭이 등록되면 알림을 보내드립니다.
                            </Text>
                        </View>
                        <Image
                            source={require('../../assets/icons/chevron-right.svg')}
                            style={styles.chevronIcon}
                            contentFit="contain"
                        />
                    </Pressable>

                    {/* 알림 목록 */}
                    {alarms.length > 0 && (
                        <View style={styles.listWrap}>
                            {alarms.map((alarm) => (
                                <View
                                    key={alarm.idx}
                                    testID={`match-alarm-item-${alarm.idx}`}
                                    style={styles.alarmItem}
                                >
                                    <Text style={styles.alarmText} allowFontScaling={false} numberOfLines={1}>
                                        {buildSummary(alarm, getLabel)}
                                    </Text>
                                    <Pressable
                                        testID={`match-alarm-delete-${alarm.idx}`}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        onPress={() => handleDelete(alarm.idx)}
                                        disabled={deletingIdx === alarm.idx}
                                    >
                                        {deletingIdx === alarm.idx ? (
                                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                                        ) : (
                                            <Image
                                                source={require('../../assets/icons/close-chip2.svg')}
                                                style={styles.deleteIcon}
                                                contentFit="contain"
                                            />
                                        )}
                                    </Pressable>
                                </View>
                            ))}
                        </View>
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
    scrollContent: {
        padding: SPACING.xl,
        gap: SPACING.xl,
    },

    // 추가 카드
    addCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        gap: SPACING.xl,
    },
    addCardContent: {
        flex: 1,
        gap: 4,
    },
    addCardTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    addCardDesc: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMedium,
    },
    chevronIcon: {
        width: 24,
        height: 24,
    },

    // 알림 목록
    listWrap: {
        gap: SPACING.sm,
    },
    alarmItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 52,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
    },
    alarmText: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    deleteIcon: {
        width: 24,
        height: 24,
    },
});
