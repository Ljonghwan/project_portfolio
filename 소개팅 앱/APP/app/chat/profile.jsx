import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import BottomMultiButton from '@/components/BottomMultiButton';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';

import { ToastMessage, imageViewer } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';


const profileDepth = [
    { name: 'photoList', mode: 'photo', title: "앞으로 소개팅을 함께할 분의\n프로필 스냅샷이에요😘"},

    { name: 'style', key: 'styleOptions', title: "상대 회원님의 연애 스타일은"},
    { name: 'myStyle', key: 'myStyleOptions', title: "상대 회원님은 연인에게 이런 스타일"},
    { name: 'conflictStyle', key: 'conflictStyleOptions', title: "갈등이 생겼을 때\n상대 회원님은 이런 스타일"},
    { name: 'loveStyle', key: 'loveStyleOptions', title: "사랑앞에 상대 회원님은 이런 스타일"},

    { name: 'preferredDate', mode: 'text', title: "상대 회원님의 원하는\n첫만남, 선호하는 데이트는?"},
    { name: 'inLove',  mode: 'text', title: "상대 회원님은\n이성의 이런점에 확! 반해요 😍"},
    { name: 'message', mode: 'text', title: "상대 회원님이 생각하는\n나만의 차별적인 매력은?"},
    { name: 'attractive', mode: 'text', title: "나와 소개받는 분께 전하고 싶은 말은?"},
];


export default function Page({  }) {

    const { idx, roomIdx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const scRef = useRef(null);

    const [user, setUser] = useState(null);
    const [view, setView] = useState(false);
    const [end, setEnd] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);


    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(true); // 데이터 추가 로딩

    useEffect(() => {

        dataFunc()

    }, [idx]);

    const dataFunc = async () => {

        let sender = {
            userIdx: idx,
            roomIdx: roomIdx
        }
        const { data, error } = await API.post('/v1/chat/userProfile', sender);

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setUser(data);
        console.log('data', JSON.stringify(data, null, 2));

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }


    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
 
    const renderItem = ({ item, index }) => {
        return (
            <ScrollView style={{ width }} contentContainerStyle={{ paddingHorizontal: rootStyle.side, paddingTop: 50, paddingBottom: insets.bottom + 100 }}>
                <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 48, aspectRatio: 1/1, borderRadius: 9, backgroundColor: colors.placeholder, marginBottom: 20 }}/>

                <View style={{ marginBottom: 40 }}>
                    <Text style={{...rootStyle.font(22, colors.black, fonts.medium), lineHeight: 30 }}>{item?.title}</Text>
                    {!item?.mode && <Text style={{...rootStyle.font(22, colors.black, fonts.bold), lineHeight: 30 }}>“{user?.userDetail?.[item?.name] || "???"}” 이에요.</Text>}
                </View>

                <View style={{ marginTop: !item?.mode ? -40 : 0 }}>
                    {item?.mode === 'photo' && (
                        <View style={styles.itemList}>
                            {[...Array(4)]?.map((x, ii) => {
                                return (
                                    <TouchableOpacity 
                                        key={ii} 
                                        style={[styles.item ]} 
                                        activeOpacity={0.8}
                                        onPress={() => { 
                                            if(!user?.userDetail?.photoList?.[ii]) return;
                                            imageViewer({ index: ii, list: user?.userDetail?.photoList })
                                        }}
                                    >
                                        {user?.userDetail?.photoList?.[ii] && (
                                            <Image 
                                                source={consts.s3Url + user?.userDetail?.photoList?.[ii]} 
                                                style={[styles.itemImage]} 
                                                transition={200}
                                            />
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    )}
                    {item?.mode === 'text' && (
                        <View style={styles.box}>
                            <Text style={{...rootStyle.font(16, colors.primary, fonts.medium), lineHeight: 24 }}>{user?.userDetail?.[item?.name] || "???"}</Text>
                        </View>
                    )}
                    {!item?.mode && (
                        <Image 
                            source={consts.s3Url + (configOptions?.[item?.key]?.find(v => v?.title === user?.userDetail?.[item?.name])?.icon || configOptions?.[item?.key]?.[0]?.icon)} 
                            style={{ width: '100%', maxHeight: 380, aspectRatio: 1/1, alignSelf: 'center' }} 
                        />
                    )}
                </View>
            </ScrollView>
        )
    }

    const prevFunc = () => {
        scRef?.current?.scrollToIndex({ index: currentIndex - 1 });
    }
    const nextFunc = () => {
        if(currentIndex === profileDepth?.length - 1) {
            setEnd(true);
            return;
        }
        scRef?.current?.scrollToIndex({ index: currentIndex + 1 });
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={"#F0EEFB"}>

            {load && <Loading style={{ backgroundColor: '#F0EEFB' }} color={colors.dark} fixed entering={false}/> }


            {!view ? (
                <View style={{ flex: 1, gap: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13.5, paddingBottom: 100 }}>
                    <Text style={{...rootStyle.font(22, colors.black, fonts.semiBold), textAlign: 'center' }}>{`“${user?.name}”님에 대해서 알아볼까요 ?`}</Text>
                    <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 200, aspectRatio: 1/1, borderRadius: 36, backgroundColor: colors.placeholder }}/>
                    <Button
                        onPress={() => {setView(true)}} 
                        containerStyle={[rootStyle.flex, { gap: 4 }]}
                        frontIcon={'search'} 
                        frontIconTintColor={colors.white}
                    >
                        {`“${user?.name}”님 알아보기`}
                    </Button>
                </View>
            ) : end ? (
                <Animated.View key={'end'} entering={FadeIn} style={{ flex: 1, gap: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13.5, paddingBottom: 100 }}>
                    <Text style={{...rootStyle.font(22, colors.black, fonts.semiBold), textAlign: 'center' }}>{`“${user?.name}”님에 대해서 알아봤어요!`}</Text>
                    <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 200, aspectRatio: 1/1, borderRadius: 36, backgroundColor: colors.placeholder }}/>
                    <Button
                        onPress={() => {
                            router.back();
                        }} 
                    >
                        {`채팅방으로 돌아가기`}
                    </Button>
                </Animated.View>
            ) : (
                <Animated.View entering={FadeIn} style={{ flex: 1, paddingTop: 10 }}>
                    <View style={styles.paginationContainer}>
                        <View style={styles.pagination}>
                            {profileDepth?.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        currentIndex === index && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                    
                    <FlatList
                        ref={scRef}
                        data={profileDepth}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index}
                        horizontal
                        scrollEnabled={false}
                        pagingEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 50,
                        }}
                        bounces={true}
                        style={[{  }]}
                        contentContainerStyle={{}}
                        
                    />

                    <BottomMultiButton>
                        {currentIndex > 0 && ( <Button type={'10'} style={{ flex: 1 }} containerStyle={{ height: 48, borderRadius: 16 }} textStyle={{ fontSize: 16 }} onPress={prevFunc}>이전</Button> )}
                        <Button style={{ flex: 1 }} type={'2'} onPress={nextFunc}>다음</Button>
                    </BottomMultiButton>
                </Animated.View>
            )}

            

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        paginationContainer: {
            width: '100%',
            alignItems: 'center',
        },
        pagination: {
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: rootStyle.side,
        },
        dot: {
            flex: 1,
            height: 8,
            borderRadius: 8,
            backgroundColor: colors.greyD9,
        },
        activeDot: {
            backgroundColor: colors.white,
        },

        indexPage: {
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: 'rgba(49, 49, 49, 0.72)',
            height: 24,
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 8,
            borderRadius: 1000
        },

        itemList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10, 
            overflow: 'hidden',
            width: '100%',
            aspectRatio: 1,
            maxHeight: 380,
            alignSelf: 'center',
        },
        item: {
            width: '48.2%',            
            aspectRatio: "1/1",
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: 'transparent',
        },
        itemImage: {
            width: '100%',
            height: '100%',
            backgroundColor: colors.greyD9,
            borderRadius: 4
        },
        box: {
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.primary,
        }

    })
  
    return { styles }
}
