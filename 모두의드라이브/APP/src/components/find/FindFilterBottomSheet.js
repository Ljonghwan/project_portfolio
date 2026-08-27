import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useBottomSheetBackHandler from '../../hooks/useBottomSheetBackHandler';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../constants/config';
import RegionFilterBody from '../home/filters/RegionFilterSheet';
import CarTypeFilterBody from '../home/filters/CarTypeFilterSheet';
import GenderFilterBody from '../home/filters/GenderFilterSheet';
import AgeFilterBody from '../home/filters/AgeFilterSheet';

/**
 * 친구찾기 통합 필터 바텀시트.
 *
 * 홈 FilterBottomSheet 와 동일 구조. 단일 BottomSheetModal — 상단 탭으로 본문 교체.
 * 오너/게스트(구분)는 상단 필터칩 토글로 처리하므로 여기서 다루지 않는다.
 *
 * 사용:
 *   const ref = useRef();
 *   ref.current.open('region')
 *
 * props:
 *   filters: { region, age, carType, gender }
 *   onChange(key, value)
 */
const FILTER_TABS = [
    { key: 'region', label: '지역' },
    { key: 'age', label: '나이' },
    { key: 'carType', label: '차종' },
    { key: 'gender', label: '성별' },
];

const FindFilterBottomSheet = forwardRef(function FindFilterBottomSheet(
    { filters, onChange },
    ref,
) {
    const sheetRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [sheetOpen, setSheetOpen] = useState(false);
    useBottomSheetBackHandler(sheetRef, sheetOpen);

    const [currentKey, setCurrentKey] = useState('region');

    const [draft, setDraft] = useState({
        region: filters.region || null,
        age: filters.age || null,
        carType: filters.carType || null,
        gender: filters.gender || null,
    });

    const syncDraft = useCallback(() => {
        setDraft({
            region: filters.region || null,
            age: filters.age || null,
            carType: filters.carType || null,
            gender: filters.gender || null,
        });
    }, [filters]);

    const open = useCallback((key) => {
        setCurrentKey(key || 'region');
        syncDraft();
        sheetRef.current?.present();
    }, [syncDraft]);

    useImperativeHandle(ref, () => ({ open }), [open]);

    const handleTabPress = useCallback((key) => {
        setCurrentKey(key);
    }, []);

    const handleDraftChange = useCallback((key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleReset = useCallback(() => {
        setDraft({ region: null, age: null, carType: null, gender: null });
    }, []);

    const handleApply = useCallback(() => {
        Object.keys(draft).forEach((k) => {
            onChange?.(k, draft[k]);
        });
        sheetRef.current?.dismiss();
    }, [draft, onChange]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.7}
                pressBehavior="close"
            />
        ),
        [],
    );

    const renderBody = () => {
        switch (currentKey) {
            case 'region':
                return (
                    <RegionFilterBody
                        value={draft.region}
                        onChange={(v) => handleDraftChange('region', v)}
                    />
                );
            case 'age':
                return (
                    <AgeFilterBody
                        value={draft.age}
                        onChange={(v) => handleDraftChange('age', v)}
                    />
                );
            case 'carType':
                return (
                    <CarTypeFilterBody
                        value={draft.carType}
                        onChange={(v) => handleDraftChange('carType', v)}
                    />
                );
            case 'gender':
                return (
                    <GenderFilterBody
                        value={draft.gender}
                        onChange={(v) => handleDraftChange('gender', v)}
                    />
                );
            default:
                return null;
        }
    };

    const snapPoints = useMemo(() => ['80%'], []);

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onChange={(index) => setSheetOpen(index >= 0)}
            enablePanDownToClose
            enableDynamicSizing={false}
            enableOverDrag={false}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <BottomSheetView style={styles.container}>
                <View style={styles.tabRow}>
                    {FILTER_TABS.map((t) => {
                        const active = t.key === currentKey;
                        return (
                            <Pressable
                                key={t.key}
                                style={[styles.tabItem, active && styles.tabItemActive]}
                                onPress={() => handleTabPress(t.key)}
                                hitSlop={4}
                                testID={`find-filtersheet-tab-${t.key}`}
                            >
                                <Text
                                    style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}
                                    allowFontScaling={false}
                                >
                                    {t.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.body}>{renderBody()}</View>

                <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                    <Pressable style={styles.resetBtn} onPress={handleReset} testID="find-filtersheet-reset-btn">
                        <Text style={styles.resetText} allowFontScaling={false}>초기화</Text>
                    </Pressable>
                    <Pressable style={styles.applyBtn} onPress={handleApply} testID="find-filtersheet-apply-btn">
                        <Text style={styles.applyText} allowFontScaling={false}>적용하기</Text>
                    </Pressable>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default FindFilterBottomSheet;

const styles = StyleSheet.create({
    sheetBg: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handleIndicator: {
        backgroundColor: COLORS.disabledBtn,
        width: 40,
    },
    container: {
        height: '100%',
    },
    tabRow: {
        height: 52,
        flexDirection: 'row',
        gap: 24,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },
    tabItem: {
        paddingVertical: SPACING.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        textAlign: 'center',
    },
    tabTextActive: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    tabTextInactive: {
        fontFamily: FONTS.semiBold,
        color: COLORS.disabledBtn,
    },
    body: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxxl,
    },
    bottomBar: {
        flexDirection: 'row',
        gap: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
    },
    resetBtn: {
        width: 120,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.grayMedium,
    },
    applyBtn: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyText: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        color: COLORS.white,
    },
});
