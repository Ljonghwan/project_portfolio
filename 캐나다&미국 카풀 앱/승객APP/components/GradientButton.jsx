import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
    children,
    style,
    textStyle,
    type='1',
    disabled=false,
    load=false,
    bottom=false,
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
            start: { x: 0, y: 0.5 }, // 왼쪽 중앙
            end: { x: 1, y: 0.4 } // 오른쪽 약간 위
        }
    }
    return (
        <KeyboardStickyView style={[{ width: '100%' }, style ]} offset={{ closed: 0, opened: insets?.bottom }} enabled={bottom}>
            <AnimatedTouchable 
                onPress={onPress} 
                disabled={disabled || load}
                style={[ animatedStyle ]}
            >
                {({pressed}) => (
                    <LinearGradient
                        style={[
                            styles[`type_${type}`],
                            bottom && { paddingBottom: insets?.bottom, borderRadius: 0 },
                        ]}
                        {...gradient?.[`type_${type}`]}
                    >
                        <AnimatedText
                            style={[
                                styles[`type_${type}_text`],
                                textStyle,
                                disabled && { color: colors.white },
                                pressed && { opacity: 0.5 }
                            ]}
                        >
                            {children}
                        </AnimatedText>
                        {load && (
                            <Loading style={{ position: 'absolute', backgroundColor: styles[`type_${type}`]?.backgroundColor, borderRadius: styles[`type_${type}`]?.borderRadius }}/>
                        )}
                    </LinearGradient>
                )}
            </AnimatedTouchable>
        </KeyboardStickyView>
    );
}

const styles = StyleSheet.create({
    
    type_1: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
    },
    type_1_text: {
        color: colors.white,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 52,
    },
});
