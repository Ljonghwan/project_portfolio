import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Loading from '@/components/Loading';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
    children,
    style,
    containerStyle,
    textStyle,
    type = '1',
    disabled = false,
    load = false,
    bottom = false,
    frontIcon = null,
    frontIconStyle = null,
    frontIconTintColor = null,
    icon = null,
    onPress = () => { },
    pointerEvents = 'auto',
    avoidKeyboardLock = false
}) {

    const insets = useSafeAreaInsets();

    const backgroundColor = useDerivedValue(() => {
        'worklet';

        if (disabled) {
            return (type*1) === 16 ? colors.grey6 : colors.greyC;
        }

        return styles[`type_${type}`]?.backgroundColor;
    }, [disabled, type]);

    const textColor = useDerivedValue(() => {
        'worklet';

        if (disabled) {
            return colors.white;
        }

        return styles[`type_${type}_text`]?.color;
    }, [disabled, type]);

    const animatedStyle = useAnimatedStyle(() => {
        'worklet';

        return {
            backgroundColor: withTiming(backgroundColor.value, {
                duration: 150,
            }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        'worklet';

        return {
            color: withTiming(textColor.value, {
                duration: 150,
            }),
        };
    });

    const lastPressTime = useRef(0);



    const handlePress = () => {
        const now = Date.now();

        if (now - lastPressTime.current < 300) {
            return;
        }

        lastPressTime.current = now;
        onPress();
    };

    return (
        <KeyboardStickyView
            style={[
                { width: '100%', overflow: 'hidden' },
                style,
                bottom && {
                    paddingBottom: insets?.bottom + 20,
                    paddingHorizontal: rootStyle.side,
                    position: 'absolute',
                    bottom: 0,
                },
            ]}
            pointerEvents={pointerEvents}
            offset={{ closed: 0, opened: (insets?.bottom + 20) - 15 }}
            enabled={bottom && !avoidKeyboardLock}
        >
            {bottom && (
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']} // 위쪽은 진하게, 아래는 투명
                    style={styles.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.9 }}
                />
            )}

            <AnimatedTouchable
                style={[
                    styles[`type_${type}`],
                    animatedStyle,
                    containerStyle
                ]}
                onPress={handlePress}
                disabled={disabled || load}
                activeOpacity={0.8}
            >
                {frontIcon && (
                    <Image source={images[frontIcon]} style={frontIconStyle || rootStyle[frontIcon] || rootStyle.default} tintColor={frontIconTintColor}/>
                )}

                <AnimatedText
                    style={[
                        styles[`type_${type}_text`],
                        animatedTextStyle,
                        textStyle,
                        // pressed && { opacity: 0.5 }
                    ]}
                >
                    {children}
                </AnimatedText>

                {icon && (
                    <Image source={images[icon]} style={rootStyle[icon] || rootStyle.default} />
                )}
            </AnimatedTouchable>

            {load && (
                <Loading
                    style={[
                        {
                            position: 'absolute',
                            backgroundColor: styles[`type_${type}`]?.backgroundColor,
                            borderRadius: styles[`type_${type}`]?.borderRadius,
                        },
                        bottom && {
                            left: rootStyle.side,
                        },
                    ]}
                />
            )}
        </KeyboardStickyView>
    );
}

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    
    // Change
    type_1: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.primary,
    },
    type_1_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
        lineHeight: 52,
    },
    type_2: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.main,
    },
    type_2_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 48,
    },
    type_3: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: colors.main,
    },
    type_3_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 52,
    },
    type_4: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.greyE,
    },
    type_4_text: {
        color: colors.text_sub,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 48,
    },
    type_5: {
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.main,
        alignItems: 'center',
        justifyContent: 'center'
    },
    type_5_text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.white,
        fontFamily: fonts.semiBold
    },
    type_6: {
        paddingHorizontal: 16,
        height: 52,
        backgroundColor: colors.dark,
        alignItems: 'center',
        justifyContent: 'center'
    },
    type_6_text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.white,
        fontFamily: fonts.semiBold
    },
    type_7: {
        borderRadius: 20,
        backgroundColor: colors.greyD,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64
    },
    type_7_text: {
        color: colors.dark,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
        textAlign: 'center',
        fontFamily: fonts.semiBold
    },

    type_8: {
        borderRadius: 20,
        backgroundColor: colors.mainOp5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64
    },
    type_8_text: {
        color: colors.main,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
        textAlign: 'center',
        fontFamily: fonts.semiBold
    },


    type_9: {
        paddingHorizontal: 8,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.main,
        alignItems: 'center',
        justifyContent: 'center'
    },
    type_9_text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.white,
        fontFamily: fonts.semiBold
    },
    type_10: {
        paddingHorizontal: 8,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center'
    },
    type_10_text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.grey6,
        fontFamily: fonts.semiBold
    },
    
    type_11: {
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.white,
        borderWidth: 0.5,
        borderColor: colors.main,
        alignItems: 'center',
        justifyContent: 'center'
    },
    type_11_text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.main,
        fontFamily: fonts.medium
    },
  
    type_12: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    type_12_text: {
        color: colors.primary,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
        lineHeight: 52,
    },

    type_13: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.greyE,
    },
    type_13_text: {
        color: colors.grey6,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
        lineHeight: 52,
    },

    type_14: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 9,
        backgroundColor: colors.main,
    },
    type_14_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
        lineHeight: 48,
    },
    type_15: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary,
        height: 48,
    },
    type_15_text: {
        color: colors.primary,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
    },
    type_16: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.ff81a9,
        height: 48,
    },
    type_16_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_17: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.ff4c85,
        height: 48,
    },
    type_17_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_18: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.primary10,
    },
    type_18_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
        lineHeight: 52,
    },
    type_19: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.ff4c85,
        height: 48,
    },
    type_19_text: {
        color: colors.ff4c85,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_20: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.ff81a9,
        height: 48,
    },
    type_20_text: {
        color: colors.ff81a9,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_21: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.grey6,
    },
    type_21_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 48,
    },
});
