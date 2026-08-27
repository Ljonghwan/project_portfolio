import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, STORAGE_URL } from '../src/constants/config';
import AppHeader from '../src/components/AppHeader';
import { showToast } from '../src/utils/toast';
import { getInquiryList } from '../src/api/inquiry';
import useConfigStore from '../src/store/configStore';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
}

export default function InquiryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [inquiries, setInquiries] = useState([]);
    const [expandedIdx, setExpandedIdx] = useState(null);

    const categories = useConfigStore((s) => s.inquiryCategories);

    const fetchList = useCallback(async () => {
        try {
            const data = await getInquiryList();
            console.log('inquiry/list', data?.[0]?.images);
            setInquiries(data || []);
        } catch {
            showToast('error', '문의 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchList();
        }, [fetchList])
    );

    const handleItemPress = useCallback((item) => {
        // if (item.status !== 'replied') return;
        setExpandedIdx((prev) => (prev === item.idx ? null : item.idx));
    }, []);

    const RegisterButton = (
        <TouchableOpacity
            testID="inquiry-register-btn"
            activeOpacity={0.8}
            onPress={() => router.navigate('/inquiry-create')}
            style={styles.registerBtn}
        >
            <Text allowFontScaling={false} style={styles.registerBtnText}>
                문의 등록
            </Text>
        </TouchableOpacity>
    );

    return (
        <View testID="inquiry-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader
                title="1:1 문의"
                onBack={() => router.back()}
                rightComponent={RegisterButton}
            />

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
            ) : inquiries.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text allowFontScaling={false} style={styles.emptyText}>
                        등록된 문의가 없습니다.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + SPACING.xl },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchList} />}
                >
                    {inquiries.map((item) => {
                        const isReplied = item.status === 'replied';
                        const isExpanded = expandedIdx === item.idx;

                        return (
                            <TouchableOpacity
                                key={item.idx}
                                testID={`inquiry-item-${item.idx}`}
                                activeOpacity={isReplied ? 0.7 : 1}
                                onPress={() => handleItemPress(item)}
                                style={[
                                    styles.item,
                                    isExpanded && styles.itemExpanded,
                                ]}
                            >
                                {/* 날짜 + 상태 뱃지 */}
                                <View style={styles.itemTopRow}>
                                    <Text allowFontScaling={false} style={styles.itemDate}>
                                        작성일 {formatDate(item.createdAt)}
                                    </Text>
                                    <View style={[styles.badge, isReplied ? styles.badgeReplied : styles.badgePending]}>
                                        <Text allowFontScaling={false} style={styles.badgeText}>
                                            {isReplied ? '답변완료' : '미답변'}
                                        </Text>
                                    </View>
                                </View>

                                {/* 제목 */}
                                <Text allowFontScaling={false} style={styles.itemTitle} numberOfLines={isExpanded ? undefined : 2} ellipsizeMode="tail">
                                    {categories?.find((c) => c.key === item.category)?.label}
                                </Text>

                                {/* 펼친 상태 — 답변완료만 */}
                                {isExpanded && (
                                    <View style={styles.expandBody}>

                                        <Text allowFontScaling={false} style={styles.contentText}>
                                            {item.content}
                                        </Text>

                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            {item?.images?.map((image, i) => {
                                                return (
                                                    <Image key={image.imageUrl} source={{ uri: STORAGE_URL + image.imageUrl }} style={{ width: '30%', aspectRatio: 1, borderRadius: 8 }} transition={100}/>
                                                )
                                            })}
                                        </View>

                                        {/* 답변 영역 */}
                                        <View style={styles.replyRow}>
                                            <Ionicons
                                                name="return-down-forward"
                                                size={24}
                                                color={COLORS.textPrimary}
                                            />
                                            {isReplied ? (
                                                <View style={styles.replyBody}>
                                                    <Text allowFontScaling={false} style={styles.replyText}>
                                                        {item.reply}
                                                    </Text>
                                                    <Text allowFontScaling={false} style={styles.replyDate}>
                                                        작성일 {formatDate(item.repliedAt)}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.replyBody}>
                                                    <Text allowFontScaling={false} style={[styles.replyText, { color: COLORS.grayMedium }]}>
                                                        최대한 빠른 시일 내에 답변 드리겠습니다.
                                                    </Text>
                                                </View>
                                            )}
                                            
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
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
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    registerBtn: {
        backgroundColor: '#384FEE',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    registerBtnText: {
        fontSize: 13,
        fontFamily: FONTS.extraBold,
        color: '#FFFFFF',
    },
    item: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    itemExpanded: {
        backgroundColor: '#F5F5F5',
    },
    itemTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemDate: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
    badge: {
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    badgePending: {
        backgroundColor: '#C5C5CD',
    },
    badgeReplied: {
        backgroundColor: '#070B25',
    },
    badgeText: {
        fontSize: 11,
        fontFamily: FONTS.extraBold,
        color: '#FFFFFF',
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        color: '#231F20',
        lineHeight: 24,
    },
    expandBody: {
        marginTop: 12,
        gap: 16,
    },
    contentText: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#070B25',
        lineHeight: 20,
    },
    replyRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    replyBody: {
        flex: 1,
        gap: 4,
        marginTop: 4,
    },
    replyText: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#070B25',
        lineHeight: 20,
    },
    replyDate: {
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
});
