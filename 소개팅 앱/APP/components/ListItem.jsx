import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    FadeIn 
} from 'react-native-reanimated';

import { useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({ delay = 0, active, title, onPress, style }) {

    const { styles } = useStyle();
    const { width } = useSafeAreaFrame();

    // 초기값을 실제 색상으로 설정
    const borderColor = useSharedValue(active ? colors.primary : colors.greyE);
    const textColor = useSharedValue(active ? colors.primary : colors.grey9);
    const opacity = useSharedValue(0);

    // entering 대신 opacity로 fade in 처리
    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }, []);

    useEffect(() => {
        borderColor.value = withTiming(active ? colors.primary : colors.greyE, { duration: 150 });
        textColor.value = withTiming(active ? colors.primary : colors.grey9, { duration: 150 });
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: borderColor.value,
        opacity: opacity.value,
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        color: textColor.value,
    }));

    return (
        <Animated.View style={[styles.item, animatedStyle, style]}>
            <Pressable 
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} 
                onPress={onPress}
            >
                <AnimatedText style={[styles.itemText, animatedTextStyle]} numberOfLines={1}>
                    {title}
                </AnimatedText>
            </Pressable>
        </Animated.View>
    );
}


const useStyle = () => {

    const { width } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        item: {
            backgroundColor: colors.white,
            height: 56,
            borderRadius: 16,
            borderColor: colors.greyE,
            borderWidth: 1,
            width: '100%',
            maxWidth: (width - 40 - 8) / 3
        },
        itemText: {
            color: colors.grey9,
            fontFamily: fonts.medium,
            fontSize: width <= 320 ? 13 : 14,
            lineHeight: 24,
        },
    });

    return { styles };
}