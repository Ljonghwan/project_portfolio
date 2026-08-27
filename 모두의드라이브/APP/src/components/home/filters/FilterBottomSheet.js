import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import useBottomSheetBackHandler from '../../../hooks/useBottomSheetBackHandler';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../../constants/config';
import RegionFilterBody from './RegionFilterSheet';
import DateFilterBody from './DateFilterSheet';
import CarTypeFilterBody from './CarTypeFilterSheet';
import GenderFilterBody from './GenderFilterSheet';
import AgeFilterBody from './AgeFilterSheet';

/**
 * 홈 통합 필터 바텀시트.
 *
 * 단일 BottomSheetModal 구조 — 상단 탭으로 5개 필터(지역/날짜/차종/성별/나이) 본문만 교체.
 * dismiss → present 패턴 사용 안 함. 시트는 한번만 present/dismiss 된다.
 *
 * 사용:
 *   const ref = useRef();
 *   ref.current.open('region')
 *
 * props:
 *   filters: { region, date, carType, gender, age }
 *   onChange(key, value)
 */
const FILTER_TABS = [
    { key: 'region', label: '지역' },
    { key: 'date', label: '날짜' },
    { key: 'carType', label: '차종' },
    { key: 'gender', label: '성별' },
    { key: 'age', label: '나이' },
];

const FilterBottomSheet = forwardRef(function FilterBottomSheet(
    { filters, onChange },
    ref,
) {
    const sheetRef = useRef(null);
    const insets = useSafeAreaInsets();
    const { height: frameHeight } = useSafeAreaFrame();
    const [sheetOpen, setSheetOpen] = useState(false);
    useBottomSheetBackHandler(sheetRef, sheetOpen);

    const [currentKey, setCurrentKey] = useState('region');

    // 각 필터별 임시 선택값 — 시트 내부에서만 관리하다가 적용 시 onChange로 전파
    const [draft, setDraft] = useState({
        region: filters.region || null,
        date: filters.date || null,
        carType: filters.carType || null,
        gender: filters.gender || null,
        age: filters.age || null,
    });

    // 시트 열릴 때마다 외부 filters와 동기화
    const syncDraft = useCallback(() => {
        setDraft({
            region: filters.region || null,
            date: filters.date || null,
            carType: filters.carType || null,
            gender: filters.gender || null,
            age: filters.age || null,
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
        // 전체 필터 초기화 — 현재 탭 뿐 아니라 모든 필터 해제
        setDraft({ region: null, date: null, carType: null, gender: null, age: null });
    }, []);

    const handleApply = useCallback(() => {
        // 모든 필터 변경사항을 한 번에 전파
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
            case 'date':
                return (
                    <DateFilterBody
                        value={draft.date}
                        onChange={(v) => handleDraftChange('date', v)}
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
            case 'age':
                return (
                    <AgeFilterBody
                        value={draft.age}
                        onChange={(v) => handleDraftChange('age', v)}
                    />
                );
            default:
                return null;
        }
    };


    const snapPoints = useMemo(() => ["80%"], []);

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
                {/* 상단 탭 (가로 스크롤) */}
                <View
                    style={styles.tabRow}
                >
                    {FILTER_TABS.map((t) => {
                        const active = t.key === currentKey;
                        return (
                            <Pressable
                                key={t.key}
                                style={[styles.tabItem, active && styles.tabItemActive]}
                                onPress={() => handleTabPress(t.key)}
                                hitSlop={4}
                                testID={`filtersheet-tab-${t.key}`}
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

                {/* 본문 — flex:1 로 모든 탭에서 동일 높이 */}
                <View style={styles.body}>{renderBody()}</View>

                {/* 하단 버튼 — insets.bottom 만큼 흰색 영역 확장 */}
                <View style={[styles.bottomBar, { paddingBottom: SPACING.xl + insets.bottom }]}>
                    <Pressable style={styles.resetBtn} onPress={handleReset} testID="filtersheet-reset-btn">
                        <Text style={styles.resetText} allowFontScaling={false}>초기화</Text>
                    </Pressable>
                    <Pressable style={styles.applyBtn} onPress={handleApply} testID="filtersheet-apply-btn">
                        <Text style={styles.applyText} allowFontScaling={false}>적용하기</Text>
                    </Pressable>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default FilterBottomSheet;

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
        // height: 300,
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
