import React, {useEffect, useState} from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Text from '@/components/Text';
import Icon from '@/components/Icon';

import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import colors from '@/libs/colors';


export default function Component({ 
    label,
    subTitle,
    style,
    checkStyle,
    small,
    onNav,
    hideNav,
    checked,
    onCheckedChange,
    fontStyle,
    underLine }) {

    const [value, setValue] = useState(checked);
    const opacity = useSharedValue(0);

    // 소스가 변경될 때마다 애니메이션 실행
    useEffect(() => {
        // 페이드 아웃
        opacity.value = withTiming(0, { duration: 0 }, () => {
            // 페이드 아웃 완료 후 페이드 인
            opacity.value = withTiming(1, { duration: 300 });
        });
    }, [checked]);
  
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });
        
    return (
        <TouchableOpacity
            hitSlop={10}
            onPress={() => {
                setValue(!value);
                onCheckedChange && onCheckedChange(!checked);
                (!onCheckedChange && onNav) && onNav();
            }}
            style={[styles.root, style, subTitle && { alignItems: 'flex-start' }]}
        >
                
            <Image source={checked ? images.radio_on : images.radio_off} style={[rootStyle.default20, checkStyle]} />

            <View style={[styles.main, !hideNav && {flex: 1}]}>
                <Text style={[styles.title, fontStyle, underLine && styles.titleUnderLine]}>{label}</Text>
                {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
            </View>

            {onNav && (
                <Image source={images.link} style={[rootStyle.default]} />
            )}

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {
        width: "100%",
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    
    icon: {
    },
    title: {
        fontSize: 16,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.4,
        color: colors.dark,
    },
    titleUnderLine: {
        textDecorationLine: 'underline',
        textDecorationColor: colors.grey9,
    },
    navBox: {
        width: 24, 
        height: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    
    subTitle: {
        fontSize: 12,
        color: '#8F9098',
        fontFamily: fonts.pretendardRegular,
        letterSpacing: -0.2
    },
    nav: {
        fontSize: 12,
        lineHeight: 20,
        color: '#8F9098',
        textDecorationLine: 'underline'
    }
});