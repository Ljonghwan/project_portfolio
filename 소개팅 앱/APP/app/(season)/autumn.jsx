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

import { ToastMessage, elapsedTime, useInterval, useCountdown } from '@/libs/utils';


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
        console.log('data', data?.time, dayjs(data?.time).format('YYYY-MM-DD HH:mm:ss'));
        setIsLock(data?.isLock);
        setTargetTime(data?.time);

        // setTargetTime('2026-01-15T10:24:00.000Z')


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
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 12,
                    paddingBottom: bottomTabHeight + insets?.bottom + 20,
                }}
            >
                <View style={{ flex: 1 }}>
                    <HeaderBadge room={room} chatTheme={chatTheme} seasonLog={true} />

                    <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16, marginTop: 12 }]}>
                        <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_3?.iconBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                            <Image source={chatImages.chat_season_3_fit} style={width <= 360 ? rootStyle.default : rootStyle.default28} transition={200} />
                        </View>

                        <View style={[{ flex: 1, gap: 4 }]}>
                            <Text style={{ ...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_3?.fall1, fonts.bold,) }}>가을(Fall)</Text>
                            <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 360 ? 12 : 14, chatStyle?.chat_season_3?.fall1, fonts.medium,), letterSpacing: -0.35 }}>“모든 블라인드를 거두고, 우리의 열매를 확인합니다.”</Text>
                        </View>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 58, gap: 16 }}>
                        <Image source={countdown?.isFinished ? chatImages.chat_fall_on : chatImages.chat_fall_off} style={{ width: 108, aspectRatio: 108 / 48 }} transition={200} />

                        {!countdown?.isFinished && (
                            <Text style={{ ...rootStyle.font(18, colors?.greyB, fonts.bold), letterSpacing: -0.45 }}>남은 시간 : {countdown?.formatted}</Text>
                        )}

                        <AnimatedText color={!countdown?.isFinished ? colors?.greyB : chatStyle?.chat_season_3?.fall1} style={{ fontSize: 18, fontFamily: fonts.bold, letterSpacing: -0.45, textAlign: 'center', lineHeight: 26 }}>
                            {!countdown?.isFinished ? `아직 블라썸과 여름의 밤 항목의\n블라인드가 사라지지 않았습니다.` : `이제 블라썸과 여름의 밤 항목의\n블라인드가 사라집니다.`}
                        </AnimatedText>
                    </View>

                </View>
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
    })

    return { styles }
}