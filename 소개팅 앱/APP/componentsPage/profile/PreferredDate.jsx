import { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';
import TextArea from '@/components/TextArea';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { useConfig } from '@/libs/store';

export default function Component({
    name,
    value="",
    setValue=()=>{},
    target
}) {

    const { configOptions } = useConfig();

    const insets = useSafeAreaInsets();

    return (
        <View 
            style={styles.root}
        >
            <Animated.View entering={FadeIn}>
                <Text style={styles.title}>첫만남, 내가 선호하는 데이트는?</Text>
            </Animated.View>
            
            <Animated.View entering={FadeIn} style={[{ flex: 1 }]}>
                <TextArea 
                    autoFocus="fast"
                    name={name}
                    state={value} 
                    setState={v => setValue({ value: v, name: name })} 
                    placeholder={'질문에 대답해 주세요.'} 
                    blurOnSubmit={false}
                    maxLength={255}
                    multiline
                    placeholderTextColor={colors.primary}
                    inputWrapStyle={{ height: 120, borderColor: colors.primary }}
                    inputStyle={{ color: colors.primary, fontFamily: fonts.medium }}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: rootStyle.side + 10,
        paddingTop: 30,
        gap: 20
    },
    title: {
        color: colors.dark,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.45,
    },
    scroll: {
        flex: 1, 
    },
    styleImage: {
        width: 200,
        aspectRatio: 1,
        alignSelf: 'center',
    }

    
});
