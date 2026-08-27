import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


export default function Component({
    msg
}) {

    return (
        <Animated.View entering={FadeInRight}>
            <Text style={styles.errMsg}>{msg}</Text>        
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    errMsg: {
        fontSize: 14,
        color: colors.text_popup,
        marginTop: -4,
        letterSpacing: -0.32
    },
});
