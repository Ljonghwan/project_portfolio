import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Loading from '@/components/Loading';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
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
    pointerEvents
}) {

    const insets = useSafeAreaInsets();

    const backgroundColor = useSharedValue(styles[`type_${type}`]?.backgroundColor);
    const textColor = useSharedValue(styles[`type_${type}_text`]?.color);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 300 }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 300 }),
        };
    });

    useEffect(() => {

        backgroundColor.value = disabled ? colors.taseta_sub_2 : styles[`type_${type}`]?.backgroundColor;
        textColor.value = disabled ? colors.taseta : styles[`type_${type}_text`]?.color;

    }, [disabled, type])

    return (
        <View style={[{ width: '100%', overflow: 'hidden' }, style]} pointerEvents={pointerEvents}>
            <AnimatedTouchable
                style={[
                    styles[`type_${type}`],
                    animatedStyle,
                    containerStyle,
                    bottom && { 
                        // marginBottom: Platform.OS === 'ios' ? 0 : insets?.bottom, 
                        paddingBottom:  insets?.bottom + ( styles[`type_${type}`]?.paddingVertical || 0), 
                        borderRadius: 0 
                    },
                ]}
                onPress={onPress}
                disabled={disabled || load}
            >
                {({ pressed }) => (
                    <>
                        <AnimatedText
                            style={[
                                styles[`type_${type}_text`],
                                animatedTextStyle,
                                textStyle,
                                pressed && { opacity: 0.5 }
                            ]}
                        >
                            {children}
                        </AnimatedText>

                        {icon && (
                            <Image source={images[icon]} style={rootStyle[icon] || rootStyle.default} />
                        )}
                    </>
                )}
            </AnimatedTouchable>
            
            {load && (
                <Loading
                    style={{
                        position: 'absolute',
                        backgroundColor: styles[`type_${type}`]?.backgroundColor,
                        borderRadius: bottom ? 0 : styles[`type_${type}`]?.borderRadius,
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({

    type_1: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.taseta,
        backgroundColor: colors.taseta,
        paddingVertical: 14.5
    },
    type_1_text: {
        color: colors.taseta_sub_2,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
    },
    type_2: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.taseta,
        backgroundColor: colors.taseta_sub_2,
        paddingVertical: 14.5
    },
    type_2_text: {
        color: colors.taseta,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
    },
    type_3: {
        width: '100%',
        height: 42,
        flexDirection: 'row',
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.taseta,
        backgroundColor: colors.taseta,
        paddingHorizontal: 22,
    },
    type_3_text: {
        color: colors.taseta_sub_2,
        fontFamily: fonts.medium,
        fontSize: 16,
        letterSpacing: -0.32
    },
    type_4: {
        width: '100%',
        height: 42,
        flexDirection: 'row',
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.main,
        backgroundColor: colors.white,
        paddingHorizontal: 22
    },
    type_4_text: {
        color: colors.sub_1,
        fontFamily: fonts.medium,
        fontSize: 16,
        letterSpacing: -0.32,
        flex: 1
    },

    type_5: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.red3,
        backgroundColor: colors.red3
    },
    type_5_text: {
        color: colors.red1,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 64
    },
    type_6: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: colors.greyE,
    },
    type_6_text: {
        color: colors.grey6,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 52,
    },
    type_7: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.taseta_sub_2,
        height: 40
    },
    type_7_text: {
        color: colors.taseta,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_8: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: colors.taseta_sub_2,
        borderWidth: 1,
        borderColor: colors.taseta,
        height: 35,
        paddingHorizontal: 11
    },
    type_8_text: {
        color: colors.taseta,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
    type_9: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.main,
        backgroundColor: colors.white,
        paddingHorizontal: 14
    },
    type_9_text: {
        color: colors.main,
        fontFamily: fonts.medium,
        fontSize: 18,
        letterSpacing: -0.36,
        flex: 1
    },
    type_10: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.text_popup,
        backgroundColor: colors.white,
        paddingVertical: 14.5
    },
    type_10_text: {
        color: colors.text_popup,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 18,
    },
    type_11: {
        width: '100%',
        height: 42,
        flexDirection: 'row',
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.text_popup,
        backgroundColor: colors.white,
        paddingHorizontal: 22,
    },
    type_11_text: {
        color: colors.text_popup,
        fontFamily: fonts.medium,
        fontSize: 16,
        letterSpacing: -0.32
    },
});
