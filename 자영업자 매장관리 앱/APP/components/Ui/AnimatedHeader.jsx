import React, { useRef, useState } from 'react';

import {
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import Text from '@/components/Text';

export default function Header({
    header,
    bg,
    scrollY // 스크롤 값 받기
}) {
    const { presentation } = useLocalSearchParams();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const paddingTop = (presentation && Platform.OS === 'ios') ? 0 : insets?.top;
    const headerHeight = rootStyle?.header?.height + ((presentation && Platform.OS === 'ios') ? 0 : insets?.top);

    // 스크롤에 따른 애니메이션 스타일
    const animatedHeaderStyle = useAnimatedStyle(() => {
        const SCROLL_THRESHOLD = 100; // 변화 시작 위치
        
        // 배경색 변화 (투명 -> 불투명)
        const backgroundColor = scrollY.value > SCROLL_THRESHOLD 
            ? withTiming(bg, { duration: 200 }) 
            : withTiming(colors.white, { duration: 200 });
        
        return {
            backgroundColor
        };
    });

    // 텍스트 색상 변화
    const animatedTextStyle = useAnimatedStyle(() => {
        const SCROLL_THRESHOLD = 100;
        
        const opacity = scrollY.value > SCROLL_THRESHOLD 
            ? withTiming(1, { duration: 200 }) 
            : withTiming(0, { duration: 200 });
        
        return {
            opacity
        };
    });

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    paddingTop: paddingTop,
                    height: headerHeight,
                    backgroundColor: 'red'
                },
                animatedHeaderStyle
            ]}
        >
            <View style={styles.container}>
                {header?.title && (
                    <View style={[rootStyle.flex, { flex: 1, gap: 2, paddingHorizontal: 60 }]}>
                        <Animated.View style={[]}>
                            <Text 
                                numberOfLines={1} 
                                style={[styles.header_title, header?.longTitle && { fontSize: 18 }]}
                            >
                                {header?.title}
                            </Text>
                           
                        </Animated.View>
                    </View>
                )}

                {header?.left && (
                    <TouchableOpacity
                        style={styles.left}
                        onPress={header?.left?.onPress || null}
                        hitSlop={10}
                    >
                        {header?.left?.icon && (
                            <Image 
                                source={images?.[header?.left?.icon]} 
                                style={[rootStyle?.[header?.left?.icon] || rootStyle?.default]} 
                            />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        header: {
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',

        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1
        },
        header_title: {
            fontSize: 15,
            color: colors.header,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            flexShrink: 1
        },
        header_left_title: {
            fontSize: 24,
            lineHeight: 34,
            fontFamily: fonts.semiBold,
            color: colors.textPrimary,
            letterSpacing: -0.6
        },
        header_left_title_with_icon: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            color: colors.dark,
        },
        header_text_button: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.text_popup,
            textAlign: 'center',
        },
        left: {
            height: rootStyle?.header?.height,
            position: 'absolute',
            left: 18,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 3,
        },
        leftImage: {
            width: 24,
            height: 24,
            borderRadius: 100,
            marginRight: 4,
            backgroundColor: 'red'
        },
      
    })

    return { styles }
}
