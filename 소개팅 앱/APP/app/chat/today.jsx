import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Platform, RefreshControl, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

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
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser();
    const { goTop } = useEtc();

    const listRef = useRef(null);
    const filterRef = useRef(null);
    const tabRefs = useRef([]);
    const inputRef = useRef(null);


    const [room, setRoom] = useState(null); // 

    const [data, setData] = useState(null);
    const [list, setList] = useState([]);

    const [targetTime, setTargetTime] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);

    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );

    useEffect(() => {
        if (reload) {
            dataFunc();
        }
    }, [reload]);


    const dataFunc = async () => {

        const { data, error } = await API.post('/v1/chat/coupleList');

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        console.log('data?.list', data?.list);
        setData(data);
        setList(data?.list || []);
        // setList(['1','2']);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }


    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.box}>
                <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                    <Image source={images.chat_today} style={rootStyle.default} />
                    <Text style={{ ...rootStyle.font(16, chatStyle?.chat_season_5?.primary, fonts.semiBold,) }}>
                        {`오늘의 `}
                        <Text style={{ ...rootStyle.font(16, chatStyle?.chat_season_1?.primary, fonts.semiBold,) }}>
                            {`“${index + 1}”호 `}
                        </Text>
                        {`커플이에요!`}
                    </Text>
                </View>

                <View style={{ gap: 4 }}>
                    <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                        <Image source={chatImages.chat_season_5_report_1} style={rootStyle.default20} tintColor={colors.primary11}/>
                        <Text style={{ ...rootStyle.font(16, colors.primary11, fonts.semiBold,) }}>선택회원</Text>
                    </View>
                    {item?.isUserView ? (
                        <Text style={{...rootStyle.font(14, colors.black, fonts.medium,), lineHeight: 20, letterSpacing: -0.35}}>“{item?.userMessage || "작성 대기 중입니다"}”</Text>
                    ) : (
                        <Text style={{...rootStyle.font(14, colors.grey6, fonts.regular,), lineHeight: 20, letterSpacing: -0.35}}>이 소감은 잠시 가려져 있어요.</Text>
                    )}
                    
                </View>

                <View style={{ gap: 4 }}>
                    <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                        <Image source={chatImages.chat_season_5_report_8} style={{ width: 18, height: 20 }} tintColor={colors.primary11}/>
                        <Text style={{ ...rootStyle.font(16, colors.primary11, fonts.semiBold,) }}>1% 회원</Text>
                    </View>
                    {item?.isVisualView ? (
                        <Text style={{...rootStyle.font(14, colors.black, fonts.medium,), lineHeight: 20, letterSpacing: -0.35}}>“{item?.visualMessage || "작성 대기 중입니다"}”</Text>
                    ) : (
                        <Text style={{...rootStyle.font(14, colors.grey6, fonts.regular,), lineHeight: 20, letterSpacing: -0.35}}>이 소감은 잠시 가려져 있어요.</Text>
                    )}
                </View>

                <View style={{ gap: 20, marginTop: 10 }}>
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                            <Image source={chatImages.chat_season_5_fit} style={chatStyle?.chat_season_5?.fitIconSize} />
                            <Text style={{ ...rootStyle.font(16, chatStyle?.chat_season_5?.primary, fonts.bold,) }}>해당 커플의 사계 리포트</Text>
                        </View>
                        
                        {item?.flirting >= 4 && <Image source={images.vip_badge} style={[{ width: 48, aspectRatio: 52 / 20 }]} transition={100}/>}
                    </View>

                    <View style={{ gap: 12 }}>
                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <View style={[rootStyle.flex, { flex: 0.5, gap: 5, justifyContent: 'flex-start' }]}>
                                <Image source={images.picket} style={[rootStyle.picket, { width: 21}]} />
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.regular,) }}>선물한 픽켓 :</Text>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.semiBold) }}>{numFormat(item?.flirting)}장</Text>
                            </View>
                            <View style={[rootStyle.flex, { flex: 0.5, gap: 5, justifyContent: 'flex-start' }]}>
                                <Image source={images.super_picket} style={[rootStyle.default20]} />
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.regular,) }}>선물한 슈퍼픽켓 :</Text>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.semiBold) }}>{numFormat(item?.superPicket)}장</Text>
                            </View>
                        </View>
                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <View style={[rootStyle.flex, { flex: 0.5, gap: 5, justifyContent: 'flex-start' }]}>
                                <Image source={chatImages.chat_season_5_report_7} style={[rootStyle.default18]} />
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.regular,), marginLeft: 4 }}>대화한 횟수 :</Text>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.semiBold) }}>{numFormat(item?.chatCount)}번</Text>
                            </View>
                            <View style={[rootStyle.flex, { flex: 0.5, gap: 5, justifyContent: 'flex-start' }]}>
                                <Image source={chatImages.chat_season_5_report_4} style={[rootStyle.default20]} />
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.regular,) }}>전화 횟수/분 :</Text>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 375 ? 12 : 13, chatStyle?.chat_season_5?.primary, fonts.semiBold) }}>{numFormat(item?.callCount)}회 / {formatTime(item?.callTime)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        title: '오늘의 최종 커플',
        titleStyle: {
            fontSize: 18,
            color: colors.dark,
            fontFamily: fonts.semiBold,
        },
    };


    return (
        <Layout header={{
            ...header, 
            titleIcon: {
                icon: 'chat_today',
                style: {
                    width: 24,
                    height: 24,
                },
                tintColor: !data?.isAvailable && colors.grey6
            }
        }}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}

            {data?.isAvailable ? (
                <FlashList 
                    data={list}
                    renderItem={renderItem}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: rootStyle.side,
                        paddingBottom: insets?.bottom + 40,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}

                    ListHeaderComponent={
                        <View>
                            <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16 }]}>
                                <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_5?.systemBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                                    <Image source={images.chat_today} style={rootStyle.default} transition={200} />
                                </View>

                                <View style={[{ flex: 1, gap: 9 }]}>
                                    <Text style={{ ...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_5?.primary, fonts.bold,) }}>
                                        {`오늘은 `}
                                        <Text style={{ ...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_1?.primary, fonts.bold,) }}>{numFormat(list?.length)}쌍</Text>
                                        {`이 최종 커플이 됐어요!`}
                                    </Text>
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 360 ? 12 : 14, chatStyle?.chat_season_5?.primary, fonts.medium,), letterSpacing: -0.35 }}>오늘의 최종 커플의 후기를 확인해 보세요.</Text>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={'오늘의 최종 커플이 없습니다.'} />
                    }
                />
            ) : (
                <View style={{ paddingHorizontal: rootStyle.side }}>
                    <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16 }]}>
                        <View style={[styles.bgbutton, { backgroundColor: colors.greyB, width: width <= 360 ? 38 : 48 }]} >
                            <Image source={images.chat_today} style={rootStyle.default} transition={200} tintColor={colors.grey6} />
                        </View>

                        <View style={[{ flex: 1, gap: 9 }]}>
                            <Text style={{ ...rootStyle.font(width <= 320 ? 14 : width <= 360 ? 16 : 18, colors.grey6, fonts.bold,) }}>오늘의 커플 결과가 현재 진행 중입니다.</Text>
                            <Text style={{ ...rootStyle.font(width <= 320 ? 11 : width <= 360 ? 12 : 14, colors.grey6, fonts.medium,), letterSpacing: -0.7 }}>매일 오후 9시 ~ 익일 오후 4시까지 확인 할 수 있습니다.</Text>
                        </View>
                    </View>
                </View>
            )}
            
                

        </Layout>
    )
}


const useStyle = () => {

    const { width } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

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
            padding: 16,
            borderRadius: 20,
            backgroundColor: chatStyle?.chat_season_5?.systemBackgroundColor,
            gap: 20,
            marginBottom: 20
        }

      
    })

    return { styles }
}