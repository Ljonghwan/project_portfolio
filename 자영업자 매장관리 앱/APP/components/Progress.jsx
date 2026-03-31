import React, { useEffect } from 'react';

import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';


import colors from '@/libs/colors';


export default function Component({ now=1, max=1 }) {

    const { styles } = useStyle();

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

    
    const styles = StyleSheet.create({
        
        root: {
            width: '100%',
            height: 4,
            position: 'relative',
            backgroundColor: colors.greyE
        },

        bar: {
            minWidth: '1%',
            maxWidth: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: colors.primary
        },
       
    })
  
    return { styles }
}