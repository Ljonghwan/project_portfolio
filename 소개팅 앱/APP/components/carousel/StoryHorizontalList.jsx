import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { router } from "expo-router";
import { Image } from 'expo-image';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { elapsedTime } from '@/libs/utils';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function StoryHorizontalList({ data=[] }) {
    const { width } = useSafeAreaFrame();
    const scrollX = useSharedValue(0);

    const ITEM_WIDTH = 120;
    const ITEM_GAP = 0;
    const INDICATOR_WIDTH = width - (rootStyle.side * 2);  // 전체 인디케이터 너비
    const THUMB_WIDTH = 40;      // 움직이는 바 너비

    // 스크롤 핸들러
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    // 전체 컨텐츠 너비 계산
    const contentWidth = data.length * (ITEM_WIDTH + ITEM_GAP) - ITEM_GAP;
    const maxScroll = contentWidth - width;

    // 인디케이터 애니메이션 스타일
    const indicatorStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            scrollX.value,
            [0, maxScroll],
            [0, INDICATOR_WIDTH - THUMB_WIDTH],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateX }],
        };
    });


    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            style={{ width: 120, gap: 12, alignItems: 'center' }}
            onPress={() => {
                router.navigate({
                    pathname: routes.storyDetail,
                    params: {
                        idx: item?.idx
                    }
                });
            }}
            activeOpacity={1}
        >
            <Image source={consts.s3Url + item?.photo} style={{ width: 90, aspectRatio: 1 / 1, borderRadius: 100 }} />
            <View style={{ gap: 5, paddingHorizontal: 10 }}>
                <Text style={[rootStyle.font(14, colors.black, fonts.medium), { flexShrink: 1, textAlign: 'center', letterSpacing: -0.7 }]} numberOfLines={1}>{item?.title}</Text>
                <Text style={[rootStyle.font(10, colors.text_info, fonts.regular), { textAlign: 'center' }]}>{elapsedTime(item?.createAt)}</Text>
            </View>
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <AnimatedFlatList
                data={data}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ 
                    paddingHorizontal: 10,
                }}
            />

            {/* 스크롤 인디케이터 */}
            <View style={styles.indicatorContainer}>
                <View style={[styles.indicatorTrack, { width: INDICATOR_WIDTH }]}>
                    <Animated.View
                        style={[
                            styles.indicatorThumb,
                            { width: THUMB_WIDTH },
                            indicatorStyle
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingTop: 20,
        gap: 20
    },
    item: {
        height: 100,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorContainer: {
        alignItems: 'center',
    },
    indicatorTrack: {
        height: 1,
        backgroundColor: colors.greyD,
        borderRadius: 2,
    },
    indicatorThumb: {
        height: 2,
        backgroundColor: colors.indicator,
        borderRadius: 2,
        marginTop: -0.5,
    },
});