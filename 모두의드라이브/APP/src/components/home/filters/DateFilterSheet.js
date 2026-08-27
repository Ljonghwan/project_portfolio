import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../../constants/config';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 날짜 필터 본문 — 통합 FilterBottomSheet 내부에서 렌더된다.
 * value: 'YYYY-MM-DD' | null
 */
export default function DateFilterBody({ value, onChange }) {
    const { height: frameHeight } = useSafeAreaFrame();
    // 시트 본문 높이 대비 작은 기기(iPhone SE 등)에서 6주 캘린더가 모두 보이도록 셀 높이를 동적으로 축소
    // 기준: 700px 이상 → 44, 620~700 → 40, 그 이하 → 36
    const cellH = frameHeight >= 760 ? 38 : frameHeight >= 660 ? 34 : 30;
    const today = useMemo(() => dayjs().startOf('day'), []);
    const [cursor, setCursor] = useState(() => (value ? dayjs(value) : today).startOf('month'));

    useEffect(() => {
        if (value) setCursor(dayjs(value).startOf('month'));
    }, [value]);

    const weeks = useMemo(() => {
        const start = cursor.startOf('month');
        const startWeekday = start.day();
        const daysInMonth = cursor.daysInMonth();
        const cells = [];
        for (let i = 0; i < startWeekday; i++) {
            const d = start.subtract(startWeekday - i, 'day');
            cells.push({ date: d, outside: true });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: start.date(d), outside: false });
        }
        while (cells.length % 7 !== 0) {
            const last = cells[cells.length - 1].date;
            cells.push({ date: last.add(1, 'day'), outside: true });
        }
        while (cells.length < 42) {
            const last = cells[cells.length - 1].date;
            cells.push({ date: last.add(1, 'day'), outside: true });
        }
        const rows = [];
        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
        return rows;
    }, [cursor]);

    const handleSelect = useCallback((dateStr) => {
        onChange?.(dateStr);
    }, [onChange]);

    return (
        <View style={styles.wrap}>
            <Text style={styles.guide} allowFontScaling={false}>날짜를 선택해 주세요.</Text>
            <View style={styles.calHeader}>
                <Pressable onPress={() => setCursor((c) => c.subtract(1, 'month'))} hitSlop={12} testID="datefilter-prev-month-btn">
                    <Text style={styles.arrow} allowFontScaling={false}>{'‹'}</Text>
                </Pressable>
                <Text style={styles.calTitle} allowFontScaling={false}>{cursor.format('YYYY.M')}</Text>
                <Pressable onPress={() => setCursor((c) => c.add(1, 'month'))} hitSlop={12} testID="datefilter-next-month-btn">
                    <Text style={styles.arrow} allowFontScaling={false}>{'›'}</Text>
                </Pressable>
            </View>
            <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                    <View key={w} style={styles.weekCell}>
                        <Text style={[styles.weekText, i === 0 && styles.sunText]} allowFontScaling={false}>{w}</Text>
                    </View>
                ))}
            </View>
            {weeks.map((row, rIdx) => (
                <View key={rIdx} style={styles.dayRow}>
                    {row.map((cell, cIdx) => {
                        const dateStr = cell.date.format('YYYY-MM-DD');
                        const isSelected = dateStr === value;
                        const isToday = cell.date.isSame(today, 'day');
                        const isSunday = cell.date.day() === 0;
                        const isPast = cell.date.isBefore(today, 'day');
                        const disabled = cell.outside || isPast;
                        return (
                            <Pressable
                                key={cIdx}
                                style={[styles.dayCell, { height: cellH }]}
                                disabled={disabled}
                                onPress={() => handleSelect(dateStr)}
                                testID={`datefilter-day-${dateStr}`}
                            >
                                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                                    <Text
                                        style={[
                                            styles.dayText,
                                            disabled && styles.dayTextOutside,
                                            isSunday && !disabled && styles.sunText,
                                            isSelected && styles.dayTextSelected,
                                        ]}
                                        allowFontScaling={false}
                                    >
                                        {cell.date.date()}
                                    </Text>
                                </View>
                                {isToday && (
                                    <Text style={styles.todayText} allowFontScaling={false}>오늘</Text>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, minHeight: 0, gap: SPACING.sm, paddingBottom: SPACING.xl },
    guide: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },
    calHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xl,
        paddingVertical: SPACING.sm,
    },
    arrow: {
        fontFamily: FONTS.extraBold,
        fontSize: 24,
        color: COLORS.textPrimary,
        width: 24,
        textAlign: 'center',
    },
    calTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: FONT_SIZE.xl,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    weekRow: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
    },
    weekCell: { flex: 1, alignItems: 'center' },
    weekText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    sunText: { color: '#E02E2E' },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleSelected: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZE.sm,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    dayTextOutside: {
        color: COLORS.disabledBtn,
    },
    dayTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.white,
    },
    todayText: {
        fontFamily: FONTS.extraBold,
        fontSize: 11,
        lineHeight: 14,
        color: COLORS.primary,
    },
});
