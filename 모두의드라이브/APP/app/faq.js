import { useState, useEffect, useCallback, useRef } from 'react';
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
import { getFaqCategories, getFaqList } from '../src/api/faq';

const ALL_CATEGORY = { idx: null, name: '전체' };

export default function FaqScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([ALL_CATEGORY]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('');
    const reqSeqRef = useRef(0);

    const fetchInitial = useCallback(async () => {
        try {
            const [cats, faqList] = await Promise.all([
                getFaqCategories(),
                getFaqList(),
            ]);
            setCategories([ALL_CATEGORY, ...cats]);
            setFaqs(faqList);
        } catch {
            showToast('error', '데이터를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitial();
    }, [fetchInitial]);

    const handleCategorySelect = useCallback(async (categoryIdx) => {
        if (selectedCategory === categoryIdx) return;
        setSelectedCategory(categoryIdx);
        setListLoading(true);
        const seq = ++reqSeqRef.current;
        try {
            const data = await getFaqList(categoryIdx);
            if (seq !== reqSeqRef.current) return;
            setFaqs(data);
        } catch {
            showToast('error', '목록을 불러오지 못했습니다.');
        } finally {
            if (seq === reqSeqRef.current) setListLoading(false);
        }
    }, [selectedCategory]);

    const handleScroll = useCallback((e) => {
        const y = e.nativeEvent.contentOffset.y;
        // 제목 영역(padding 20 + lineHeight 30 = 50px) 지나면 헤더 타이틀 노출
        setHeaderTitle(y > 50 ? '자주 묻는 질문' : '');
    }, []);

    return (
        <View testID="faq-screen" style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <AppHeader title={headerTitle} onBack={() => router.back()} />

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
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {/* 제목 */}
                    <Text allowFontScaling={false} style={styles.screenTitle}>
                        자주 묻는 질문
                    </Text>

                    {/* 카테고리 칩 */}
                    <View style={styles.chipRow}>
                        {categories.map((cat) => {
                            const isActive = selectedCategory === cat.idx;
                            return (
                                <TouchableOpacity
                                    key={cat.idx ?? 'all'}
                                    testID={`faq-category-${cat.idx ?? 'all'}`}
                                    activeOpacity={0.7}
                                    onPress={() => handleCategorySelect(cat.idx)}
                                    style={[styles.chip, isActive && styles.chipActive]}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.chipText, isActive && styles.chipTextActive]}
                                    >
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* FAQ 리스트 */}
                    {listLoading ? (
                        <View style={styles.listLoadingWrap}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        </View>
                    ) : faqs.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text allowFontScaling={false} style={styles.emptyText}>
                                등록된 질문이 없습니다.
                            </Text>
                        </View>
                    ) : (
                        faqs.map((item, index) => (
                            <TouchableOpacity
                                key={item.idx}
                                testID={`faq-item-${item.idx}`}
                                activeOpacity={0.7}
                                onPress={() =>
                                    router.navigate({
                                        pathname: '/faq-detail',
                                        params: { idx: String(item.idx) },
                                    })
                                }
                                style={[
                                    styles.faqItem,
                                    index === 0 && styles.faqItemFirst,
                                ]}
                            >
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.qLabel, index === 0 && styles.qLabelFirst]}
                                >
                                    Q
                                </Text>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.question}
                                    numberOfLines={2}
                                >
                                    {item.question}
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
    screenTitle: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.extraBold,
        color: '#070B25',
        lineHeight: 30,
        padding: SPACING.xl,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.sm,
    },
    chip: {
        borderWidth: 1,
        borderColor: '#DDDDDD',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: 100,
    },
    chipActive: {
        backgroundColor: '#070B25',
        borderColor: '#070B25',
    },
    chipText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: '#969698',
    },
    chipTextActive: {
        color: COLORS.white,
    },
    listLoadingWrap: {
        paddingTop: 40,
        alignItems: 'center',
    },
    emptyWrap: {
        paddingTop: 80,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: '#969698',
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        gap: SPACING.sm,
    },
    faqItemFirst: {
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        marginTop: 8,
    },
    qLabel: {
        width: 24,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: '#686869',
        lineHeight: 24,
    },
    qLabelFirst: {
        fontFamily: FONTS.extraBold,
        color: '#070B25',
    },
    question: {
        flex: 1,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.regular,
        color: '#070B25',
        lineHeight: 24,
    },
});
