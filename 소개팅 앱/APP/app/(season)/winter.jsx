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

import { ToastMessage, elapsedTime, useCountdown } from '@/libs/utils';


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
    const [data, setData] = useState([]);
    const [isKeepOn, setIsKeepOn] = useState(false);
    const [isLock, setIsLock] = useState(false);
    const [targetTime, setTargetTime] = useState(null);
    const countdown = useCountdown(targetTime);

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

    useEffect(() => {
        console.log('countdown', countdown);
    }, [countdown]);

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

        const { data, error } = await API.post('/v1/capsule/fall', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        console.log('data', data);
        setIsLock(data?.isLock);
        // setTargetTime(data?.time);

        setTargetTime('2026-01-15T10:24:00.000Z')


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

            <View
                style={{
                    flex: 1,
                }}
            >
                <ScrollView 
                    contentContainerStyle={{
                        paddingHorizontal: rootStyle.side,
                        paddingTop: 12,
                        paddingBottom: bottomTabHeight + insets?.bottom + 20,
                    }}
                >

                    <View style={{ flex: 1 }}>
                        <HeaderBadge room={room} chatTheme={chatTheme} seasonLog={true} />

                        <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16, marginTop: 12 }]}>
                            <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_4?.iconBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                                <Image source={chatImages.chat_season_4_fit} style={width <= 360 ? rootStyle.default : rootStyle.default28} transition={200} />
                            </View>

                            <View style={[{ flex: 1, gap: 4 }]}>
                                <Text style={{ ...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_4?.winter1, fonts.bold,) }}>겨울(Winter)</Text>
                                <Text style={{ ...rootStyle.font(width <= 360 ? 12 : 14, chatStyle?.chat_season_4?.winter1, fonts.medium,), letterSpacing: -0.35 }}>“우리의 마음을 결정하고, 다음을 약속하는 겨울”</Text>
                            </View>
                        </View>

                        <View style={{ gap: 20, marginTop: 20 }}>
                            <View style={{ gap: 11 }}>
                                <View style={[ rootStyle.flex, { gap: 5, justifyContent: 'flex-start', paddingHorizontal: 6 }]}>
                                    <Image source={chatImages.chat_winter_icon1} style={rootStyle.default} transition={200}/>
                                    <Text style={{...rootStyle.font(18, chatStyle?.chat_season_4?.winter1, fonts.bold), lineHeight: 26 }}>최종 결정 안내</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_4?.winter1, fonts.regular), lineHeight: 24, letterSpacing: -0.49 }}>
                                        {`겨울(4일차) 오후 8시에 최종 결정이 진행 됩니다.\n\n양쪽 회원님께서 모두 최종 결정을 수락하시면\n채팅방이 ‘천국’으로 전환되어 대화를 이어가실 수 있습니다.\n\n이와 함께 서로의 연락처가 공개되며,\n더 가까이 알아가실 수 있는 기회가 열립니다.`}
                                    </Text>
                                </View>
                            </View>


                            <View style={{ gap: 11 }}>
                                <View style={[ rootStyle.flex, { gap: 5, justifyContent: 'flex-start', paddingHorizontal: 6 }]}>
                                    <Image source={chatImages.chat_winter_icon2} style={rootStyle.default} transition={200}/>
                                    <Text style={{...rootStyle.font(18, chatStyle?.chat_season_4?.winter1, fonts.bold), lineHeight: 26 }}>슈퍼 픽켓 안내</Text>
                                </View>
                                <View style={styles.box}>
                                    <View style={{ paddingVertical: 12 }}>
                                        <Text style={{...rootStyle.font(16, chatStyle?.chat_season_4?.winter1, fonts.medium), lineHeight: 22, letterSpacing: -0.56 }}>슈퍼 픽켓이란?</Text>
                                        
                                        <Text style={{...rootStyle.font(14, chatStyle?.chat_season_4?.winter1, fonts.regular), lineHeight: 22, letterSpacing: -0.49 }}>
                                            {`소개팅 시작 후 일반 픽켓 4장을 보내면 '슈퍼 픽켓'으로 업그레이드됩니다.`}
                                        </Text>
                                    </View>

                                    <View style={{ paddingVertical: 12 }}>
                                        <Text style={{...rootStyle.font(16, chatStyle?.chat_season_4?.winter1, fonts.medium), lineHeight: 22, letterSpacing: -0.56 }}>사용 방법 및 효과</Text>
                                        
                                        <TouchableOpacity style={{ width: '100%', marginTop: 10, marginBottom: 16 }} activeOpacity={1} onPress={() => {
                                             router.navigate({
                                                pathname: routes.chatSuperpicketInfo,
                                            })
                                        }}>
                                            <View style={styles.button}>
                                                <Image source={images.search} style={rootStyle.default} transition={200} tintColor={colors.white}/>
                                                <Text style={{...rootStyle.font(14, colors.white, fonts.semiBold )}}>{`슈퍼 픽켓 알아보기`}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        
                                        <Text style={{...rootStyle.font(14, chatStyle?.chat_season_4?.winter1, fonts.regular), lineHeight: 22, letterSpacing: -0.49 }}>
                                            {`Tip. 한 소개팅에서 픽켓 선물은 최대 40장으로 제한됩니다.\n상대방의 마음을 움직일 수 있도록 적극 활용해 보세요!`}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                        </View>


                    </View>
                </ScrollView>
            </View>

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
        bgbutton: {
            width: 48,
            aspectRatio: 1,
            borderRadius: 9.6,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
        },
        box: {
            paddingHorizontal: 15,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: chatStyle?.chat_season_4?.systemBackgroundColor,
            borderWidth: 1,
            borderColor: chatStyle?.chat_season_4?.winter2,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 16,
            width: '100%',
            height: 48,
            backgroundColor: chatStyle?.chat_season_4?.primary,
        },
     
    })

    return { styles }
}