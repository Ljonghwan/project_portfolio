import React, { useEffect, useState, useRef } from 'react';
import {
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import Carousel, { Pagination } from "react-native-reanimated-carousel";

import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

import { useLang } from '@/libs/store';

export default function Component({
    style,
    pages = []
}) {

    const { width, height } = useWindowDimensions();
    const progress = useSharedValue(0);

    const { country } = useLang();

    const pagerRef = useRef(null);
    const [pageIndex, setPageIndex] = useState(0);

    const [viewWidth, setViewWidth] = useState(width);

    // 자동 루프 (선택사항)
    useEffect(() => {

        const interval = setInterval(() => {
            const nextIndex = (pageIndex + 1) % pages.length;
            pagerRef.current?.setPage(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [pageIndex]);


    const handlePageSelected = (e) => {
        const position = e.nativeEvent.position;
        setPageIndex(position);
    };

    const renderItem = ({ item, index }) => (
        <Pressable key={index} style={styles.page} onPress={() => {
            router.push({
                pathname: routes.eventView,
                params: {
                    idx: item?.idx
                }
            })
        }}>
            <Image source={consts.s3Url + (item?.['image_' + country])} style={styles.pageImage} contentFit='cover' />
        </Pressable>
    );

    return (
        <View
            onLayout={(e) => { setViewWidth(e.nativeEvent.layout.width); }}
            style={[styles.root, style]}
        >
            <Carousel
                loop={pages?.length > 1}
                // width={width - (rootStyle.side * 2)}
                width={viewWidth}
                snapEnabled={true}
                pagingEnabled={true}
                autoPlay={true}
                autoPlayInterval={2000}
                data={pages}
                onProgressChange={progress}
                renderItem={renderItem}
            />

            {/* <PagerView
                ref={pagerRef}
                style={{ width: '100%', aspectRatio: 330/100 }}
                initialPage={0}
                onPageSelected={handlePageSelected}
                pageMargin={20}
                overdrag
            >
                {pages.map((page, index) => (
                    <View key={index}>
                        <Pressable style={styles.page} >
                            <Text>{index}</Text>
                            <Image source={images.logo} style={styles.pageImage} contentFit='cover' />
                        </Pressable>
                    </View>
                ))}
            </PagerView> */}



            {/* 페이지네이션 Dot */}
            <View style={styles.dotsContainer}>
                <Pagination.Basic
                    progress={progress}
                    data={pages}
                    size={6}
                    dotStyle={{
                        borderRadius: 100,
                        backgroundColor: colors.taseta_sub_2,
                    }}
                    activeDotStyle={{
                        borderRadius: 100,
                        overflow: "hidden",
                        backgroundColor: colors.taseta,
                    }}
                    containerStyle={[
                        {
                            gap: 4,
                        },
                    ]}
                />

                {/* {pages.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => pagerRef.current?.setPage(index)}
                        style={[
                            styles.dot,
                            pageIndex === index ? styles.activeDot : null,
                        ]}
                    />
                ))} */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    root: {
        position: 'relative',
        width: '100%',
        // height: 110,
        aspectRatio: 330 / 110,
    },
    page: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 20 
        // marginHorizontal: 3
    },
    pageImage: {

        // marginHorizontal: rootStyle.side,
        // width: 330,
        // height: 100,
        // width: '100%',
        height: '100%',
        // height: '100%',
        aspectRatio: 330 / 110,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

});