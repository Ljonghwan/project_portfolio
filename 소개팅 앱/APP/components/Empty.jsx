import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    style, 
    msg="내용이 없습니다.",
    fixed,
}) {

    const { styles } = useStyle();

    return (
        <View
            style={[
                styles.container, 
                fixed && { position: 'absolute', top: 0, left: 0, zIndex: 1000, paddingBottom: rootStyle?.header?.height },
                style,
            ]}
        >
            <Text style={styles.text}>{msg}</Text>
        </View>
           
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
        text: {
            color: colors.grey9,
            fontSize: 14
        },
    })
  
    return { styles }
}
