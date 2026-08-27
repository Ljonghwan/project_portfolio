import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../../constants/config';

function CheckIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke={COLORS.primary}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

/**
 * 2열 옵션 그리드. 차종/성별/나이 필터에서 공통 사용.
 * options: [{ key, label }]
 * value: 단일 선택 key (string | null)
 */
export default function OptionGrid({ guideText, options, value, onChange, testIDPrefix = 'optiongrid' }) {
    // 2열 wrap 그리드. 각 카드는 정확히 절반(- gap/2) 너비를 갖도록 width 를 명시한다.
    // 마지막 홀수 카드도 절반 너비를 유지한다 (placeholder 불필요).
    return (
        <View style={styles.wrap}>
            <Text style={styles.guide} allowFontScaling={false}>{guideText}</Text>
            <View style={styles.grid}>
                {options.map((opt) => {
                    const selected = value === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            style={[styles.cell, selected ? styles.cellSelected : styles.cellNormal]}
                            onPress={() => onChange(selected ? null : opt.key)}
                            testID={`${testIDPrefix}-option-${opt.key}`}
                        >
                            {selected && (
                                <View style={styles.checkWrap}>
                                    <CheckIcon />
                                </View>
                            )}
                            <Text
                                style={[styles.cellText, selected ? styles.cellTextSelected : styles.cellTextNormal]}
                                allowFontScaling={false}
                            >
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: SPACING.sm,
    },
    guide: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: SPACING.md,
        columnGap: SPACING.sm,
    },
    cell: {
        // 2열 wrap: 정확히 절반에서 columnGap 절반만큼 뺀 너비.
        // RN 은 calc 미지원이므로 percent 로 근사: 50% - gap 보정.
        width: '48.5%',
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: SPACING.xl,
    },
    cellNormal: {
        borderColor: '#DDDDDD',
    },
    cellSelected: {
        borderColor: COLORS.primary,
    },
    cellText: {
        fontSize: FONT_SIZE.h4,
        lineHeight: 24,
        textAlign: 'center',
    },
    cellTextNormal: {
        fontFamily: FONTS.semiBold,
        color: COLORS.grayMedium,
    },
    cellTextSelected: {
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    checkWrap: {
        position: 'absolute',
        left: 11,
        top: '50%',
        marginTop: -10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    check: {
        fontFamily: FONTS.extraBold,
        fontSize: 16,
        color: COLORS.primary,
    },
});
