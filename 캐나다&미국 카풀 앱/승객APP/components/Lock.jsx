import React, { useEffect, useState, useRef } from 'react';
import {
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

export default function Component({ 
    style,
 }) {

    return (
        <View style={[styles.root, style]} >
            <Image source={images.lock} style={rootStyle.lock} />
            <View style={{ gap: 11 }}>
                <Text style={styles.title}>{lang({ id: 'your_approval' })}</Text>
                <Text style={styles.subTitle}>{lang({ id: 'your_approval_message' })}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20
    },
    title: {
        textAlign: 'center',
        fontSize: 40,
        color: colors.main,
        fontFamily: fonts.goudy
    },
    subTitle: {
        textAlign: 'center',
        fontSize: 16,
        color: colors.sub_1,
        fontFamily: fonts.medium,
        letterSpacing: -0.64,
        lineHeight: 22
    },
});