import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    Text,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { Flow } from 'react-native-animated-spinkit'

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Loading({
    style, 
    color=colors.white,
    fixed,
    entering=true,
    exiting=true
}) {

    const { styles } = useStyle();

    return (
        <Animated.View
            entering={entering ? FadeIn.duration(200) : null}
            exiting={exiting ? FadeOut.duration(200) : null}
            style={[
                styles.container, 
                style,
                fixed && { position: 'absolute', top: 0, left: 0, zIndex: 10000, paddingBottom: rootStyle?.header?.height }
            ]}
        >
            <Flow />
        </Animated.View>
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'row',
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
            height: '100%',
        },
        spiner: {
            
        },
    })
  
    return { styles }
}
