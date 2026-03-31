import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Flow } from 'react-native-animated-spinkit';

import colors from '@/libs/colors';

export default function Component({ isEdit=false, chatTheme }) {

    const { styles } = useStyle();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const marginTop = useSharedValue(0);
    const padding = useSharedValue(0);

    useEffect(() => {
        if (isEdit) {
            marginTop.value = withTiming(20, { duration: 150 });
            padding.value = withTiming(16, { duration: 150 });
            opacity.value = withTiming(1, { duration: 150 });
            translateY.value = withTiming(0, { duration: 150 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(20, { duration: 150 });
            marginTop.value = withTiming(0, { duration: 150 });
            padding.value = withTiming(0, { duration: 150 });
        }
    }, [isEdit]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
        marginTop: marginTop.value,
        overflow: 'hidden',
    }));

    const balloonStyle = useAnimatedStyle(() => ({
        padding: padding.value,
    }));

    return (
        <Animated.View style={[styles.item, animatedStyle]}>
            <View style={[styles.itemBottom, { flexDirection: 'row' }]}>
                <Animated.View style={[styles.itemBallon, { backgroundColor: chatTheme?.balloonBackgroundColor2 }, balloonStyle]}>
                    <Flow size={isEdit ? 36 : 0} color={chatTheme?.primary} />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const useStyle = () => {
    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        item: {
            gap: 8,
            marginTop: 20,
        },
        itemBottom: {
            alignItems: 'flex-end',
            gap: 8,
            maxWidth: '70%',
        },
        itemBallon: {
            padding: 16,
            borderRadius: 20,
            borderTopLeftRadius: 0,
            backgroundColor: colors.greyF6,
        },
    });

    return { styles };
}