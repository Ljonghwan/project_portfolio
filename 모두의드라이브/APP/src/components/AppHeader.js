import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../constants/config';

export default function AppHeader({
    title,
    onBack,
    onClose,
    rightLabel,
    onRightPress,
    rightDisabled = false,
    showBorder = false,
    rightComponent,
    testIDPrefix = 'header',
}) {
    return (
        <View style={[styles.header, showBorder && styles.headerBorder]}>
            {/* Left: back icon */}
            {onBack && (
                <TouchableOpacity
                    onPress={onBack}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.iconBtn}
                    testID={`${testIDPrefix}-back-btn`}
                >
                    <Image source={require('../../assets/icons/arrow-back.svg')} style={styles.backIcon} />
                </TouchableOpacity>
            )}

            {/* Title: left-aligned, 12px gap from icon */}
            <Text
                style={[styles.title, onBack && { marginLeft: SPACING.md }]}
                allowFontScaling={false}
            >
                {title}
            </Text>

            {/* Right */}
            {rightComponent && <View style={styles.rightSide}>{rightComponent}</View>}
            {!rightComponent && (onClose || (rightLabel && onRightPress)) && <View style={styles.rightSide}>
                {onClose && (
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.iconBtn}
                        disabled={rightDisabled}
                        testID={`${testIDPrefix}-close-btn`}
                    >
                        <Image source={require('../../assets/icons/close.svg')} style={styles.closeIcon} />
                    </TouchableOpacity>
                )}
                {rightLabel && onRightPress && (
                    <TouchableOpacity
                        onPress={onRightPress}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={rightDisabled}
                        testID={`${testIDPrefix}-right-btn`}
                    >
                        <Text style={[styles.rightLabel, rightDisabled && styles.rightLabelDisabled]} allowFontScaling={false}>
                            {rightLabel}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: SPACING.xl,
    },
    headerBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    iconBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    closeIcon: {
        width: 24,
        height: 24,
    },
    title: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontFamily: FONTS.semiBold,
        lineHeight: 30,
        color: COLORS.textPrimary,
    },
    rightSide: {
        marginLeft: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightLabel: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.grayMedium,
    },
    rightLabelDisabled: {
        opacity: 0.5,
    },
});
