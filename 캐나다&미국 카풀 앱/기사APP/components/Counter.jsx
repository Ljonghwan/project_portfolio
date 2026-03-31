import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable
} from 'react-native';

import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    textStyle,
    value=0,
    setValue,
    depth = 1,
    unit
}) {

    const { styles } = useStyle();
    const scale = useSharedValue(1);

    const handlePress = (v) => {
        setValue(v);

        // 애니메이션: 커졌다가 원래 크기로
        scale.value = 1.3;
        scale.value = withSpring(1, { damping: 100, stiffness: 1000 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={[rootStyle.flex, { justifyContent: 'space-between' }, style]}>
            <Pressable onPress={() => handlePress(value - depth)}>
                <Image
                    source={images.min_btn_green}
                    style={rootStyle.default32}
                />
            </Pressable>
            <Animated.Text style={[{ ...rootStyle.font(20, colors.main, fonts.extraBold) }, textStyle, animatedStyle]}>{value} {unit || ""}</Animated.Text>
            <Pressable onPress={() => handlePress(value + depth)}>
                <Image
                    source={images.add_btn_green}
                    style={rootStyle.default32}
                />
            </Pressable>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
            height: '100%',
            gap: 20,
            paddingBottom: rootStyle?.header?.height
        },
        text: {
            color: colors.sub_1,
            fontSize: 20,
            fontFamily: fonts.semiBold
        },
    })

    return { styles }
}
