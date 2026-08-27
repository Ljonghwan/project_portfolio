import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Pressable,
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
import Empty from '@/components/Empty';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import routes from '@/libs/routes';

import { elapsedTime } from '@/libs/utils';
import dayjs from 'dayjs';


// 메인 만남 리스트 캐러셀
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
                    <TouchableOpacity 
                        key={`${index}_${i}`} 
                        style={[styles.pageItem, { width: ( layoutWidth - 44 - 24 ) / 4 } ]} 
                        onPress={() => {
                            router.navigate({
                                pathname: routes.storyDetail,
                                params: {
                                    idx: x?.idx
                                }
                            });
                        }}
                        activeOpacity={1}
                    >
                        <Image source={consts.s3Url + x?.photo} style={styles.pageImage} />
                        {dayjs(x?.createAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') && <Image source={images.new} style={styles.pageImageNew} /> }
                        <Text style={styles.pageText}>{elapsedTime(x?.createAt)}</Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    );

    return (
        <View style={[styles.root, style]} onLayout={(e) => { setLayoutWidth(e.nativeEvent.layout.width) }}>

            {pages?.length < 1 ? (
                <Empty msg={'이번 주 만남 스토리가 없습니다.'}/>
            ) : (
                <>
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
                </>
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
            aspectRatio: 345/114,
            marginBottom: 15
        },
        page: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 8,
            overflow: 'hidden',
            marginHorizontal: 20,
        },
        pageItem: {
            gap: 7,
            paddingTop: 7,
        },
        pageImage: {
            // flex: 1,
            // maxWidth: '25%',
            // marginHorizontal: rootStyle.side,
            width: '100%',
            // height: 100,
            // width: '100%',
            // height: '100%',
            borderRadius: 20,
            aspectRatio: 1/1,
            backgroundColor: colors.placeholder
        },
        pageImageNew: {
            width: '25%',
            aspectRatio: 1/1,
            position: 'absolute',
            top: 0,
            right: -4
        },
        pageText: {
            fontSize: 14,
            letterSpacing: -0.35,
            lineHeight: 20,
            color: colors.grey76,
            textAlign: 'center'
        },
       
        dotsContainer: {
            position: 'absolute',
            bottom: -15,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        
    });
  	return { styles }
}
