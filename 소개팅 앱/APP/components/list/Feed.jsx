import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { router, useRootNavigationState, } from "expo-router";
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import dayjs from 'dayjs';

import Text from '@/components/Text';

import Manager from '@/components/badges/Manager';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import API from '@/libs/api';

import { numFormat } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
export default function Component({
    style,
    item=null,
    index,
    type="feed"
}) {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const [like, setLike] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        setLike(item?.isLike);
        setLikeCount(item?.likeCount || 0);
    }, [item]);

    const likeFunc = async () => {

        let sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post(type === 'feed' ? '/v1/feed/like' : '/v1/manager/like', sender);

        setLike(data);
        setLikeCount(prev => Math.max((prev*1) + (data ? 1 : -1), 0))

    }

    return (
        <AnimatedTouchable 
            entering={Platform.OS === 'ios' ? FadeIn : null} 
            exiting={Platform.OS === 'ios' ? FadeOut.duration(50) : null} 
            style={[styles.item, { paddingRight: index % 2 === 0 ? 8 : rootStyle.side, paddingLeft: index % 2 === 0 ? rootStyle.side : 8 }]} 
            activeOpacity={1} 
            onPress={() => {  
                router.navigate({
                    pathname: type === 'feed' ? routes.feedDetail : routes.managerDetail,
                    params: {
                        idx: item?.idx
                    }
                });
            }}
        >
            
            <ImageBackground source={consts.s3Url + (type === 'feed' ? item?.photoList?.[0] : item?.profile)} style={styles.itemImage} transition={200} recyclingKey={item?.idx + ""}> 
                <View style={{ padding: 5 }}>
                    <Manager level={ type === 'feed' ? item?.creator?.type : item?.type}/>
                </View>

                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                    style={styles.box}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                >
                    <View style={[rootStyle.flex, { gap: 9 }]}>
                        {type === 'feed' ? (
                            <View style={[rootStyle.flex, { gap: 4 }]}>
                                <Image source={images.list_comment} style={rootStyle.default14} />
                                <Text style={styles.count}>{numFormat(Math.max(item?.commentCount, 0))}</Text>
                            </View>
                        ) : (
                            <View style={[rootStyle.flex, { gap: 4 }]}>
                                <Image source={images.list_feed} style={rootStyle.default14} />
                                <Text style={styles.count}>{numFormat(Math.max(item?.feedCount, 0))}</Text>
                            </View>
                        )}
                        
                        <View style={[rootStyle.flex, { gap: 4 }]}>
                            <Image source={images.list_fav} style={rootStyle.default14} />
                            <Text style={styles.count}>{numFormat(Math.max(likeCount, 0))}</Text>
                        </View>
                    </View>
                    {/* <TouchableOpacity style={styles.favButton} hitSlop={10} activeOpacity={0.7} onPress={likeFunc}>
                        <Image source={like ? images.list_fav_on : images.list_fav_off} style={rootStyle.default16} transition={100}/>
                    </TouchableOpacity> */}
                </LinearGradient>

            </ImageBackground>

            {type === 'feed' ? (
                <View style={styles.container}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                        <Image source={consts.s3Url + item?.creator?.profile} style={[rootStyle.default, { borderRadius: 100, backgroundColor: colors.placeholder }]} />
                        <Text style={{...rootStyle.font(14, colors.dark, fonts.bold ), flexShrink: 1 }} numberOfLines={1}>{item?.creator?.nickName}</Text>
                    </View>
    
                    <Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium ), flexShrink: 1 }} numberOfLines={2}>{item?.content}</Text>
                    <Text style={{...rootStyle.font(10, colors.text_info, fonts.medium ) }}>{dayjs(item?.createAt).format('YYYY-MM-DD')}</Text>
                    {/* <Text style={styles.listItemContent} numberOfLines={3}>{item?.content}</Text> */}
                </View>
            ) : (
                <View style={[ { gap: 2 }]}>
                    <Text style={{...rootStyle.font(14, colors.dark, fonts.bold ), flexShrink: 1 }} numberOfLines={1}>{item?.nickName}</Text>
                    <Text style={{...rootStyle.font(12, colors.text_info, fonts.medium ), flexShrink: 1 }} numberOfLines={2}>{item?.memo}</Text>
                </View>
            )}
            
        </AnimatedTouchable>
    );
}


const useStyle = () => {

    const { width } = useSafeAreaFrame();
    
    const styles = StyleSheet.create({
        item: {
            flex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: rootStyle.side,
            paddingHorizontal: rootStyle.side,
            gap: 8,
            alignSelf: 'stretch',
        },
        itemImage: {
            width: '100%',
            aspectRatio: 1/1,
            borderRadius: 16,
            backgroundColor: colors.placeholder,
            overflow: 'hidden',
        },
        box: {
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            padding: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
        },
        count: {
            fontSize: 10,
            color: colors.white,
            letterSpacing: -0.25,
            fontFamily: fonts.medium,
        },
        favButton: {
            width: 24,
            aspectRatio: 1,
            borderRadius: 100,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',

            shadowColor: colors.black, // iOS 그림자
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        container: {
            gap: 10,
            flex: 1,
            justifyContent: 'space-between',
        }
    });

    return { styles }
}
