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

import Level from '@/components/badges/Level';

import HeaderBadge from '@/components/chatTheme/HeaderBadge';
import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import chatStyle from '@/libs/chatStyle';
import chatImages from '@/libs/chatImages';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { ToastMessage, elapsedTime, imageViewer } from '@/libs/utils';


import { useUser, useEtc } from '@/libs/store';

function Item({ item, isMe, isLock, style, isLeaveStatus }) {

    const { styles } = useStyle();

    return (
        <View style={[styles.item, style, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
            <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                <Image source={isLeaveStatus !== 1 ? images.profile_leave : item?.profile ? consts.s3Url + item?.profile : images.profile} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.placeholder }} />
                <View style={{ gap: 8, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <Text style={{...rootStyle.font(16, colors.dark, fonts.bold)}}>{isLeaveStatus === 9 ? '탈퇴회원' : isLeaveStatus === 8 ? '정지회원' : item?.name}</Text>
                    <Level level={item?.level} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }} />
                </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => {
                if(!isLock || isMe) {
                    imageViewer({
                        list: [item?.image],
                        index: 0
                    })
                }
                
            }}>
                <ImageBackground 
                    source={consts.s3Url + item?.image} 
                    style={{ 
                        width: 260, 
                        aspectRatio: 1, 
                        borderRadius: 20, 
                        backgroundColor: colors.placeholder,
                        overflow: 'hidden',
                    }} 
                    blurRadius={(!isLock || isMe) ? 0 : 100}
                >
                    <View style={{ gap: 19, flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dim, display: (!isLock || isMe) ? 'none' : 'flex'  }}>
                        <Image source={images.chat_hide} style={{ width: 28, height: 22 }} />
                        <Text style={{...rootStyle.font(16, colors.white, fonts.semiBold), lineHeight: 20, textAlign: 'center' }}>{`가을에 확인 가능한\n컨텐츠 입니다.`}</Text>
                    </View>
                </ImageBackground>
            </TouchableOpacity>


            <View style={[styles.chat, { padding: (!isLock || isMe) ? 14 : 5, borderTopLeftRadius: isMe ? 16 : 0, borderTopRightRadius: isMe ? 0 : 16 }]}>
                
                
                {(!isLock || isMe) ? (
                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_1?.spring1, fonts.medium), lineHeight: 20 }}>{item?.message}</Text>
                ) : (
                    <HiddenText 
                        text={item?.message}
                        color={chatStyle?.chat_season_1?.spring1} 
                        style={{  }} 

                    />
                )}
                
            </View>
        </View>
    )
}
export default function Page({  }) {

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
    const [isEdit, setIsEdit] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);
    const [resetLoad, setResetLoad] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if(roomIdx) roomInfo(dataFunc);
        }, [roomIdx])
    );

    useEffect(() => {
        if(reload) {
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

        const { data, error } = await API.post('/v1/capsule/spring', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        setData(data?.list || []);
        setIsLock(data?.isLock);
        setIsEdit(data?.isEdit);

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

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <View style={{ flex: 1 }}>
                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingHorizontal: rootStyle.side, 
                        paddingTop: 12,
                        paddingBottom: bottomTabHeight + insets?.bottom + 20,
                        flex: 'unset'
                    }}
                    refreshControl={
                        <RefreshControl refreshing={reload} onRefresh={() => {
                            setReload(true);
                        }} />
                    }
                >
                    <View style={{ flex: 1 }}>
                        <HeaderBadge room={room} chatTheme={chatTheme} seasonLog={true}/>

                        <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16, marginTop: 12 }]}>
                            <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_1?.iconBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                                <Image source={chatImages.chat_season_1_fit} style={width <= 360 ? rootStyle.default : rootStyle.default28} transition={200} />
                            </View>

                            <View style={[{ flex: 1, gap: 4 }]}>
                                <Text style={{...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_1?.spring1, fonts.bold, )}}>봄(Spring)</Text>
                                <Text style={{...rootStyle.font(width <= 360 ? 12 : 14, chatStyle?.chat_season_1?.spring1, fonts.medium, )}}>“오늘 심은 씨앗이, 인연의 새싹으로 💕”</Text>
                            </View>
                            <Info 
                                infoComponent={
                                    <View style={{ gap: 16, borderRadius: 12, borderWidth: 0.5, borderColor: chatStyle?.chat_season_1?.primary, backgroundColor: chatStyle?.chat_season_1?.systemBackgroundColor, padding: 12 }}>
                                        <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.dark, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>{`서로에게 꼭 보여주고 싶은 사진과 그 이유를 나누며,\n두 사람 사이에 인연의 씨앗이 조심스레 자리 잡는\n특별한 컨텐츠입니다.`}</Text>
                                        <Text style={{ ...rootStyle.font(12, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>• 해당 컨텐츠는 가을(3일차)에 확인 할 수 있습니다.</Text>
                                    </View>
                                }
                            >
                                <Image source={images.info} style={rootStyle.default} tintColor={chatStyle?.chat_season_1?.spring1}/>
                            </Info>
                        </View>

                            
                        <View>
                            {!isEdit ? (
                                <Button 
                                    type={20}
                                    containerStyle={[rootStyle.flex, { gap: 4 }]}
                                    onPress={() => {
                                    }}
                                    frontIcon={'chat_write'}
                                    frontIconStyle={[rootStyle.default]}
                                    frontIconTintColor={colors.ff81a9}
                                >
                                    아직 블라썸을 작성할 수 없어요.
                                </Button>
                            ) : data?.find(x => x?.userIdx === mbData?.idx) ? (
                                <Button 
                                    type={19}
                                    containerStyle={[rootStyle.flex, { gap: 4 }]}
                                    onPress={() => {
                                    }}
                                    frontIcon={'chat_write'}
                                    frontIconStyle={[rootStyle.default]}
                                    frontIconTintColor={colors.ff4c85}
                                >
                                    블라썸을 이미 작성했어요.
                                </Button>
                            ) : (
                                <Button 
                                    type={16}
                                    containerStyle={[rootStyle.flex, { gap: 4 }]}
                                    onPress={() => {
                                        router.navigate({
                                            pathname: routes.chatSpringWrite,
                                            params: {
                                                roomIdx: roomIdx
                                            }
                                        })
                                    }}
                                    frontIcon={'chat_write'}
                                    frontIconStyle={[rootStyle.default]}
                                    frontIconTintColor={colors.white}
                                >
                                    블라썸 작성하기
                                </Button>
                            )}
                            

                            <View style={{ gap: 12, marginTop: 12 }}>
                                {data?.length > 0 ? (
                                    data?.map((x, i) => {
                                        return <Item key={i} item={x} isMe={x?.userIdx === mbData?.idx} isLock={isLock} isLeaveStatus={room?.users?.find(y => y?.idx === x?.userIdx)?.status} />
                                    })
                                ) : (
                                    <View style={{ gap: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 90 }}>
                                        <Image source={images.dot} style={{ width: 96, height: 96 }} />
                                        <Text style={{...rootStyle.font(18, colors.dark, fonts.semiBold), textAlign: 'center' }}>아직 상대방이 블라썸을 작성하지 않았어요.</Text>
                                    </View>
                                )}
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