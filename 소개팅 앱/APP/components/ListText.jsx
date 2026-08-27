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
    containerStyle,
    span,
    children,
    ...rest
}) {

    const { styles } = useStyle();

    return (
        <View
            style={[
                styles.container, 
                containerStyle,
            ]}
        >
            
            <Text style={[style, !span && styles.dot]}>{span || ' · '}</Text>
            <Text style={[style, { flex: 1 }]} {...rest}>{children}</Text>
        </View>
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: "flex-start",
        },
        dot: {
            fontSize: 22,
            lineHeight: 22
        }
    })
  
    return { styles }
}
