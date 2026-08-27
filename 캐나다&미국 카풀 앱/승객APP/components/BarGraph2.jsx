import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    total=0,
    value=0,
    delay=0,
    title=""
}) {

    const { styles } = useStyle();

    const [ width, setWidth ] = useState(0);

    const animatedValue = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withDelay( 300 + delay, withTiming(animatedValue.value, { duration: 300 }) )
        };
    });

    useEffect(() => {
        if(width) animatedValue.value = (width * 0.5) + ((width * 0.4) * (value / total));
    }, [total, value, width])

    const onContentLayout = (e) => {
		setWidth(e.nativeEvent.layout.width);
	};

    return (
        <View style={ styles.container } onLayout={onContentLayout}>
            <Animated.View key={title} style={[ styles.bar, animatedStyle ]} />
            <View style={styles.box}>
                <Text style={{...rootStyle.font(16, colors.white, fonts.medium )}}>{title}</Text>
                <Text style={{...rootStyle.font(16, colors.taseta )}}>{value}</Text>
            </View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1, 
            height: 30,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.taseta_sub_2
        },
        bar: {
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            backgroundColor: colors.taseta,
            borderRadius: 12
        },
        box: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12
        }
    })

    return { styles }
}
