import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    target=false
}) {

    return (
        <View style={styles.root}>

            <Image source={target ? images.profileTarget_intro : images.profile_intro} style={target ? rootStyle.profileTarget_intro : rootStyle.profile_intro} contentFit='contain'/>

            <Animated.View entering={FadeIn}>
                {target ? (
                    <Text style={styles.title}>{'이제,\n원하시는 이성을 찾는데\n'}<Text style={[styles.title, { color: colors.dark }]}>필요한 정보</Text>{'를 알려주세요!'}</Text>
                ) : (
                    <Text style={styles.title}>{'사소한 1%의\n설문 프로필을 작성해 주세요!'}</Text>
                )}
            </Animated.View>

        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingBottom: rootStyle.header.height,
        gap: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        color: colors.grey6,
        fontSize: 20,
        lineHeight: 24,
        letterSpacing: -0.5,
        textAlign: 'center'
    },
    span: {
        color: colors.dark,
        fontFamily: fonts.semiBold,
        fontSize: 20,
        lineHeight: 24,
    },
    scroll: {
        flex: 1, 
        height: '100%',
    },
    scrollBorder: {
        borderRadius: 8,
        borderColor: colors.primary,
        borderWidth: 1,
        overflow: 'hidden',
         flex: 1,
         height: '100%'
    },
    item: {
        height: 56,
        borderRadius: 8,
        borderColor: colors.greyE,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    itemActive: {
        backgroundColor: colors.white,
        borderColor: colors.primary,
        borderWidth: 1,

        shadowColor: colors.primary, 
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        // Android 그림자 속성
        elevation: 5, // Android에서 그림자 높이 (적절히 조정)
    },
    itemText: {
        color: colors.grey9,
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 24,
    },
    sigungu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    sigunguActive: {
        backgroundColor: colors.primaryLight
    },
});
