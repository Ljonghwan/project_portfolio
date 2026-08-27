import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    TouchableOpacity,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions
} from 'react-native';

import { router } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Carousel, { Pagination } from "react-native-reanimated-carousel";

import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';

import Manager from '@/components/badges/Manager';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { imageViewer } from '@/libs/utils';
import dayjs from 'dayjs';
import rootStyle from '@/libs/rootStyle';


// 메인 탑비주얼팀 리스트 캐러셀
export default function Component({ 
    style,
    pages=[]
 }) {

    const { styles } = useStyle();

    const { width, height } = useWindowDimensions();
    const progress = useSharedValue(0);

    const renderItem = ({ item, index }) => (
        <TouchableOpacity key={index} style={styles.page} activeOpacity={1} onPress={() => {
            imageViewer({ index: index, list: pages })
        }}>
            <Image source={consts.s3Url + item} style={styles.pageImage} />
            {index === 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>대표</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, style]}>

            <Carousel
				loop={pages?.length > 1}
				width={width}
				snapEnabled={true}
				pagingEnabled={true}
				data={pages}
                onProgressChange={progress}
				renderItem={renderItem}
                onConfigurePanGesture={gestureChain => (
                    gestureChain.activeOffsetX([-10, 10])
                )}
			/>


            {/* 페이지네이션 Dot */}
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
                        backgroundColor: colors.dark,
                    }}
                    containerStyle={[
                        {
                            gap: 5,
                        },
                    ]}
                />
             
            </View>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        
        root: {
            position: 'relative',
            width: '100%',
            aspectRatio: 1/1,
            marginBottom: -20
        },
        page: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            overflow: 'hidden',
            paddingHorizontal: 20
        },
     
        pageImage: {
            // flex: 1,
            // maxWidth: '25%',
            // marginHorizontal: rootStyle.side,
            width: '100%',
            // height: 100,
            // width: '100%',
            // height: '100%',
            aspectRatio: 1/1,
            borderRadius: 8,
            backgroundColor: colors.placeholder
        },
        badge: {
            position: 'absolute',
            top: 8,
            left: 28,
            paddingHorizontal: 8,
            height: 24,
            borderRadius: 8,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center'
        },
        badgeText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.white,
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
