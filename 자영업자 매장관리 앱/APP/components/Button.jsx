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
    icon = null,
    onPress = () => { },
    pointerEvents = 'auto'
}) {

    const insets = useSafeAreaInsets();

    const backgroundColor = useDerivedValue(() => {
        'worklet';

        if (disabled) {
            return colors.gray;
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
                    paddingHorizontal: 35,
                    position: 'absolute',
                    bottom: 0,
                },
            ]}
            pointerEvents={pointerEvents}
            offset={{ closed: 0, opened: (insets?.bottom + 20) - 15 }}
            enabled={bottom}
        >
            {bottom && (
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']} // 위쪽은 진하게, 아래는 투명
                    style={styles.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.9 }}
                />
            )}

            <TouchableOpacity
                style={[
                    styles[`type_${type}`],
                    { backgroundColor: disabled ? colors.gray : styles[`type_${type}`]?.backgroundColor },
                    containerStyle
                ]}
                onPress={handlePress}
                disabled={disabled || load}
                activeOpacity={0.8}
            >
                <Text
                    style={[
                        styles[`type_${type}_text`],
                        { color: disabled ? colors.white : styles[`type_${type}_text`]?.color },
                        textStyle,
                        // pressed && { opacity: 0.5 }
                    ]}
                >
                    {children}
                </Text>

                {icon && (
                    <Image source={images[icon]} style={rootStyle[icon] || rootStyle.default} />
                )}
            </TouchableOpacity>

            {load && (
                <Loading
                    style={[
                        {
                            position: 'absolute',
                            backgroundColor: styles[`type_${type}`]?.backgroundColor,
                            borderRadius: styles[`type_${type}`]?.borderRadius,
                        },
                        bottom && {
                            left: 35
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
    type_1: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: colors.primary,
        height: 50
    },
    type_1_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 15,
    },
    type_2: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: colors.f4f4f5,
        height: 50
    },
    type_2_text: {
        color: colors.text757575,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 15,
    },
    type_3: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        paddingVertical: 13,
        paddingHorizontal: 16
    },
    type_3_text: {
        color: colors.primary,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 14,
        letterSpacing: -0.35
    },
    type_4: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.fafafa,
        backgroundColor: colors.white,
        paddingVertical: 9.5,
        paddingHorizontal: 12
    },
    type_4_text: {
        color: colors.text2B2B2B,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 13,
        letterSpacing: -0.325
    },
    type_5: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.white,
        height: 57
    },
    type_5_text: {
        color: colors.text1D89FF,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
    },
    type_6: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.f1f1f0,
        height: 57
    },
    type_6_text: {
        color: colors.text1D89FF,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 16,
    },
    type_7: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.f1f1f0,
        height: 57
    },
    type_7_text: {
        color: colors.textE41616,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 16,
    },
    type_8: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.eeeeef,
        backgroundColor: colors.white,
        paddingVertical: 9.5,
        paddingHorizontal: 12
    },
    type_8_text: {
        color: colors.text212223,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 13,
        letterSpacing: -0.325
    },
    type_9: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
    },
    type_9_text: {
        color: colors.primary,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 15,
        letterSpacing: -0.35
    },
    type_10: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.f1f1f0,
        height: 57
    },
    type_10_text: {
        color: colors.textPrimary,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 16,
    },



    type_delete: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: colors.f4f4f5,
        height: 50
    },
    type_delete_text: {
        color: colors.textE41616,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 15,
    },
    type_send: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: colors.primary,
        height: 32,
        paddingHorizontal: 12
    },
    type_send_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 13,
    },

});
