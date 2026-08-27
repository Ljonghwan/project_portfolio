import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
    Platform
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    style, 
    msg="내용이 없습니다.",
    fixed,
    keyboardVerticalOffset=300
}) {

    const { styles } = useStyle();

    return (
        
        <KeyboardAvoidingView
            style={[
                styles.container, 
                fixed && { position: 'absolute', top: 0, left: 0, zIndex: 1000, paddingBottom: rootStyle?.header?.height },
                style,
            ]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            <Animated.Text style={styles.text} entering={FadeIn.duration(100)}>{msg}</Animated.Text>
        </KeyboardAvoidingView>
           
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
