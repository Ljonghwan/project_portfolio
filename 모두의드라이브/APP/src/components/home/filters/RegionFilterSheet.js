import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { regionApi } from '../../../api/region';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../../constants/config';

/**
 * 지역 필터 본문 — 통합 FilterBottomSheet 내부에서 렌더된다.
 * value: { sido, sigungu } | null
 * onChange(value)
 */
export default function RegionFilterBody({ value, onChange }) {
    const [sidoList, setSidoList] = useState([]);
    const [sigunguList, setSigunguList] = useState([]);
    const [loadingSido, setLoadingSido] = useState(false);
    const [loadingSigungu, setLoadingSigungu] = useState(false);
    // 'sido' | 'sigungu' | null
    const [openDropdown, setOpenDropdown] = useState(null);

    const sido = value?.sido || '';
    const sigungu = value?.sigungu || '';

    useEffect(() => {
        let alive = true;
        setLoadingSido(true);
        regionApi.getSido()
            .then((res) => { if (alive) setSidoList(Array.isArray(res.data) ? res.data : []); })
            .catch(() => { if (alive) setSidoList([]); })
            .finally(() => { if (alive) setLoadingSido(false); });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!sido) {
            setSigunguList([]);
            return;
        }
        let alive = true;
        setLoadingSigungu(true);
        regionApi.getSigungu(sido)
            .then((res) => { if (alive) setSigunguList(Array.isArray(res.data) ? res.data : []); })
            .catch(() => { if (alive) setSigunguList([]); })
            .finally(() => { if (alive) setLoadingSigungu(false); });
        return () => { alive = false; };
    }, [sido]);

    const toggleDropdown = useCallback((which) => {
        setOpenDropdown((prev) => (prev === which ? null : which));
    }, []);

    const handleSelectSido = useCallback((v) => {
        onChange?.({ sido: v, sigungu: '' });
        setOpenDropdown(null);
    }, [onChange]);

    const handleSelectSigungu = useCallback((v) => {
        onChange?.(sido && v ? { sido, sigungu: v } : null);
        setOpenDropdown(null);
    }, [sido, onChange]);

    const renderSelect = (which, label, placeholder, disabled) => (
        <Pressable
            style={[styles.select, disabled && styles.selectDisabled]}
            onPress={() => !disabled && toggleDropdown(which)}
            disabled={disabled}
            testID={`regionfilter-${which}-select`}
        >
            <Text
                style={styles.selectText}
                allowFontScaling={false}
                numberOfLines={1}
            >
                {label || placeholder}
            </Text>
            <Image
                source={require('../../../../assets/icons/chevron-down.svg')}
                style={[styles.caret, openDropdown === which && styles.caretOpen]}
                contentFit="contain"
                tintColor={COLORS.textPrimary}
            />
        </Pressable>
    );

    const activeList = openDropdown === 'sido'
        ? { items: sidoList, loading: loadingSido, selected: sido, onSelect: handleSelectSido }
        : openDropdown === 'sigungu'
            ? { items: sigunguList, loading: loadingSigungu, selected: sigungu, onSelect: handleSelectSigungu }
            : null;

    return (
        <View style={styles.wrap}>
            <Text style={styles.guide} allowFontScaling={false}>지역을 선택해 주세요.</Text>
            <View style={styles.selectRow}>
                {renderSelect('sido', sido, '시/도 선택', false)}
                {renderSelect('sigungu', sigungu, '시/군/구 선택', !sido)}
            </View>

            {activeList && (
                <View style={styles.dropdownPanel}>
                    {activeList.loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color={COLORS.textPrimary} />
                        </View>
                    ) : (
                        <BottomSheetScrollView
                            style={styles.dropdownScroll}
                            contentContainerStyle={styles.dropdownContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {activeList.items.map((item) => {
                                const selected = item === activeList.selected;
                                return (
                                    <Pressable
                                        key={item}
                                        style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                                        onPress={() => activeList.onSelect(item)}
                                        testID={`regionfilter-${openDropdown}-item-${item}`}
                                    >
                                        <Text
                                            style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}
                                            allowFontScaling={false}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </BottomSheetScrollView>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, gap: SPACING.sm },
    guide: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },
    selectRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    select: {
        flex: 1,
        height: 52,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingLeft: 12,
        paddingRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectDisabled: {
        opacity: 0.5,
    },
    selectText: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    caret: {
        width: 24,
        height: 24,
    },
    caretOpen: {
        transform: [{ rotate: '180deg' }],
    },
    dropdownPanel: {
        flex: 1,
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 8,
        overflow: 'hidden',
    },
    loadingWrap: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    dropdownScroll: {
        flex: 1,
    },
    dropdownContent: {
        padding: SPACING.sm,
        gap: 2,
    },
    dropdownItem: {
        height: 44,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        justifyContent: 'center',
    },
    dropdownItemSelected: {
        backgroundColor: COLORS.primaryBg,
    },
    dropdownItemText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.h4,
        color: COLORS.textPrimary,
    },
    dropdownItemTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
});
