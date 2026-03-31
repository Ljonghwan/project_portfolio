import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Platform, RefreshControl, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
    FadeIn,
    FadeInLeft,
    FadeInRight,
    SlideInLeft,
    SlideInRight,
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';
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
import Input from '@/components/Input';

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

import { ToastMessage, elapsedTime, imageViewer } from '@/libs/utils';


import { useUser, useEtc } from '@/libs/store';

function Item({ item, isLock, style, users, answer, setAnswer, filter, onSubmit }) {

    const { width } = useSafeAreaFrame();
    const { mbData } = useUser();

    const { styles } = useStyle();

    const [load, setLoad] = useState(false);

    const isMe = item?.userIdx === mbData?.idx;
    const user = users?.find(x => x?.idx !== item?.userIdx);
    const writeUser = users?.find(x => x?.idx === item?.userIdx);
    const isLeaveStatus = user?.status;

    if(!item) return (
        <View style={{ gap: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 90 }}>
            <Image source={images.dot} style={{ width: 96, height: 96 }} />
            <Text style={{...rootStyle.font(18, colors.dark, fonts.semiBold), textAlign: 'center' }}>{!filter ? "아직 내가 상대방에게 질문하지 않았어요." : "아직 상대방이 나에게 질문하지 않았어요."}</Text>
            { !filter && <Text style={{...rootStyle.font(14, colors.dark, fonts.regular), textAlign: 'center' }}>상단의 질문을 적어 상대방에게 보내보세요!</Text>}
        </View>
    );

    return (
        <LinearGradient
            style={[ styles.item, style]}
            colors={chatStyle?.chat_season_2?.gradient}
            start={{ x: 0.5, y: 0 }} 
            end={{ x: 0.5, y: 1}}
        >
            <View style={[rootStyle.flex, { gap: 8 }]}>
                <Image source={writeUser?.status !== 1 ? images.profile_leave : item?.profile ? consts.s3Url + item?.profile : images.profile} style={{ width: 36, height: 36, borderRadius: 100, backgroundColor: colors.placeholder }} />
                <Text style={{...rootStyle.font(width <= 320 ? 16 : 18, colors.white, fonts.semiBold)}}>
                    {writeUser?.status !== 1 ? (
                        (writeUser?.status === 9 ? '탈퇴회원' : '정지회원') + `${isMe ? "님이 상대에게 한 질문" : "님이 나한테 한 질문"}`
                    ) : (
                        isMe ? `“${item?.name}”님이 상대에게 한 질문` : `“${item?.name}”님이 나한테 한 질문`
                    )}
                    
                </Text>
            </View>

            <View style={[rootStyle.flex, { paddingVertical: 30 }]}>
                <Text style={{...rootStyle.font(16, colors.white, fonts.regular), textAlign: 'center' }}>{item?.message}</Text>
            </View>

            {(!isMe && !item?.answer) ? (
                <View style={{ width: '100%' }}>
                    {load && <Loading color={colors.black} style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingBottom: 0 }} fixed />}
                    <Input 
                        state={answer} 
                        setState={setAnswer} 
                        // inputLabel={'핸드폰번호'}
                        placeholder={`질문에 답변하기.`} 
                        maxLength={100}
                        inputWrapStyle={{ 
                            borderColor: chatStyle?.chat_season_2?.primary, 
                            paddingRight: 12,
                        }}
                        inputWrapFocusStyle={{ borderColor: chatStyle?.chat_season_2?.primary }}
                        inputStyle={{ 
                            color: chatStyle?.chat_season_2?.primary, 
                            fontSize: 14, 
                        }}
                        iconComponent={
                            <TouchableOpacity style={{  }} activeOpacity={0.8} hitSlop={15} onPress={() => {
                                setLoad(true);
                                onSubmit();
                            }}>
                                <Image source={images.voice_send} style={rootStyle.default20} tintColor={chatStyle?.chat_season_2?.primary}/>
                            </TouchableOpacity>
                        }
                    />
                </View>
            ) : (
                <View 
                    style={[
                        rootStyle.flex, 
                        { 
                            width: '100%', 
                            maxWidth: 340,
                            gap: 8, 
                            borderWidth: 0.5, 
                            borderColor: chatStyle?.chat_season_2?.primary, 
                            borderRadius: 12, 
                            paddingHorizontal: 12, 
                            paddingRight: 0,
                            paddingVertical: 8, 
                            backgroundColor: colors.white
                        }
                    ]}>
                    <Image source={isLeaveStatus !== 1 ? images.profile_leave : user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 24, height: 24, borderRadius: 100, backgroundColor: colors.placeholder }} />
                    
                    {isLock && isMe && item?.answer ? (
                        <HiddenText 
                            text={item?.answer}
                            color={colors.dark} 
                            style={{ flexShrink: 1 }} 
                        />
                    ) : (
                        <Text style={{...rootStyle.font(14, item?.answer ? colors.dark : colors.grey9, fonts.regular), flexShrink: 1 }}>{item?.answer || '아직 상대방이 답변하지 않았어요.'}</Text>
                    )}
                    
                </View>
            )}
        </LinearGradient>
        
            
    )
}
export default function Page({  }) {

    const { styles } = useStyle();

    const { roomIdx, mode } = useLocalSearchParams();

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
    const [meWrite, setMeWrite] = useState(false);
    const [users, setUsers] = useState([]);

    const [message, setMessage] = useState('');
    const [answer, setAnswer] = useState('');
    const [filter, setFilter] = useState(mode === 'answer' ? true : false);

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
        setUsers(data?.users);
        setIsKeepOn(data?.isKeepOn) // 채팅 계속유지

        if (callback) await callback(data);

    }

    const dataFunc = async () => {
        
        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/summer', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        setData(data?.list || []);
        setIsLock(data?.isLock);
        setIsEdit(data?.isEdit);
        setMeWrite(Boolean(data?.list?.find(x => x?.userIdx === mbData?.idx)));

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }


    const submitFunc = async () => {
        
        if(load || meWrite || !isEdit) return;

        Keyboard.dismiss();

        const inputReplace = message?.replace(/\s+/g, '');
        if (!message || inputReplace?.length < 1) {
            ToastMessage('질문을 입력해주세요.');
            return;
        }

        setLoad(true);

        let sender = {
            roomIdx: roomIdx*1,
            type: 2,
            message: message
        };

        const { data, error } = await API.post('/v1/capsule/contents', sender);

        setTimeout(() => {

            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }
        
            ToastMessage('작성이 완료되었습니다.');
            setMessage('');
            roomInfo(dataFunc);

            
        }, consts.apiDelay);
    }


    const answerFunc = async () => {
        
        if(load) return;

        Keyboard.dismiss();

        const inputReplace = answer?.replace(/\s+/g, '');
        if (!answer || inputReplace?.length < 1) {
            ToastMessage('답변을 입력해주세요.');
            return;
        }

        setLoad(true);

        let sender = {
            roomIdx: roomIdx*1,
            message: answer
        };

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/capsule/summerAnswer', sender);

        setTimeout(() => {

            setTimeout(() => {
                setLoad(false);
            }, consts.apiDelayLong)

            if(error) {
                ToastMessage(error?.message);
                return;
            }
        
            ToastMessage('작성이 완료되었습니다.');
            roomInfo(dataFunc);

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
        <Layout header={header}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <View style={{ flex: 1 }}>
                <KeyboardAwareScrollView
                    decelerationRate={'normal'}
                    bottomOffset={50}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: rootStyle.side, 
                        paddingTop: 12,
                        paddingBottom: bottomTabHeight + insets?.bottom + 20,
                    }}
                    refreshControl={
                        <RefreshControl refreshing={reload} onRefresh={() => {
                            setReload(true);
                        }} />
                    }
                >
             
                    <View style={{  }}>
                        <HeaderBadge room={room} chatTheme={chatTheme} seasonLog={true} />

                        <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16, marginTop: 12 }]}>
                            
                            <View style={[styles.bgbutton, { backgroundColor: chatStyle?.chat_season_2?.iconBackgroundColor, width: width <= 360 ? 38 : 48 }]} >
                                <Image source={chatImages.chat_season_2_fit} style={width <= 360 ? rootStyle.default : rootStyle.default28} transition={200} />
                            </View>

                            <View style={[{ flex: 1, gap: 4 }]}>
                                <Text style={{...rootStyle.font(width <= 360 ? 16 : 18, chatStyle?.chat_season_2?.primary, fonts.bold, )}}>여름(Summer)</Text>
                                <Text style={{...rootStyle.font(width <= 360 ? 12 : 14, chatStyle?.chat_season_2?.primary, fonts.medium, )}}>“서로의 사이가 깊어지는 여름 밤”</Text>
                            </View>

                            <Info 
                                infoComponent={
                                    <View style={{ gap: 16, borderRadius: 12, borderWidth: 0.5, borderColor: chatStyle?.chat_season_2?.primary, backgroundColor: chatStyle?.chat_season_2?.systemBackgroundColor, padding: 12 }}>
                                        <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.dark, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>{`여름의 밤은 “${users?.find(x => x?.idx !== mbData?.idx)?.name}”님에게\n질문을 하고, 상대방의 질문에 대답 할 수 있어요.`}</Text>
                                        <Text style={{ ...rootStyle.font(12, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>• 해당 컨텐츠는 가을(3일차)에 확인 할 수 있습니다.</Text>
                                    </View>
                                }
                            >
                                <Image source={images.info} style={rootStyle.default} tintColor={chatStyle?.chat_season_2?.primary}/>
                            </Info>
                        </View>

                        <View style={{ }}>
                            {!initLoad && (
                                <Input 
                                    iref={inputRef}
                                    state={message} 
                                    setState={setMessage} 
                                    // inputLabel={'핸드폰번호'}
                                    placeholder={!isEdit ? `아직 질문을 할 수 없어요.` : meWrite ? `질문 작성을 완료 했어요` : `질문을 적어주세요.`} 
                                    returnKeyType={"done"}
                                    maxLength={100}
                                    readOnly={meWrite || !isEdit}
                                    inputWrapStyle={{ 
                                        borderColor: meWrite || !isEdit ? colors.grey6 : chatStyle?.chat_season_2?.primary, 
                                        backgroundColor: meWrite || !isEdit ? colors.white : chatStyle?.chat_season_2?.iconBackgroundColor,
                                        paddingHorizontal: 0,
                                    }}
                                    inputWrapFocusStyle={{ borderColor: meWrite || !isEdit ? colors.grey6 : chatStyle?.chat_season_2?.primary }}
                                    inputStyle={{ 
                                        color: chatStyle?.chat_season_2?.primary, 
                                        fontSize: 14, 
                                        textAlign: 'center', 
                                        fontFamily: fonts.semiBold,
                                        paddingHorizontal: 44,
                                        height: Platform.OS === 'ios' ? 20 : '100%',
                                    }}
                                    placeholderTextColor={meWrite || !isEdit ? colors.grey6 : chatStyle?.chat_season_2?.primary}
                                    iconComponent={
                                        <TouchableOpacity style={{ position: 'absolute', right: 6, width: 36, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: meWrite || !isEdit ? colors.grey6 : chatStyle?.chat_season_2?.primary }} activeOpacity={0.8} onPress={submitFunc}>
                                            <Image source={images.chat_write} style={rootStyle.default28} tintColor={meWrite || !isEdit ? colors.white : chatStyle?.chat_season_2?.iconBackgroundColor}/>
                                        </TouchableOpacity>
                                    }
                                />
                            )}
                            
                        </View>

                        

                        <View style={{ marginTop: 12 }}>
                            <View style={[rootStyle.flex, { gap: 10, paddingVertical: 16 }]}>
                                <TouchableOpacity style={[styles.filterItem, { backgroundColor: !filter ? chatStyle?.chat_season_2?.primary : colors.white }]} activeOpacity={0.7} onPress={() => setFilter(false)}>
                                    <Image source={images.voice_send} style={rootStyle.default} tintColor={!filter ? colors.white : chatStyle?.chat_season_2?.primary}/>
                                    <Text style={[styles.filterText, { color: !filter ? colors.white : chatStyle?.chat_season_2?.primary }]}>내가 보낸 질문</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterItem, { backgroundColor: filter ? chatStyle?.chat_season_2?.primary : colors.white }]} activeOpacity={0.7} onPress={() => setFilter(true)}>
                                    <Image source={images.mail} style={rootStyle.default} tintColor={filter ? colors.white : chatStyle?.chat_season_2?.primary}/>
                                    <Text style={[styles.filterText, { color: filter ? colors.white : chatStyle?.chat_season_2?.primary }]}>내가 받은 질문</Text>
                                </TouchableOpacity>
                            </View>

                            <Animated.View key={(!filter ? 'send' : 'receive') + (data?.length || "0")} entering={!filter ? FadeInLeft : FadeInRight} style={{ }}>
                                <Item 
                                    item={data?.find(x => !filter ? x?.userIdx === mbData?.idx : x?.userIdx !== mbData?.idx)} 
                                    isLock={isLock} 
                                    users={users} 
                                    answer={answer} 
                                    setAnswer={setAnswer} 
                                    onSubmit={answerFunc}
                                    filter={filter}
                                />
                            </Animated.View>
                            
                        </View>
                    </View>
                </KeyboardAwareScrollView>
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
            gap: 12,
            borderRadius: 24,
            padding: 16,
            paddingTop: 9,
            alignItems: 'center'
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
        filterItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: width <= 320 ? 6 : 12,
            height: 48,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: chatStyle?.chat_season_2?.primary,
        },
        filterText: {
            fontSize: 16,
            fontFamily: fonts.medium,
        }
    })

    return { styles }
}