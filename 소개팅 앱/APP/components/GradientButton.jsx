import { PropsWithChildren, ReactElement, useEffect } from 'react';
import { Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({
    children,
    style,
    textStyle,
    type='1',
    disabled=false,
    load=false,
    bottom=false,
    icon=null,
    iconStyle=null,
    onPress=()=>{}
}) {

    const insets = useSafeAreaInsets();

    const opacity = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    useEffect(() => {
        opacity.value = disabled ? 0.5 : 1; 
    }, [disabled])

    const gradient = {
        type_1: {
            colors: colors.gradient1,
            locations: [0.0177, 1], // 1.77%와 100% 위치
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 }
        },
        type_2: {
            colors: ['#EEEEEE', '#EEEEEE'],
        }
    }
    return (
        <KeyboardStickyView style={[{ width: '100%' }, style ]} offset={{ closed: 0, opened: insets?.bottom }} enabled={bottom}>
            <AnimatedTouchable 
                onPress={onPress} 
                disabled={disabled || load}
                style={[ animatedStyle ]}
                activeOpacity={0.7}
            >
                <LinearGradient
                    style={[
                        styles[`type_${type}`],
                        bottom && { paddingBottom: insets?.bottom, borderRadius: 0 },
                    ]}
                    {...gradient?.[`type_${type}`]}
                >
                    {icon && (
                        <Image source={icon} style={iconStyle} />
                    )}
                    <Animated.Text
                        style={[
                            styles[`type_${type}_text`],
                            textStyle,
                            disabled && { color: colors.white },
                        ]}
                    >
                        {children}
                    </Animated.Text>
                    {load && (
                        <Loading style={{ position: 'absolute', backgroundColor: styles[`type_${type}`]?.backgroundColor, borderRadius: styles[`type_${type}`]?.borderRadius }}/>
                    )}
                </LinearGradient>
            </AnimatedTouchable>
        </KeyboardStickyView>
    );
}

const styles = StyleSheet.create({
    
    type_1: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        borderRadius: 12,
    },
    type_1_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 48,
    },
    type_2: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        borderRadius: 12,
    },
    type_2_text: {
        color: colors.grey6,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 48,
    },
});
