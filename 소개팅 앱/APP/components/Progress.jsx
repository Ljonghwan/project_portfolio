import React, {useRef, useEffect, useState} from 'react';

import {
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    View,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhotoPopup } from '@/libs/store';

import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';


export default function Component({ now=1, max=1 }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const widthValue = useSharedValue(null);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withTiming(widthValue.value, { duration: 200 }),
        };
    });

    useEffect(() => {
        console.log('`${now / max}%`', `${now / max}%`);
        widthValue.value = `${now / max * 100}%`; 
    }, [now])

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.bar, animatedStyle]}/>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        
        root: {
            marginTop: 20,
            height: 8,
            position: 'relative',
            backgroundColor: colors.greyE,
            marginHorizontal: rootStyle.side + 10,
            borderRadius: 3,
            overflow: 'hidden',
        },

        bar: {
            minWidth: '1%',
            maxWidth: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: colors.primary,
            borderRadius: 3,
        },
       
    })
  
    return { styles }
}