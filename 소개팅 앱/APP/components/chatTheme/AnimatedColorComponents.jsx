import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';

import Text from '@/components/Text';

// ============================================
// AnimatedBackground - 배경색 애니메이션 컴포넌트
// ============================================

const AnimatedTextComponent = Animated.createAnimatedComponent(Text);

export const AnimatedBackground = ({
    bg,
    duration = 200,
    style,
    children,
}) => {
    const progress = useSharedValue(0);
    const currentColor = useSharedValue(bg);
    const targetColor = useSharedValue(bg);

    useEffect(() => {
        currentColor.value = targetColor.value;
        targetColor.value = bg;
        progress.value = 0;
        progress.value = withTiming(1, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [bg]);

    const animatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [currentColor.value, targetColor.value]
        );
        return { backgroundColor };
    });

    return (
        <Animated.View style={[styles.container, style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// AnimatedText - 글자색 애니메이션 컴포넌트
// ============================================

export const AnimatedText = ({
    color,
    duration = 200,
    style,
    children,
}) => {
    const progress = useSharedValue(0);
    const currentColor = useSharedValue(color);
    const targetColor = useSharedValue(color);

    useEffect(() => {
        currentColor.value = targetColor.value;
        targetColor.value = color;
        progress.value = 0;
        progress.value = withTiming(1, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [color]);

    const animatedStyle = useAnimatedStyle(() => {
        const textColor = interpolateColor(
            progress.value,
            [0, 1],
            [currentColor.value, targetColor.value]
        );
        return { color: textColor };
    });

    return (
        <AnimatedTextComponent style={[style, animatedStyle]}>
            {children}
        </AnimatedTextComponent>
    );
};



const styles = StyleSheet.create({
    
});