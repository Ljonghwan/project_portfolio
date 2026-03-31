import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    useWindowDimensions,
    TouchableOpacity
} from 'react-native';

import { router } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Carousel, { Pagination } from "react-native-reanimated-carousel";

import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

// 메인 이벤트 배너 리스트 캐러셀
export default function Component({
    style,
    pages = []
}) {

    const { styles } = useStyle();

    const { width, height } = useWindowDimensions();
    const progress = useSharedValue(0);

    const [layoutWidth, setLayoutWidth] = useState(width);

    const renderItem = ({ item, index }) => (
        <TouchableOpacity key={index} style={styles.page} activeOpacity={1} onPress={() => {
            router.navigate({
                pathname: routes.eventDetail,
                params: {
                    idx: item?.idx,
                },
            });
        }}>
            <Image source={consts.s3Url + item?.photo} style={styles.pageImage} />
        </TouchableOpacity>
    );


    return (
        <View style={[styles.root, style]} onLayout={(e) => { setLayoutWidth(e.nativeEvent.layout.width) }}>
            <Carousel
                loop={pages?.length > 1}
                width={layoutWidth}
                snapEnabled={true}
                pagingEnabled={true}
                autoPlay={true}
                autoPlayInterval={2000}
                data={pages}
                onProgressChange={progress}
                renderItem={renderItem}
                onConfigurePanGesture={gestureChain => (
                    gestureChain.activeOffsetX([-10, 10])
                )}
            />


            {/* 페이지네이션 Dot */}
            {pages?.length > 1 && (
                 <View style={styles.dotsContainer}>
                    <Pagination.Basic
                        progress={progress}
                        data={pages}
                        size={6}
                        dotStyle={{
                            borderRadius: 100,
                            backgroundColor: colors.greyD,
                        }}
                        activeDotStyle={{
                            borderRadius: 100,
                            overflow: "hidden",
                            backgroundColor: colors.main,
                        }}
                        containerStyle={[
                            {
                                gap: 5,
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
            )}
           
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({

        root: {
            position: 'relative',
            width: '100%',
            aspectRatio: 380 / 110,
        },
        page: {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.placeholder,
            borderRadius: 8,
            overflow: 'hidden',
            marginHorizontal: rootStyle.side
        },
        pageImage: {

            // marginHorizontal: rootStyle.side,
            // width: 330,
            // height: 100,
            width: '100%',
            // height: '100%',
            aspectRatio: 380 / 110,
            backgroundColor: colors.placeholder
        },
        text: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        dotsContainer: {
            position: 'absolute',
            bottom: 15,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },

    });

    return { styles }
}

