import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
    Image as RNImage,
    Pressable,
} from 'react-native';

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flow } from 'react-native-animated-spinkit'
import { BlurView } from 'expo-blur';
import { Image, ImageBackground } from 'expo-image';
import LottieView from 'lottie-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { FlashList } from "@shopify/flash-list";
import { LegendList } from "@legendapp/list/keyboard-controller";

import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { io, Socket } from "socket.io-client"

import { numFormat, ToastMessage, checkMic } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import InputChat from '@/components/InputChat';

import Balloon from '@/components/chat/Balloon';
import BalloonSystem from '@/components/chat/BalloonSystem';
import BalloonSystemFreeDone from '@/components/chat/BalloonSystemFreeDone';
import ChatNotice from '@/components/chat/ChatNotice';

import Header from '@/components/chatTheme/Header';
import { AnimatedText, AnimatedBackground } from '@/components/chatTheme/AnimatedColorComponents';

import ChatLeave from '@/components/popups/ChatLeave';
import ChatInfoFlirting from '@/components/popups/ChatInfoFlirting';
import FreeviewChatLeave from '@/components/popups/FreeviewChatLeave';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import chatStyle from '@/libs/chatStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useEtc, useRoom } from '@/libs/store';
import { badgeReload } from '@/libs/utils';

import chatQueue from '@/libs/chatQueue';

export default function Page({ }) {

    const {
        idx: roomIdx,
        userIdx,
        profile,
        title,
        type
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, setRoomIdx } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { transparencyEnabled, appActiveStatus, setAudioId } = useEtc();
    const { warningMessage, setWarningMessage } = useRoom();

    const socketRef = useRef(null);
    const listRef = useRef(null);
    const lottieRef = useRef(null);

    const [room, setRoom] = useState(null); // 

    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [notices, setNotices] = useState([]);
    const [input, setInput] = useState('');
    const [lastIndex, setLastIndex] = useState(null);

    const [isEdit, setIsEdit] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isEnd, setIsEnd] = useState(false);
    const [isKeepOn, setIsKeepOn] = useState(false);

    const [nextToken, setNextToken] = useState(null);


    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [callLoad, setCallLoad] = useState(false); // 보이스톡 로딩

    const [lottie, setLottie] = useState(false); // 로티 뷰어
    const [notice, setNotice] = useState(false); // 공지사항 뷰어

    const viewables = useSharedValue([]);

    // const debouncedValue = useDebounce(input, 10);

    useFocusEffect(
        useCallback(() => {
            setRoomIdx(roomIdx);
            roomInfo();

            if (appActiveStatus === 'active') {
                dataFunc(true);
            }
            return () => {
                setRoomIdx(null);
                setAudioId(null);
            };
        }, [appActiveStatus])
    );

    useEffect(() => {


    }, [appActiveStatus])



    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            roomIdx: roomIdx,
            nextToken: reset ? null : nextToken
        }

        console.log('dataFunc', sender);
        const { data, error } = await API.post('/v1/chat/chatList', sender);

        setNextToken(data?.nextToken);
        badgeReload();
        console.log('data', data?.list);
        setTimeout(() => {
            let fetchData = data?.list || [];
            setMessages(prev => {
                return reset ? fetchData : [...fetchData, ...prev]
            });

            // setList([]);
            setTimeout(() => {
                setInitLoad(false);
                setLoad(false);
                setReload(false);
            }, consts.apiDelay)

        }, consts.apiDelay)
    }

    const roomInfo = async (callback) => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/roomInfo', sender);
        console.log('roominfo', data);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setRoom(data);
        setUsers(data?.users);
        setIsEnd(data?.status !== 1); // 채팅 종료

        // setIsReadOnly(data?.lock); // 채팅 얼리기

        setIsKeepOn((data?.type === 2 && data?.status === 1 && data?.userAccept === 2 && data?.visualAccept === 2 && !data?.endTimestamp)) // 채팅 계속유지

        if (callback) await callback(data);
    }



    const renderItem = ({ item, index }) => {

        return (
            <BalloonSystemFreeDone item={item} leaveAlert={leaveAlert} />
        )
    };

    const leaveAlert = () => {

        openAlertFunc({
            icon: images.warning,
            title: `소개팅을 취소 하시겠습니까?`,
            onCencleText: "닫기",
            onPressText: "취소하기",
            onPress: async () => {
                // 프리뷰 챗 종료 API
                let sender = {
                    roomIdx: room?.idx
                }

                const { data, error } = await API.post('/v1/chat/cancelFreeview', sender);

                if (error) {
                    ToastMessage(error?.message);
                    return;
                }

                ToastMessage('소개팅이 취소되었습니다.');
                router.back();
                return;

            }
        });
    }

    const chatTheme = chatStyle?.chat_season_1;

    return (
        <ImageBackground
            style={{ flex: 1 }}
            source={chatTheme?.backgroundImage}
            contentFit="cover"
            transition={200}
        >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <Header room={room} chatTheme={chatTheme} leaveAlert={leaveAlert} />

            <MaskedView
                style={{ flex: 1 }}
                maskElement={
                    <LinearGradient
                        colors={[
                            'transparent',   // 위 완전 투명
                            'white',         // 중간 완전 표시
                            'white',
                        ]}
                        locations={[0, 0.05, 1]}
                        style={{ flex: 1, marginTop: rootStyle.header.height + insets?.top }}
                    />
                }
            >
                <View style={{ flex: 1 }}>
                    <FlashList
                        ref={listRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item?.idx}
                        getItemType={(item) => {
                            return item?.type;
                        }}
                        maintainVisibleContentPosition={{
                            autoscrollToBottomThreshold: 0.2,
                            startRenderingFromBottom: false,
                        }}
                        keyboardDismissMode={'on-drag'}
                        // keyboardShouldPersistTaps={"never"}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            padding: rootStyle.side,
                            // paddingBottom: room?.type < 3 ? 100 : 56,
                            paddingTop: rootStyle.header.height + insets?.top + 20,
                            paddingBottom: insets?.bottom + 20
                        }}
                    />
                </View>

            </MaskedView>



        </ImageBackground>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        lottie: {
            ...StyleSheet.absoluteFill,
            flex: 1,
            backgroundColor: 'transparent',
            pointerEvents: 'none', // 터치 통과
        },






























        headerBadgeText: {
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35,
            color: colors.dark
        },

        date: {
            borderRadius: 100,
            paddingHorizontal: 20,
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            backgroundColor: colors.greyF8,
            gap: 4,
            marginTop: 20
        },
        dateText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark
        },

        toast: {
            borderRadius: 100,
            paddingHorizontal: 20,
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            backgroundColor: colors.system,
            position: 'absolute',
            zIndex: 10,
            bottom: 10,
        },
        toastText: {
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35,
            color: colors.dark
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
            position: 'absolute',
            zIndex: 10,
            bottom: 10,
            left: 20
        },


        button: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.main,
            gap: 20,
            paddingBottom: insets?.bottom,
        },
        buttonText: {
            color: colors.white,
            textAlign: "center",
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 52,
        },


        roomWarning: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#FFADAD",
            backgroundColor: colors.red3,
            marginTop: 20
        },
        roomWarningTitle: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.red1,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold
        },
        roomWarningSubTitle: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.3,
        },
    })

    return { styles }
}
