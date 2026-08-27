import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import AppHeader from '../../src/components/AppHeader';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { getPointHistory } from '../../src/api/point';
import usePointStore from '../../src/store/pointStore';
import { showToast } from '../../src/utils/toast';

const FILTER_TABS = [
    { key: 'all', label: '전체' },
    { key: 'charge', label: '충전' },
    { key: 'earn', label: '획득' },
    { key: 'spend', label: '사용' },
];

// 노쇼 취소 환불(referenceType='match')은 포인트 복구(양수/초록),
// 포인트·회원탈퇴 환불 신청(referenceType='refund')은 차감(음수/빨강)
function getBadgeStyle(type, referenceType) {
    if (type === 'refund' && referenceType === 'match') {
        return { bg: 'rgba(79,195,79,0.2)', text: '#4FC34F', label: '환불' };
    }
    switch (type) {
        case 'charge':
            return { bg: 'rgba(184,193,255,0.2)', text: '#384FEE', label: '충전' };
        case 'earn':
            return { bg: 'rgba(79,195,79,0.2)', text: '#4FC34F', label: '획득' };
        case 'refund':
            return { bg: 'rgba(224,46,46,0.2)', text: '#E02E2E', label: '환불' };
        case 'spend':
        case 'penalty':
            return { bg: 'rgba(224,46,46,0.2)', text: '#E02E2E', label: '사용' };
        default:
            return { bg: 'rgba(184,193,255,0.2)', text: '#384FEE', label: '충전' };
    }
}

function formatAmount(type, amount, referenceType) {
    const isNegative = type === 'spend' || type === 'penalty'
        || (type === 'refund' && referenceType !== 'match');
    const prefix = isNegative ? '-' : '+';
    return `${prefix}${Math.abs(amount).toLocaleString()}P`;
}

export default function PointIndexScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { total, paid, free, refreshBalance } = usePointStore();

    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchHistory = useCallback(async (filter) => {
        try {
            setLoading(true);
            const historyData = await getPointHistory(filter);
            setHistory(historyData);
        } catch (e) {
            showToast('error', '포인트 내역을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        refreshBalance();
    }, []));

    useEffect(() => {
        fetchHistory(activeFilter);
    }, [activeFilter, fetchHistory]);

    const balance = { total, paid, free };

    const handleFilterChange = (key) => {
        if (key === activeFilter) return;
        setActiveFilter(key);
    };

    const totalColor = balance.total >= 0 ? '#FFC72C' : '#FF3B3B';
    const paidColor = balance.paid >= 0 ? COLORS.white : '#FF3B3B';
    const freeColor = balance.free >= 0 ? COLORS.white : '#FF3B3B';

    return (
        <View testID="mypoint-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title="내 포인트" onBack={() => router.back()} />

            {/* Blue section */}
            <View style={styles.blueSection}>
                <View style={styles.card}>
                    {/* Left: 보유포인트 */}
                    <View style={styles.cardLeft}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Image
                                source={require('../../assets/icons/mypage-money2.svg')}
                                style={{ width: 24, height: 24 }}
                                contentFit="contain"
                            />
                            <Text allowFontScaling={false} style={styles.cardLabel}>보유포인트</Text>
                        </View>
                        <Text allowFontScaling={false} style={[styles.cardTotal, { color: totalColor }]}>
                            {balance.total.toLocaleString()}P
                        </Text>
                    </View>

                    {/* Vertical divider */}
                    <View style={styles.cardDivider} />

                    {/* Right: 유료/무료 */}
                    <View style={styles.cardRight}>
                        <Text allowFontScaling={false} style={[styles.cardSubText, { color: paidColor }]}>
                            유료 포인트 {balance.paid.toLocaleString()}P
                        </Text>
                        <Text allowFontScaling={false} style={[styles.cardSubText, { color: freeColor }]}>
                            무료 포인트 {balance.free.toLocaleString()}P
                        </Text>
                    </View>
                </View>

                {/* 충전하기 button */}
                <TouchableOpacity
                    testID="mypoint-charge-btn"
                    style={styles.chargeBtn}
                    activeOpacity={0.7}
                    onPress={() => router.navigate('/point/charge')}
                >
                    <Text allowFontScaling={false} style={styles.chargeBtnText}>충전하기</Text>
                </TouchableOpacity>
            </View>

            {/* Filter tabs */}
            <View style={styles.tabRow}>
                {FILTER_TABS.map((tab) => {
                    const isActive = activeFilter === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            testID={`mypoint-tab-${tab.key}`}
                            onPress={() => handleFilterChange(tab.key)}
                            style={[styles.tab, isActive && styles.tabActive]}
                            activeOpacity={0.7}
                        >
                            <Text
                                allowFontScaling={false}
                                style={[styles.tabText, isActive && styles.tabTextActive]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Transaction list */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text allowFontScaling={false} style={styles.emptyText}>포인트 내역이 없습니다.</Text>
                </View>
            ) : (
                <ScrollView
                    testID="mypoint-list"
                    style={styles.listWrap}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: SPACING.xl + insets.bottom },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {history.map((item, idx) => {
                        const badge = getBadgeStyle(item.type, item.referenceType);
                        const isNegative = item.type === 'spend' || item.type === 'penalty'
                            || (item.type === 'refund' && item.referenceType !== 'match');
                        return (
                            <View key={item.idx ?? idx} style={styles.txCard}>
                                <View style={styles.txTopRow}>
                                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                        <Text allowFontScaling={false} style={[styles.badgeText, { color: badge.text }]}>
                                            {badge.label}
                                        </Text>
                                    </View>
                                    <Text allowFontScaling={false} style={styles.txDate}>
                                        {dayjs(item.createdAt).format('YYYY.MM.DD HH:mm')}
                                    </Text>
                                </View>
                                <View style={styles.txBottomRow}>
                                    <Text allowFontScaling={false} style={styles.txReason} numberOfLines={1}>
                                        {item.reason}
                                    </Text>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.txAmount,
                                            isNegative && styles.txAmountNegative,
                                        ]}
                                    >
                                        {formatAmount(item.type, item.amount, item.referenceType)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
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

    /* Blue section */
    blueSection: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xl,
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.primaryDeep,
        borderRadius: 12,
        padding: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    cardLeft: {
        flex: 1,
    },
    cardLabel: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xs,
        lineHeight: 16,
        color: COLORS.white,
    },
    cardTotal: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xxl,
        lineHeight: 36,
    },
    cardDivider: {
        width: 1,
        backgroundColor: COLORS.primary,
        alignSelf: 'stretch',
        marginHorizontal: SPACING.lg,
    },
    cardRight: {
        flex: 1,
        gap: SPACING.xs,
    },
    cardSubText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        color: COLORS.white,
    },
    chargeBtn: {
        marginTop: SPACING.lg,
        width: 100,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chargeBtnText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
    },

    /* Filter tabs */
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.xl,
        gap: SPACING.xxl,
        backgroundColor: COLORS.white,
    },
    tab: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: '#C5C5CD',
    },
    tabTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },

    /* List */
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
    },
    listWrap: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
        gap: SPACING.sm,
    },

    /* Transaction card */
    txCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    txTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 4,
    },
    badgeText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.xs,
    },
    txDate: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.xs,
        color: '#969698',
    },
    txBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    txReason: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: SPACING.sm,
    },
    txAmount: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    txAmountNegative: {
        color: COLORS.error,
    },
});
