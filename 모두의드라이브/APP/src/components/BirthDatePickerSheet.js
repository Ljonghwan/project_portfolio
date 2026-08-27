import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../constants/config';
import useBottomSheetBackHandler from '../hooks/useBottomSheetBackHandler';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 17 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(year, month) {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => i + 1);
    return Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);
}

const SHEET_HEIGHT = 400;
const ITEM_HEIGHT = 54; // 52px item + 2px gap
const LIST_PADDING_TOP = SPACING.sm; // listContent paddingVertical

function calcContentOffset(index) {
    if (index > 2) {
        return { x: 0, y: Math.max(0, index * ITEM_HEIGHT - LIST_PADDING_TOP) };
    }
    return { x: 0, y: 0 };
}

export default function BirthDatePickerSheet({
    visible,
    onClose,
    onSelect,
    initialYear,
    initialMonth,
    initialDay,
}) {
    const insets = useSafeAreaInsets();
    const yearSheetRef = useRef(null);
    const monthSheetRef = useRef(null);
    const daySheetRef = useRef(null);
    const [yearSheetOpen, setYearSheetOpen] = useState(false);
    const [monthSheetOpen, setMonthSheetOpen] = useState(false);
    const [daySheetOpen, setDaySheetOpen] = useState(false);
    useBottomSheetBackHandler(yearSheetRef, yearSheetOpen);
    useBottomSheetBackHandler(monthSheetRef, monthSheetOpen);
    useBottomSheetBackHandler(daySheetRef, daySheetOpen);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const selectedYearRef = useRef(null);
    const selectedMonthRef = useRef(null);
    const selectedDayRef = useRef(null);
    selectedYearRef.current = selectedYear;
    selectedMonthRef.current = selectedMonth;
    selectedDayRef.current = selectedDay;

    // 시트 전환 플래그: 'month' | 'day' | null
    const pendingNextRef = useRef(null);

    // visible 변경 시 년도 시트 열기 (PhotoPickerSheet 패턴)
    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
            setSelectedYear(initialYear || null);
            setSelectedMonth(initialMonth || null);
            setSelectedDay(initialDay || null);
            yearSheetRef.current?.present();
        }
    }, [visible]);

    // contentOffset으로 즉시 스크롤 위치 설정
    const yearContentOffset = useMemo(
        () => calcContentOffset(YEARS.indexOf(selectedYear)),
        [selectedYear]
    );
    const monthContentOffset = useMemo(
        () => calcContentOffset(selectedMonth ? selectedMonth - 1 : -1),
        [selectedMonth]
    );
    const days = useMemo(
        () => getDaysInMonth(selectedYear, selectedMonth),
        [selectedYear, selectedMonth]
    );
    const dayContentOffset = useMemo(
        () => calcContentOffset(selectedDay ? selectedDay - 1 : -1),
        [selectedDay]
    );

    const handleYearSelect = useCallback((year) => {
        pendingNextRef.current = 'month';
        setSelectedYear(year);
        selectedYearRef.current = year;
        yearSheetRef.current?.dismiss();
    }, []);

    const handleMonthSelect = useCallback((month) => {
        pendingNextRef.current = 'day';
        setSelectedMonth(month);
        selectedMonthRef.current = month;
        setSelectedDay(null);
        selectedDayRef.current = null;
        monthSheetRef.current?.dismiss();
    }, []);

    const handleDaySelect = useCallback((day) => {
        setSelectedDay(day);
        selectedDayRef.current = day;
        daySheetRef.current?.dismiss();
    }, []);

    // 년도 시트 onDismiss: 전환 플래그에 따라 다음 시트 or 닫기
    const handleYearDismiss = useCallback(() => {
        if (pendingNextRef.current === 'month') {
            pendingNextRef.current = null;
            monthSheetRef.current?.present();
        } else {
            onClose();
        }
    }, [onClose]);

    // 월 시트 onDismiss: 전환 플래그에 따라 다음 시트 or 닫기
    const handleMonthDismiss = useCallback(() => {
        if (pendingNextRef.current === 'day') {
            pendingNextRef.current = null;
            daySheetRef.current?.present();
        } else {
            onClose();
        }
    }, [onClose]);

    // 일 시트 onDismiss: 선택 완료 시 값 전달
    const handleDayDismiss = useCallback(() => {
        if (selectedYearRef.current && selectedMonthRef.current && selectedDayRef.current) {
            onSelect(
                String(selectedYearRef.current),
                String(selectedMonthRef.current).padStart(2, '0'),
                String(selectedDayRef.current).padStart(2, '0')
            );
        }
        onClose();
    }, [onSelect, onClose]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.7}
            />
        ),
        []
    );

    return (
        <>
            {/* 년도 선택 */}
            <BottomSheetModal
                ref={yearSheetRef}
                snapPoints={[SHEET_HEIGHT]}
                onDismiss={handleYearDismiss}
                onChange={(index) => setYearSheetOpen(index >= 0)}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                enableDynamicSizing={false}
                enableOverDrag={false}
                backgroundStyle={styles.sheetBg}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle} allowFontScaling={false}>출생 연도</Text>
                </View>
                <BottomSheetScrollView
                    style={styles.listScroll}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                    contentOffset={yearContentOffset}
                    showsVerticalScrollIndicator={false}
                >
                    {YEARS.map((year) => {
                        const isSelected = year === selectedYear;
                        return (
                            <Pressable
                                key={year}
                                style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                                onPress={() => handleYearSelect(year)}
                                testID={`birthsheet-year-${year}`}
                            >
                                <Text
                                    style={[styles.listItemText, isSelected ? styles.listItemTextSelected : null]}
                                    allowFontScaling={false}
                                >
                                    {year}년
                                </Text>
                            </Pressable>
                        );
                    })}
                </BottomSheetScrollView>
            </BottomSheetModal>

            {/* 월 선택 */}
            <BottomSheetModal
                ref={monthSheetRef}
                snapPoints={[SHEET_HEIGHT]}
                onDismiss={handleMonthDismiss}
                onChange={(index) => setMonthSheetOpen(index >= 0)}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                enableDynamicSizing={false}
                enableOverDrag={false}
                backgroundStyle={styles.sheetBg}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle} allowFontScaling={false}>월 선택</Text>
                </View>
                <BottomSheetScrollView
                    style={styles.listScroll}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                    contentOffset={monthContentOffset}
                    showsVerticalScrollIndicator={false}
                >
                    {MONTHS.map((month) => {
                        const isSelected = month === selectedMonth;
                        return (
                            <Pressable
                                key={month}
                                style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                                onPress={() => handleMonthSelect(month)}
                                testID={`birthsheet-month-${month}`}
                            >
                                <Text
                                    style={[styles.listItemText, isSelected ? styles.listItemTextSelected : null]}
                                    allowFontScaling={false}
                                >
                                    {month}월
                                </Text>
                            </Pressable>
                        );
                    })}
                </BottomSheetScrollView>
            </BottomSheetModal>

            {/* 일 선택 */}
            <BottomSheetModal
                ref={daySheetRef}
                snapPoints={[SHEET_HEIGHT]}
                onDismiss={handleDayDismiss}
                onChange={(index) => setDaySheetOpen(index >= 0)}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                enableDynamicSizing={false}
                enableOverDrag={false}
                backgroundStyle={styles.sheetBg}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle} allowFontScaling={false}>일 선택</Text>
                </View>
                <BottomSheetScrollView
                    style={styles.listScroll}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
                    contentOffset={dayContentOffset}
                    showsVerticalScrollIndicator={false}
                >
                    {days.map((day) => {
                        const isSelected = day === selectedDay;
                        return (
                            <Pressable
                                key={day}
                                style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                                onPress={() => handleDaySelect(day)}
                                testID={`birthsheet-day-${day}`}
                            >
                                <Text
                                    style={[styles.listItemText, isSelected ? styles.listItemTextSelected : null]}
                                    allowFontScaling={false}
                                >
                                    {day}일
                                </Text>
                            </Pressable>
                        );
                    })}
                </BottomSheetScrollView>
            </BottomSheetModal>
        </>
    );
}

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
    header: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerTitle: {
        fontSize: FONT_SIZE.h4,
        fontFamily: FONTS.extraBold,
        color: COLORS.textPrimary,
    },
    listScroll: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        gap: 2,
    },
    listItem: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderCurve: 'continuous',
    },
    listItemSelected: {
        backgroundColor: COLORS.primaryBg,
    },
    listItemText: {
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    listItemTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
});
