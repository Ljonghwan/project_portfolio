import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    Easing,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';

import colors from '@/libs/colors';

export default function RippleLoader({
    size = 120,
    color = colors.taseta,
    rippleCount = 3,
    duration = 3000,
}) {
    // One master shared value that goes from 0 -> 1 repeatedly.
    // Each ripple will be offset by a delay based on index.
    const master = useSharedValue(0);

    React.useEffect(() => {
        // animate master from 0 -> 1 -> 0 repeatedly
        master.value = withRepeat(
            withTiming(1, {
                duration,
                easing: Easing.out(Easing.exp),
            }),
            -1,
            false,
        );
    }, [duration, master]);

    const containerStyle = {
        width: size,
        height: size,
    };

    const rippleSize = size; // each ripple is same square size, we'll scale it
    const circleStyle = (index) => {
        // stagger start by fraction of the duration
        const delay = (index * duration) / rippleCount;

        const shared = useSharedValue(0);

        // drive each ripple by the master value but with a delay using withDelay
        React.useEffect(() => {
            // we run an independent repeating timing so that each circle has its own phase.
            shared.value = withDelay(
                delay,
                withRepeat(
                    withTiming(1, {
                        duration,
                        easing: Easing.out(Easing.exp),
                    }),
                    -1,
                    false,
                ),
            );
        }, [delay, duration, shared]);

        const animated = useAnimatedStyle(() => {
            // scale from 0.2 -> 1.8 (you can tweak)
            const s = 0 + shared.value * 1;
            const o = 0.6 * (1 - shared.value); // fade out
            return {
                transform: [{ scale: s }],
                opacity: o,
            };
        });

        return (
            <Animated.View
                key={`ripple_${index}`}
                accessible={false}
                style={[
                    styles.ripple,
                    {
                        width: rippleSize,
                        height: rippleSize,
                        borderRadius: rippleSize / 2,
                        backgroundColor: color,
                    },
                    animated,
                ]}
            />
        );
    };

    // center dot (solid) to indicate the target being searched
    const dotSize = Math.max(10, size * 0.08);

    return (
        <View
            style={[styles.wrapper, containerStyle]}
        >
            {/* ripples stacked behind */}
            <View style={styles.absoluteFill} pointerEvents="none">
                {Array.from({ length: rippleCount }).map((_, i) => circleStyle(i))}
            </View>

            {/* center solid dot */}
            <View
                style={[
                    styles.centerDot,
                    {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: color,
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ripple: {
        position: 'absolute',
        // we want the scale origin at center; transforms default to center in RN
    },
    centerDot: {
        zIndex: 2,
    },
});