import { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reviewApi } from '../../src/api/review';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../src/constants/config';
import { showToast } from '../../src/utils/toast';
import usePlaceSearchStore from '../../src/store/placeSearchStore';

export default function ReviewPlaceSearchScreen() {
    const { index } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [query, setQuery] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [focused, setFocused] = useState(false);
    const requestIdRef = useRef(0);

    const targetIndex = Number(index);

    const runSearch = useCallback(async (q) => {
        const id = ++requestIdRef.current;
        setLoading(true);
        try {
            const res = await reviewApi.searchPlace(q, 1);
            if (id !== requestIdRef.current) return;
            const data = res.data || {};
            const list = data.items || [];
            setItems(list);
            setSearched(true);
        } catch {
            if (id !== requestIdRef.current) return;
            showToast('error', '장소 검색에 실패했습니다.');
        } finally {
            if (id !== requestIdRef.current) return;
            setLoading(false);
        }
    }, []);

    function doSearch() {
        const q = query.trim();
        if (!q) return;
        Keyboard.dismiss();
        runSearch(q);
    }

    // 입력 디바운스 (200ms) — 자동 검색
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setItems([]);
            setSearched(false);
            return;
        }
        const timer = setTimeout(() => {
            runSearch(q);
        }, 200);
        return () => clearTimeout(timer);
    }, [query, runSearch]);

    function handleSelect(item) {
        if (isNaN(targetIndex)) {
            router.back();
            return;
        }
        usePlaceSearchStore.getState().setPending({
            index: targetIndex,
            place: {
                placeName: item.title,
                address: item.address || '',
                roadAddress: item.roadAddress || '',
                lat: item.lat ?? null,
                lng: item.lng ?? null,
            },
        });
        router.back();
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    testID="review-place-search-back-btn"
                >
                    <Image
                        source={require('../../assets/icons/arrow-back.svg')}
                        style={styles.backIcon}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>장소 검색</Text>
            </View>

            {/* 검색창 */}
            <View style={styles.searchInputRow}>
                <View style={[styles.searchInputBox, focused && styles.searchInputBoxFocused]}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="장소명을 입력하세요"
                        placeholderTextColor={COLORS.grayCC}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        onSubmitEditing={doSearch}
                        allowFontScaling={false}
                        autoFocus
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        testID="review-place-search-input"
                    />
                    <View style={styles.searchIcon}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        ) : (
                            <Ionicons name="search" size={20} color={COLORS.grayMedium} />
                        )}
                    </View>
                </View>
            </View>

            {/* 결과 리스트 */}
            <View style={styles.listWrap}>
                {loading && items.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    </View>
                ) : (
                    <FlashList
                        data={items}
                        keyExtractor={(item, i) => `${item.title}_${item.mapx || ''}_${i}`}
                        estimatedItemSize={80}
                        renderItem={({ item, index: i }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                                activeOpacity={0.7}
                                testID={`review-place-search-result-${i}`}
                            >
                                <Text style={styles.resultTitle} allowFontScaling={false} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {!!item.category && (
                                    <Text style={styles.resultCategory} allowFontScaling={false} numberOfLines={1}>
                                        {item.category}
                                    </Text>
                                )}
                                {!!(item.roadAddress || item.address) && (
                                    <Text style={styles.resultAddr} allowFontScaling={false} numberOfLines={1}>
                                        {item.roadAddress || item.address}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            searched && !loading ? (
                                <Text style={styles.empty} allowFontScaling={false}>검색 결과가 없습니다.</Text>
                            ) : !searched ? (
                                <Text style={styles.empty} allowFontScaling={false}>장소명을 입력해 주세요.</Text>
                            ) : null
                        }
                        ListFooterComponent={
                            <View style={{ height: insets.bottom + SPACING.xl }} />
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.white },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        gap: 12,
    },
    backBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    backIcon: { width: 24, height: 24 },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.h3,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 30,
    },
    searchInputRow: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    searchInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.grayEE,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInputBoxFocused: {
        borderColor: COLORS.primary,
    },
    searchInput: {
        flex: 1,
        height: 48,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
    },
    searchIcon: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    listWrap: { flex: 1 },
    center: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    resultItem: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayEE,
        gap: 4,
    },
    resultTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.semiBold,
        color: COLORS.black,
        lineHeight: 24,
    },
    resultCategory: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: COLORS.primary,
        lineHeight: 16,
    },
    resultAddr: {
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
        lineHeight: 20,
    },
    empty: {
        textAlign: 'center',
        paddingVertical: 40,
        fontSize: FONT_SIZE.body,
        fontFamily: FONTS.regular,
        color: COLORS.textMedium,
    },
});
