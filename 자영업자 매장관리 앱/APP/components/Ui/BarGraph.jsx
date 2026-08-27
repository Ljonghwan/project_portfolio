import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    value=0,
    delay=0
}) {

    const { styles } = useStyle();

    const [ width, setWidth ] = useState(0);

    const animatedValue = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withDelay( 300 + delay, withTiming(animatedValue.value, { duration: 500, easing: Easing.inOut(Easing.ease) }) )
        };
    });

    useEffect(() => {
        animatedValue.value = width * value;
    }, [value, width])

    const onContentLayout = (e) => {
		setWidth(e.nativeEvent.layout.width);
	};

    return (
        <View style={ styles.container } onLayout={onContentLayout}>
        
            <Animated.View style={[ styles.bar, animatedStyle ]} />
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1, 
            height: 13,
            borderRadius: 1000,
            overflow: 'hidden',
            backgroundColor: colors.e5e7eb
        },
        bar: {
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 1000
        }
    })

    return { styles }
}
