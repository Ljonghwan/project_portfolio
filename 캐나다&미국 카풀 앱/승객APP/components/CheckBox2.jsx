import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


export default function Component({ 
    label,
    subTitle,
    require,
    style,
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
            }}
            style={[styles.root, style, subTitle && { alignItems: 'flex-start' }]}>
                
            <Animated.View style={animatedStyle}>
                <Image source={checked ? images.check_on_2 : images.check_off_2} style={[rootStyle.default]} />
            </Animated.View>

            <View style={[styles.main, !hideNav && {flex: 1}]}>
                <Text style={[styles.title, fontStyle, underLine && styles.titleUnderLine]}>
                    {label}
                    {require && <Text style={[styles.title, { color: colors.text_popup }]}>*</Text>}
                </Text>
                {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
            </View>
            {onNav && (
                <Icon img={images.link} imgStyle={rootStyle.default} hitSlop={10} onPress={onNav}/>
            )}
           
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {
        width: "100%",
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: 6,
    },
    
    icon: {
    },
    title: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.sub_1,
        fontFamily: fonts.medium,
        letterSpacing: -0.32
    },
    titleUnderLine: {
        textDecorationLine: 'underline',
        textDecorationColor: '#000',
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