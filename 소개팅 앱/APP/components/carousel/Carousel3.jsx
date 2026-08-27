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

import { elapsedTime } from '@/libs/utils';
import dayjs from 'dayjs';
import rootStyle from '@/libs/rootStyle';

function Item({ x, i, style }) {

    const { styles } = useStyle();
    
    const [like, setLike] = useState(x?.isLike);

    useEffect(() => {
        setLike(x?.isLike);
    }, [x]);

    const likeFunc = async () => {

        let sender = {
            idx: x?.idx
        }
        
        const { data, error } = await API.post('/v1/manager/like', sender);

        setLike(data);
    }

    return (
        <TouchableOpacity 
            style={[
                styles.pageItem,
                {
                    borderColor: consts.manager?.[`manager${x?.type}`]?.color,
                },
                style
            ]} 
            onPress={() => {
                router.navigate({
                    pathname: routes.managerDetail,
                    params: {
                        idx: x?.idx,
                        title: consts.manager?.[`manager${x?.type}`]?.title
                    },
                });
            }}
            activeOpacity={1}
        >
            <View>
                <Image source={consts.s3Url + x?.profile} style={styles.pageImage} />
                <TouchableOpacity hitSlop={5} activeOpacity={0.95} onPress={likeFunc} style={styles.pageImageNew}>
                    <Image source={like ? images.like_on : images.like_off} style={[rootStyle.like]} />
                </TouchableOpacity>
            </View>
            
            <Text style={styles.pageText} numberOfLines={1}>{x?.nickName}</Text>

            <View style={[rootStyle.flex, { gap: 2 }]}>
                <View style={styles.dash} />
                <Manager level={x?.type} />
                <View style={styles.dash} />
            </View>

            <Text style={styles.pageText2} numberOfLines={2}>{x?.memo}</Text>
        </TouchableOpacity>
    )
    
}

// 메인 탑비주얼팀 리스트 캐러셀
export default function Component({ 
    style,
    pages=[]
 }) {

    const { styles } = useStyle();

    const { width, height } = useWindowDimensions();
    const progress = useSharedValue(0);

    const [layoutWidth, setLayoutWidth] = useState(width);

    const renderItem = ({ item, index }) => (
        <View key={index} style={[styles.page]} >
            {item?.map((x, i) => {
                return (
                    <Item key={`${index}_${i}`} x={x} i={i} style={{ width: ( layoutWidth - 40 - 10 ) / 3 }}/>
                )
            })}
        </View>
    );

    return (
        <View style={[styles.root, style]} onLayout={(e) => { setLayoutWidth(e.nativeEvent.layout.width) }}>

            <Carousel
				loop={pages?.length > 1}
				width={layoutWidth}
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
                        backgroundColor: colors.main,
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
            height: 170,
            marginBottom: 30
        },
        page: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 4.5,
            overflow: 'hidden',
            marginHorizontal: 20,
        },
        pageItem: {
            height: '100%',
            paddingHorizontal: 5,
            paddingVertical: 11,
            borderWidth: 0.5,
            borderRadius: 9,
            alignItems: 'center',
            gap: 7,
        },
        pageImage: {
            // flex: 1,
            // maxWidth: '25%',
            // marginHorizontal: rootStyle.side,
            width: 60,
            // height: 100,
            // width: '100%',
            // height: '100%',
            borderRadius: 1000,
            aspectRatio: 1/1,
            backgroundColor: colors.placeholder
        },
        pageImageNew: {
            position: 'absolute',
            bottom: -1,
            right: -10,
        },
        pageText: {
            fontSize: 13,
            letterSpacing: -0.25,
            fontFamily: fonts.medium,
            color: colors.dark,
            textAlign: 'center'
        },
        pageText2: {
            fontSize: 11,
            letterSpacing: -0.2,
            color: colors.grey76,
            textAlign: 'center'
        },
        dash: {
            flex: 1,
            height: 0.45,
            borderStyle: 'dashed',
            borderColor: colors.greyD,
            borderWidth: 0.45,

        },
        dotsContainer: {
            position: 'absolute',
            bottom: -30,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        
    });
  	return { styles }
}
