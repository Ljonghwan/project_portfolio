import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, useWindowDimensions } from 'react-native';
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
    data
}) {
    const { configOptions } = useConfig();
    const { width, height } = useWindowDimensions();

    useEffect(() => {


    }, [])

    return (
        <View style={styles.root}>
            <View style={styles.list}>
                <Text style={styles.label}>키</Text>
                <Text style={styles.title}>{configOptions?.heightOptions?.[data?.height]}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>직업</Text>
                <Text style={styles.title}>{data?.job}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>외모 점수</Text>
                <Text style={styles.title}>{configOptions?.scoreOptions?.[data?.score]}점</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>MBTI</Text>
                <Text style={styles.title}>{data?.mbti}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>성격</Text>
                <Text style={styles.title}>{data?.types?.join(", ")}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>관심사</Text>
                <Text style={styles.title}>{data?.interests?.join(", ")}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>흡연 여부</Text>
                <Text style={styles.title}>{data?.smoke}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>음주 여부</Text>
                <Text style={styles.title}>{data?.drink}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>종교</Text>
                <Text style={styles.title}>{data?.religion}</Text>
            </View>
            <View style={styles.list}>
                <Text style={styles.label}>선호 데이트</Text>
                <Text style={styles.title}>{data?.preferredDates?.join(", ")}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        gap: 8
    },
    list: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    label: {
        fontSize: 14,
        lineHeight: 24,
        color: colors.grey9,
        letterSpacing: -0.35,
        width: 80
    },
    title: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.dark,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.4,
        flex: 1
    }
});
