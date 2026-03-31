import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Platform, RefreshControl, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

import { FlashList } from '@shopify/flash-list';
import _ from 'lodash';
import dayjs from 'dayjs';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Empty from '@/components/Empty';
import Select from '@/components/Select';
import SelectLabel from '@/components/SelectLabel';
import Info from '@/components/Info';
import HiddenText from '@/components/HiddenText';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import Level from '@/components/badges/Level';

import HeaderBadge from '@/components/chatTheme/HeaderBadge';

import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import chatStyle from '@/libs/chatStyle';
import chatImages from '@/libs/chatImages';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { ToastMessage, elapsedTime, useInterval, numFormat, formatTime } from '@/libs/utils';


import { useUser, useEtc } from '@/libs/store';

export default function Page({ }) {

    const { styles } = useStyle();

    const { roomIdx } = useLocalSearchParams();

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomTabHeight = useBottomTabBarHeight();
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser();
    const { goTop } = useEtc();

    const listRef = useRef(null);
    const filterRef = useRef(null);
    const tabRefs = useRef([]);
    const inputRef = useRef(null);


    const [room, setRoom] = useState(null); // 
    const [data, setData] = useState(null);
    const [isKeepOn, setIsKeepOn] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (roomIdx) roomInfo(dataFunc);
        }, [roomIdx])
    );

    useEffect(() => {
        if (reload) {
            roomInfo(dataFunc);
        }
    }, [reload]);


    const roomInfo = async (callback) => {

        let sender = {
            roomIdx: roomIdx,
            viewer: true
        }

        const { data, error } = await API.post('/v1/chat/roomInfo', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setRoom(data);
        setIsKeepOn(data?.isKeepOn) // 채팅 계속유지

        if (callback) await callback(data);

    }

    const dataFunc = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/report', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        setData(data);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }


    const chatTheme = chatStyle?.[`chat_season_${isKeepOn ? 5 : room?.dayCount > 4 ? 4 : room?.dayCount}`];

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        title: '사계로그',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'season',
            style: {
                width: 24,
                height: 24,
            },
        }
    };


    return (
        <Layout header={header} >

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}

            <ScrollView 
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 12,
                    paddingBottom: bottomTabHeight + insets?.bottom + 20,
                }}
            >
                <View>
                 
                    <HeaderBadge room={room} chatTheme={chatTheme} seasonLog={true} />

                    <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16, marginTop: 12 }]}>
                        <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_5?.systemBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                            <Image source={chatImages.chat_season_5_fit} style={chatStyle?.chat_season_5?.fitIconSize || rootStyle.default} transition={200} />
                        </View>

                        <View style={[{ flex: 1, gap: 4 }]}>
                            <Text style={{ ...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_5?.primary, fonts.bold,) }}>사계 리포트</Text>
                            <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 360 ? 12 : 14, chatStyle?.chat_season_5?.primary, fonts.medium,), letterSpacing: -0.35 }}>우리는 지금까지 어떻게 지내고 있을까요?</Text>
                        </View>
                    </View>

                    {room?.user?.status === 1 && (
                        <View style={{ marginTop: 10 }}>
                            <Button
                                containerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                frontIcon="search"
                                frontIconTintColor={colors.white}
                                textStyle={{ fontSize: 16 }}
                                onPress={() => {
                                    router.navigate({
                                        pathname: routes.chatProfile,
                                        params: {
                                            idx: room?.user?.idx,
                                            roomIdx: room?.idx
                                        }
                                    })
                                }}
                            >
                                {`“${room?.user?.name}”님 알아보기`}
                            </Button>
                        </View>
                    )}


                    <View style={{ gap: 10, marginTop: 10 }}>
                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <View style={styles.box}>
                                <View style={{ gap: 10 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Image source={chatImages.chat_season_5_report_1} style={rootStyle.default26} transition={200}/>
                                        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7} onPress={() => {
                                            router.navigate({
                                                pathname: routes.chatPicketInfo,
                                            })
                                        }}>
                                            <Image source={images.search} style={rootStyle.default14} tintColor={colors.white}/>
                                            <Text style={{...rootStyle.font(12, colors.white, fonts.regular )}}>알아보기</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.boxText1}>{`1% 회원을 몇번이나\n픽 했을까?`}</Text>
                                </View>
                                
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    {data?.flirting >= 4 && <Image source={images.vip_badge} style={[{ width: 48, aspectRatio: 52 / 20 }]} transition={100}/>}

                                    <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 5 }]}>
                                        <Image source={images.picket} style={[rootStyle.picket, { width: 21 }]} transition={200}/>
                                        <Text style={{...rootStyle.font(14, chatStyle?.chat_season_5?.primary, fonts.semiBold )}}>{`${numFormat(data?.flirting)}장`}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.box}>
                                <View style={{ gap: 10 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Image source={chatImages.chat_season_5_report_2} style={rootStyle.default26} transition={200}/>
                                        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7} onPress={() => {
                                            router.navigate({
                                                pathname: routes.chatSuperpicketInfo,
                                            })
                                        }}>
                                            <Image source={images.search} style={rootStyle.default14} tintColor={colors.white}/>
                                            <Text style={{...rootStyle.font(12, colors.white, fonts.regular )}}>알아보기</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.boxText1}>{`난 당신이 정말 마음에 들어요.\n당신을 ‘픽’했습니다.`}</Text>
                                </View>

                                <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 5 }]}>
                                    <Image source={images.super_picket} style={[rootStyle.default20]} transition={200}/>
                                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_5?.primary, fonts.semiBold )}}>{`${numFormat(data?.superPicket)}장`}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <View style={styles.box}>
                                <View style={{ gap: 10 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Image source={chatImages.chat_season_5_report_3} style={rootStyle.default26} transition={200}/>
                                    </View>
                                    <Text style={styles.boxText1}>{`우린 얼마나 이야기했을까?`}</Text>
                                </View>
                                
                                <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 5 }]}>
                                    <Image source={chatImages.chat_season_5_report_7} style={[rootStyle.default18]} transition={200}/>
                                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_5?.primary, fonts.semiBold )}}>{`${numFormat(data?.chatCount)}번`}</Text>
                                </View>
                            </View>
                            <View style={styles.box}>
                                <View style={{ gap: 10 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Image source={chatImages.chat_season_5_report_4} style={rootStyle.default26} transition={200}/>
                                    </View>
                                    <Text style={styles.boxText1}>{`서로의 목소리를 확인한 시간`}</Text>
                                </View>

                                <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 5 }]}>
                                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_5?.primary, fonts.semiBold )}}>{`${numFormat(data?.callCount)}회 / ${formatTime(data?.callTime)}`}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[rootStyle.flex, { gap: 10, }]}>
                            {data?.finalType === 'wait' ? (
                                <View style={[styles.box, { alignItems: 'center', backgroundColor: '#D3D3D380'}]}>
                                    <View style={{ gap: 10, alignItems: 'center' }}>
                                        <Image source={chatImages.chat_season_5_report_5} style={rootStyle.default26} transition={200} tintColor={colors.grey5}/>
                                        <Text style={[styles.boxText1, { color: colors.grey5, letterSpacing: 0 }]}>{`최종 선택`}</Text>
                                    </View>
                                    
                                    <View style={[rootStyle.flex, { width: 170, height: 28, backgroundColor: colors.greyA, borderRadius: 6 }]}>
                                        <Text style={{...rootStyle.font(12, colors.grey5, fonts.semiBold )}}>{`최종 선택은 겨울에 가능합니다.`}</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.box, { alignItems: 'center'}]}>
                                    <View style={{ gap: 10, alignItems: 'center' }}>
                                        <Image source={chatImages.chat_season_5_report_5} style={rootStyle.default26} transition={200}/>
                                        {/* <Text style={styles.boxText1}>{`최종 선택`}</Text> */}
                                        <Text style={[styles.boxText1, { letterSpacing: 0 }]}>{`최종 선택`}</Text>
                                    </View>
                                    
                                    {data?.finalType === 'select' ? (
                                        <TouchableOpacity 
                                            style={[rootStyle.flex, { width: 170, height: 28, backgroundColor: colors.primary, borderRadius: 8 }]} 
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                router.navigate({
                                                    pathname: routes.chatFinal,
                                                    params: {
                                                        roomIdx: room?.idx,
                                                        superPicket: room?.superPicket || 0
                                                    }
                                                })
                                            }}
                                        >
                                            <Text style={{...rootStyle.font(12, colors.white, fonts.semiBold )}}>{`선택하러 가기`}</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 5 }]}>
                                            {data?.finalType !== 'finish' && <Image source={chatImages.chat_season_5_report_6} style={[rootStyle.default18]} transition={200}/>}
                                            <Text style={{...rootStyle.font(14, chatStyle?.chat_season_5?.primary, fonts.semiBold )}}>
                                                {data?.finalType === 'finish' ? `이미 선택이 완료 됐습니다.` : data?.finalType === 'success' ? `서로를 선택하였습니다.` : `서로를 선택하지 않았습니다.`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                        </View>


                    </View>
                    

                </View>
            </ScrollView>

        </Layout>
    )
}


const useStyle = () => {

    const { width } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const bottomTabHeight = useBottomTabBarHeight();

    const styles = StyleSheet.create({
        item: {
            gap: 12
        },
        chat: {
            borderRadius: 16,
            borderTopLeftRadius: 0,
            backgroundColor: chatStyle?.chat_season_1?.iconBackgroundColor,
            borderWidth: 0.5,
            borderColor: chatStyle?.chat_season_1?.spring1,
            width: 270,
            padding: 14
        },
        bgbutton: {
            width: 48,
            aspectRatio: 1,
            borderRadius: 9.6,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
        },
        box: {
            flex: 1,
            borderRadius: 20,
            backgroundColor: chatStyle?.chat_season_5?.systemBackgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 14,
            gap: 20,
            alignSelf: 'stretch',
            justifyContent: 'space-between'
        },
        searchButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 8,
            height: 24,
            backgroundColor: chatStyle?.chat_season_5?.primary,
            paddingHorizontal: 12,
        },
        boxText1: {
            fontSize: width <= 320 ? 12 : 14,
            lineHeight: 20,
            color: chatStyle?.chat_season_5?.primary,
            fontFamily: fonts.regular,
            letterSpacing: -0.5 //TODO: 이게 있으면 안드로이드는 렌더링이 깨실수도 있다고함..
        }
    })

    return { styles }
}