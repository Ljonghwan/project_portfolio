import React, {useRef, useState, useEffect} from 'react';

import {
    Text,
    StyleSheet,
    Pressable,
    View
} from 'react-native';

import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import colors from '@/libs/colors';

export default function Component({ 
    value=false, 
    togglePress,
    style,
    duration = 400,
    trackColors = { on: colors.primary, off: colors.eeeeef }
}) {

    const isOn = useSharedValue(false);
    const height = useSharedValue(0);
    const width = useSharedValue(0);
  
    const trackAnimatedStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            isOn.value,
            [0, 1],
            [trackColors.off, trackColors.on]
        );
        const colorValue = withTiming(color, { duration });
    
        return {
            backgroundColor: colorValue,
            borderRadius: height.value / 2,
        };
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => {
        const moveValue = interpolate(
            Number(isOn.value),
            [0, 1],
            [0, width.value - height.value]
        );
        const translateValue = withTiming(moveValue, { duration });
    
        return {
            transform: [{ translateX: translateValue }],
            borderRadius: height.value / 2,
        };
    });

    useEffect(() => {

        isOn.value = value;

    }, [value]);

    return (
        <Pressable onPress={togglePress} hitSlop={10}>
            <Animated.View
                onLayout={(e) => {
                    height.value = e.nativeEvent.layout.height;
                    width.value = e.nativeEvent.layout.width;
                }}
                style={[styles.track, style, trackAnimatedStyle]}>
            <Animated.View
                style={[styles.thumb, thumbAnimatedStyle]}></Animated.View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        alignItems: 'flex-start',
        width: 44,
        height: 26,
        padding: 2,
    },
    thumb: {
        height: '100%',
        aspectRatio: 1,
        backgroundColor: colors.white,
    },
});
  