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
    Pressable,
    Keyboard,
} from 'react-native';

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, FadeInDown, FadeOut, FadeInUp, FadeIn } from 'react-native-reanimated';
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

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import InputChat from '@/components/InputChat';

import Balloon from '@/components/chat/Balloon';
import BalloonSystem from '@/components/chat/BalloonSystem';
import BalloonEditing from '@/components/chat/BalloonEditing';
import ChatNotice from '@/components/chat/ChatNotice';
import ChatVip from '@/components/chat/ChatVip';

import Header from '@/components/chatTheme/Header';
import { AnimatedText, AnimatedBackground } from '@/components/chatTheme/AnimatedColorComponents';

import ChatLeave from '@/components/popups/ChatLeave';
import ChatExit from '@/components/popups/ChatExit';
import ChatEnd from '@/components/popups/ChatEnd';
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

import { useUser, useAlert, useLoader, useEtc, useRoom, useConfig } from '@/libs/store';
import { badgeReload, ToastMessage, checkMic, useDebounce, useCountdown } from '@/libs/utils';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';

import chatQueue from '@/libs/chatQueue';

export default function Page({ }) {

    const {
        idx: roomIdx,
        back,
        animation
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, setRoomIdx } = useUser();
    const { avoidKeyboardLock, openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { transparencyEnabled, appActiveStatus, setAudioId } = useEtc();
    const { warningMessage, vipMessage, setWarningMessage, setLottieAt } = useRoom();
    const lottieAt = useRoom((s) => s.lottieAt[roomIdx]);

    const { configOptions } = useConfig();

    const { isInitialized, isRegistered, currentCall, callInvite, audioDevices, deviceToken, error, makeCall, unregister } = useTwilioVoice();

    const socketRef = useRef(null);
    const pageRef = useRef(null);
    const listRef = useRef(null);
    const lottieRef = useRef(null);
    const isAtBottom = useRef(true);

    const [room, setRoom] = useState(null); // 

    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const [isLeaveStatus, setIsLeaveStatus] = useState(1);
    const [isEdit, setIsEdit] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isEnd, setIsEnd] = useState(false);
    const [isKeepOn, setIsKeepOn] = useState(false);

    const [nextToken, setNextToken] = useState(null);


    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [callLoad, setCallLoad] = useState(false); // 보이스톡 로딩

    const [lottie, setLottieState] = useState(false); // 로티 뷰어

    const [refundExpireAt, setRefundExpireAt] = useState(null); // 소개 최종 종료 시간
    
    const viewables = useSharedValue([]);

    const debouncedValue = useDebounce(input, 100);
    const countdown = useCountdown(refundExpireAt);
    // const debouncedValue = useDebounce(input, 10);

    useFocusEffect(
        useCallback(() => {
            setRoomIdx(roomIdx);
            roomInfo();

            if (appActiveStatus === 'active') {
                if (!socketRef.current?.connected) {
                    socketConnect();
                }

                dataFunc(true);
            } else {
                socketRef.current?.disconnect();
            }

            return () => {
                socketRef.current?.disconnect();
                setRoomIdx(null);
                setAudioId(null);
                // setAudio({ source: null });
            };
        }, [appActiveStatus])
    );


    useEffect(() => {
        if (messages?.length > 0) {
            pageRef.current = messages?.[0]?.idx;

            let picketMessage = null;

            for (let i = messages.length - 1; i >= 0; i--) {
                const x = messages[i];

                if (
                    x?.type === 'system' &&
                    (
                        (x?.data?.type === 'sendFlirting' && x?.data?.receiveStatus === 2) ||
                        (x?.data?.type === 'sendSuperFlirting') ||
                        (x?.data?.type === 'finalReview')
                    )
                ) {
                    picketMessage = x;
                    break;
                }
            }

            if (!picketMessage) return;

            if (!lottieAt || dayjs(picketMessage?.createAt).isAfter(dayjs(lottieAt))) {
                setTimeout(() => {
                    setLottie(true);
                }, 500)
            }

        }
    }, [messages]);

    useEffect(() => {
        if (socketRef?.current) { // 소켓이 연결되었을때
            if (input) {
                socketRef?.current?.emit('input', true);
            } else {
                socketRef?.current?.emit('input', false);
            }
        }
    }, [socketRef, debouncedValue])

    useEffect(() => {
        if (isEdit && isAtBottom.current) {
            setTimeout(() => {
                console.green('scrollToEnd');
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [isEdit]);

    useEffect(() => {
        if (animation) {
            setLottie(true);
        }
    }, [animation]);

    useEffect(() => {
        if (countdown && countdown?.isFinished) {
            // roomInfo();
        }
    }, [countdown]);

    const setLottie = (data) => {
        setLottieState(false);

        setTimeout(() => {
            setLottieState(data);
            setLottieAt(roomIdx);
        }, 200)
    }

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            roomIdx: roomIdx,
            nextToken: reset ? (pageRef?.current ? (pageRef?.current * 1) : null) : nextToken
        }


        const { data, error } = await API.post('/v1/chat/chatList', sender);

        setNextToken(data?.nextToken);
        badgeReload();

        let fetchData = data?.list || [];
        setMessages(prev => {
            return reset ? fetchData : [...fetchData, ...prev]
        });

        setTimeout(() => {
            console.log('pageRef.current messages', pageRef?.current);
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, 300)
    }

    const roomInfo = async (callback) => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/roomInfo', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setRoom(data);
        setUsers(data?.users);

        setIsLeaveStatus(data?.users?.find(v => v.idx !== mbData?.idx)?.status);
        setIsEnd([2, 9]?.includes(data?.status)); // 채팅 나가기(삭제)가능

        setIsReadOnly(data?.lock); // 채팅 얼리기
        setIsKeepOn(data?.isKeepOn) // 채팅 계속유지

        setRefundExpireAt(data?.status === 8 ? data?.refundExpireAt : null);

        if (callback) await callback(data);
    }



    const socketConnect = () => {
        if (!token || !roomIdx) {
            ToastMessage("잘못된 접근입니다.");
            router.back();
            return;
        }
        const socket = io(consts.socketUrl, {
            auth: {
                token: token,
                roomIdx: roomIdx
            }
        });

        socketRef.current = socket;

        // setchatSocket(socket)
        // socket.on('call', () => {
        // });

        socket.on('connect', () => {
            console.log('서버에 연결됨:', socket.id);
        });

        socket.on('join', (data) => {
            // dataFunc(true);
            setMessages((prev) => prev?.map(x => { return { ...x, read: true } }));
        });

        socket.on('message', (msg) => {
            console.log('message 왔음 !', msg, mbData?.idx);

            chatQueue.enqueue(msg);

            if (msg?.data?.type === 'system') {
                if (msg?.data?.data?.type) roomInfo();
            }

        });

        socket.on('input', (data) => {
            setIsEdit(data?.isEdit);
        });
        socket.on('data', (data) => {
            console.log('data 왔음 !', data, mbData?.idx);

            if (data?.type === 'chatLock') {
                setIsReadOnly(data?.lock); // 채팅 잠금
            } else if (data?.type === 'chatEnd') {
                setIsEnd(true); // 채팅 종료
            } else if (data?.type === 'deleteMessage') {
                setMessages((prev) => prev?.filter(item => item?.idx !== data?.delIdx)); // 메시지 삭제
            } else if (data?.type === 'updateRoom') {
                if (data?.idxList?.includes(mbData?.idx)) return;
                roomInfo(); // 방 정보 갱신
            } else if (data?.type === 'updateMessage') {
                roomInfo(); // 방 정보 갱신
                dataFunc(true); // 채팅 리스트 갱신
            } else if (data?.type === 'receiveFlirting') {
                setMessages((prev) =>
                    prev?.map(x => {
                        if (x?.idx !== data?.chatIdx) return x;

                        ToastMessage(x?.data?.targetName + (data?.receiveStatus === 2 ? '님이 픽켓을 수령했습니다.' : data?.receiveStatus === 3 ? '님이 픽켓을 거절했습니다.' : '님이 픽켓을 전달했습니다.'));
                        return { ...x, data: { ...x?.data, receiveStatus: data?.receiveStatus } }
                    })
                );
                // if (data?.receiveStatus === 2) {
                //     // ToastMessage(data?.name + '님이 픽켓을 수령했습니다.');
                //     setLottie(true);
                // }
            } else if (data?.type === 'writeReview') {
                setMessages((prev) =>
                    prev?.map(x => {
                        if (x?.idx !== data?.chatIdx) return x;
                        return { ...x, data: { ...x?.data, isWrite: data?.isWrite } }
                    })
                );
            } else if (data?.type === 'animation') {
                // setLottie(true);
            }
        });

        // socket.on('confirm', (data) => {
        //     console.log('update 왔음 !');
        //     // dataFunc(true);
        //     // data로 받아서 [{ buttonType: 1, title: '거절하기', onPress: 'api/asdasdsad' }]

        // });

        // 큐에서 메시지 처리 후 UI 업데이트
        chatQueue.handleMessage = async (msg) => {
            try {
                // UI에 메시지 추가
                setMessages((prev) => [...prev, msg?.data || {}]);
                if (msg?.data?.senderId === mbData?.idx) {
                    console.green('scrollToEnd2');
                    listRef?.current?.scrollToEnd();
                };
            } catch (error) {
                console.error("Error handling message:", error);
                // chatQueue.enqueue(msg); // 실패 시 재추가
            }
        };
    }


    const sendMessage = () => {

        if (isReadOnly) return;

        const inputReplace = input?.replace(/\s+/g, '');
        if (!input || inputReplace?.length < 1) {
            return;
        }

        socketRef.current?.emit('message', {
            command: "message",
            message: input
        });

        setInput('');
        socketRef?.current?.emit('input', false);

    }

    const sendMessageTest = () => {

        socketRef.current?.emit('message', {
            command: "message",
            message: Math.random().toString(36) + Math.random().toString(36) + Math.random().toString(36) + Math.random().toString(36) + Math.random().toString(36)
        });
        setTimeout(() => {
            sendMessageTest();
        }, 1500)
        return;

        let string = Math.random().toString(36);

        socketRef.current?.emit('message', {
            command: "message",
            message: string + string + string + string + string
        });

        socketRef?.current?.emit('input', false);
    }

    const sendPhoto = async (photos) => {

        if (isReadOnly) return;
        if (photos?.length < 1) return;

        openLoader();

        console.log('photos', photos?.length);

        let sender = {
            files: photos,
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/imageUpload', sender);

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            socketRef.current?.emit('message', {
                command: "photo",
                data: data
            });

        }, consts.apiDelayLong)

    }

    const sendVoice = async ({ file, duration }) => {
        console.log('sendVoice', duration)
        if (isReadOnly) return;

        if (!file) {
            ToastMessage('음성 메시지 전송에 실패했습니다.');
            return;
        }

        openLoader();

        let sender = {
            file: file,
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/voiceUpload', sender);

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            socketRef.current?.emit('message', {
                command: "voice",
                data: {
                    file: data,
                    duration: duration
                }
            });
        }, consts.apiDelay)

    }


    const makeCallFunc = async () => {

        if (currentCall || callInvite) return;
        if (isReadOnly) return;
        if (callLoad) return;

        const status = await checkMic();
        if (!status) return;

        const { data: tokenData, error: tokenError } = await API.post('/v1/user/createTwilioToken');
        if (tokenError) {
            ToastMessage(tokenError?.message);
            return;
        }


        setCallLoad(true);
        openLoader();

        // 전화걸겠음 API 호출 -> sasoham_... 받기
        const sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/callInfo', sender);

        if (error) {
            ToastMessage(error?.message);
            setCallLoad(false);
            closeLoader();
            return;
        }

        try {
            // 소켓으로 call emit
            await makeCall(tokenData, {
                params: {
                    To: `client:${data}`,
                    callerIdx: mbData?.idx + "",
                    callerName: mbData?.name,
                    callerProfile: mbData?.profile,
                    calleeIdx: users?.find(x => x?.idx !== mbData?.idx)?.idx + "",
                    calleeName: users?.find(x => x?.idx !== mbData?.idx)?.name,
                    calleeProfile: users?.find(x => x?.idx !== mbData?.idx)?.profile,
                    roomIdx: roomIdx,
                },
                notificationDisplayName: users?.find(x => x?.idx !== mbData?.idx)?.name,
                contactHandle: users?.find(x => x?.idx !== mbData?.idx)?.name
            })
        } catch (error) {
            console.green('error', error);
        } finally {
            setTimeout(() => {
                setCallLoad(false);
                closeLoader();
            }, consts.apiDelay)
        }


    };

    const makeCallReserveFunc = async (date) => {

        const selectDate = dayjs(date);

        if (dayjs().add(30, 'minutes').isAfter(selectDate)) {
            ToastMessage('통화 예약은 최소 30분 이후부터 가능합니다.');
            return;
        }

        // 전화걸겠음 API 호출 -> sasoham_... 받기
        const sender = {
            roomIdx: roomIdx,
            date: selectDate
        }

        const { data, error } = await API.post('/v1/chat/reservationCall', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        ToastMessage('통화 예약이 완료되었습니다.');

    }

    const renderItem = ({ item, index }) => {

        let next = messages?.[index + 1];
        let prev = messages?.[index - 1];

        let curDay = dayjs(item?.createAt).format("YYYY.MM.DD (dd)");
        let prevDay = dayjs(prev?.createAt).format("YYYY.MM.DD (dd)");
        let nextDay = dayjs(next?.createAt).format("YYYY.MM.DD (dd)");

        let nextTime = dayjs(next?.createAt).format("YYYY.MM.DD HH:mm");
        let curTime = dayjs(item?.createAt).format("YYYY.MM.DD HH:mm");
        let prevTime = dayjs(prev?.createAt).format("YYYY.MM.DD HH:mm");

        let isMe = (item?.senderId === mbData?.idx);
        let isTime = (!next || next?.senderId !== item?.senderId || nextTime !== curTime);
        let isProfile = (prev?.senderId !== item?.senderId || prevTime !== curTime);

        if (item?.type === 'system') {
            // console.log('system !!', item?.data?.type, item?.data);
        }

        // if(index === 0) {
        //     console.log('RNImage.queryCache([ consts.apiUrl + item?.sender?.profile])', await RNImage.queryCache([ consts.apiUrl + item?.sender?.profile]));
        // }
        return (
            <View>
                {(!prev?.idx || prevDay !== curDay) && (
                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.date}>
                        <Image source={images.calendar} style={rootStyle.default20} tintColor={chatTheme?.primary} transition={200} />
                        <AnimatedText color={chatTheme?.primary} style={styles.dateText}>{curDay}</AnimatedText>
                    </AnimatedBackground>
                )}

                {item?.type === 'system' ? (
                    <BalloonSystem
                        item={item}
                        isMe={item?.data?.data?.idx === mbData?.idx}
                        isLast={!next}
                        leaveAlert={leaveAlert}
                        lottiePlay={() => {
                            setLottie(false);
                            setTimeout(() => {
                                setLottie(true);
                            }, 100)
                        }}
                        users={users}
                        roomInfoReload={roomInfo}
                        chatTheme={chatTheme}
                        room={room}
                    // viewables={viewables}
                    />
                ) : (
                    <Balloon 
                        item={item} 
                        isMe={isMe} 
                        isProfile={isProfile} 
                        isTime={isTime} 
                        isVip={room?.isVip} 
                        isLeaveStatus={room?.type === 3 ? 1 : isLeaveStatus}
                        chatTheme={chatTheme} 
                        users={users}
                    />
                )}
            </View>
        )

    };

    const sendFlirting = () => {
        // if(isReadOnly) return;

        router.navigate({
            pathname: routes.chatFlirting,
            params: {
                roomIdx: roomIdx,
            }
        })
    }

    const leaveAlert = () => {

        Keyboard.dismiss();

        roomInfo((data) => {
            if (data?.type > 2) {
                openAlertFunc({
                    component: <ChatExit room={data} />
                })
                return;
            }

            if (isKeepOn) {
                openAlertFunc({
                    component: <ChatEnd room={data} callback={roomInfo}/>
                })
            } else {
                openAlertFunc({
                    component: <ChatLeave room={data} />
                })
            }

        });
    }

    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };


    const headerHeight = (insets?.top + rootStyle.header.height) - (insets?.bottom);

    const chatTheme = room?.type === 3 ? chatStyle?.chat_season_manager : chatStyle?.[`chat_season_${isKeepOn ? 5 : room?.dayCount > 4 ? 4 : room?.dayCount}`];
    // const chatTheme = chatStyle?.chat_season_3;

    if (!chatTheme) return <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />;

    return (
        <ImageBackground
            style={{ flex: 1 }}
            source={chatTheme?.backgroundImage}
            contentFit="cover"
            transition={200}
        >
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
           
            {lottie && (
                <View style={styles.lottie} pointerEvents={'none'}>
                    <LottieView
                        ref={lottieRef}
                        source={chatTheme?.lottie}
                        // source={chatStyle?.chat_season_3.lottie}
                        autoPlay={true}
                        loop={false}
                        style={{ flex: 1 }}
                        resizeMode={'cover'}
                        onAnimationFailure={(err) => {
                            setLottie(false);
                        }}
                        onAnimationFinish={() => {
                            setLottie(false);
                        }}
                    />
                </View>
            )}
            <Header room={room} isLeaveStatus={isLeaveStatus} chatTheme={chatTheme} leaveAlert={leaveAlert} setLottie={setLottie} onBadge={() => {
                router.navigate({
                    pathname: routes.chatFlirtingBox,
                    params: {
                        roomIdx: room?.idx
                    }
                })
            }} />

            {/* <TouchableOpacity style={{ position: 'absolute', left: 0, right: 0, height: 100, zIndex: 1000, backgroundColor: 'red' }} onPress={() => {
                // setIsEnd(!isEnd);
                roomInfo();
            }}>
                <Text>sadas</Text>
            </TouchableOpacity> */}


            <MaskedView
                style={{ flex: 1 }}
                maskElement={
                    <LinearGradient
                        colors={[
                            'transparent',   // 위 완전 투명
                            'white',         // 중간 완전 표시
                            'white',
                        ]}
                        locations={
                            Platform.OS === 'ios' ? [0, 0.05, 1] : [0, 0.05, 1]
                        }
                        style={{ flex: 1, marginTop: rootStyle.header.height + insets?.top + (room?.type === 3 ? 0 : 44) }}
                    />
                }
            >

                <View style={{ flex: 1 }}>


                    <KeyboardAvoidingView
                        enabled={!avoidKeyboardLock}
                        style={{ flex: 1, }}
                        contentContainerStyle={{ flex: 1 }}
                        // behavior={Platform.OS === 'ios' ? "translate-with-padding" : "translate-with-padding"}
                        // keyboardVerticalOffset={headerHeight}
                        behavior={"position"}
                        keyboardVerticalOffset={-insets?.bottom}
                    >
                        {/* <Text>{messages?.map(x => x.idx)?.join(",")}</Text> */}

                        <View style={{ flex: 1 }}>

                            <FlashList
                                ref={listRef}
                                data={messages}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => item?.idx+""}
                                getItemType={(item) => {
                                    return item?.type;
                                }}
                                maintainVisibleContentPosition={{
                                    autoscrollToBottomThreshold: Platform.OS === 'ios' ? 0.05 : 0.2,
                                    startRenderingFromBottom: true,
                                    animateAutoScrollToBottom: Platform.OS === 'ios'
                                }}
                                keyboardDismissMode={'on-drag'}
                                // keyboardShouldPersistTaps={"never"}
                                style={{ flex: 1 }}
                                contentContainerStyle={{
                                    padding: rootStyle.side,
                                    paddingTop: 160,
                                    paddingBottom: insets?.bottom + 85
                                }}

                                onStartReached={() => dataFunc()}
                                onStartReachedThreshold={0.6}
                                onScroll={(e) => {
                                    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                                    isAtBottom.current = contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;
                                }}
                                ListFooterComponent={
                                    <View>
                                        <BalloonEditing isEdit={isEdit} chatTheme={chatTheme} />

                                        {(room?.type === 2 && !warningMessage?.includes(room?.idx)) && (
                                            <AnimatedBackground bg={chatTheme?.badgeBackgroundColor} style={[styles.roomWarning, { borderColor: chatTheme?.primary }]}>
                                                <Image source={images.alarm_warning} style={[rootStyle.default]} tintColor={chatTheme?.primary} transition={200} />

                                                <View style={{ flex: 1, gap: 4 }}>
                                                    <AnimatedText color={chatTheme?.primary} style={styles.roomWarningTitle}>대화방 매너를 지켜주세요!</AnimatedText>
                                                    <Text style={styles.roomWarningSubTitle}>{`상대방을 존중해주세요!\n신고 접수 시 사소한 1% 이용에 제한이 있습니다.`}</Text>
                                                </View>

                                                <Icon img={images.exit_grey} imgStyle={rootStyle.default} style={styles.exit} hitSlop={10} tintColor={chatTheme?.primary} onPress={() => {
                                                    setWarningMessage(room?.idx)
                                                }} />
                                            </AnimatedBackground>
                                        )}

                                        {/* <Animated.View style={animatedFooterStyle} /> */}
                                    </View>

                                }

                            // ListHeaderComponent={
                            //     () => {
                            //         if (initLoad || !load || reload) return null;
                            //         return (
                            //             <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                            //                 <ActivityIndicator size="small" color={colors.black} />
                            //             </View>
                            //         )
                            //     }

                            // }

                            />
                        </View>

                        {/* room?.endTimestamp ? ( // 결정의날 결정해야함
                            mbData?.level === 1 ? (
                                room?.userAccept === 1 ? (
                                    <Pressable style={styles.button} onPress={() => {
                                        router.navigate({
                                            pathname: routes.chatTopFlirtingInfo,
                                            params: {
                                                roomIdx: room?.idx
                                            }
                                        })
                                    }}>
                                        {({ pressed }) => (
                                            <Text style={[styles.buttonText, pressed && { opacity: 0.5 }]}>결정하기</Text>
                                        )}
                                    </Pressable>
                                ) : (
                                    <View style={styles.button}>
                                        <Text style={styles.buttonText}>상대방의 결정을 기다리는 중입니다.</Text>
                                        <Flow size={36} color={colors.white} />
                                    </View>
                                )
                            ) : (
                                (room?.userAccept !== 1 && room?.visualAccept === 1) ? (
                                    <Pressable style={styles.button} activeOpacity={0.7} onPress={() => {
                                        router.navigate({
                                            pathname: routes.chatFinalVisual,
                                            params: {
                                                roomIdx: room?.idx
                                            }
                                        })
                                    }}>
                                        {({ pressed }) => (
                                            <Text style={[styles.buttonText, pressed && { opacity: 0.5 }]}>결정하기</Text>
                                        )}
                                    </Pressable>

                                ) : (
                                    <View style={styles.button}>
                                        <Text style={styles.buttonText}>상대방의 결정을 기다리는 중입니다.</Text>
                                        <Flow size={36} color={colors.white} />
                                    </View>
                                )
                            )

                        ) 
                        */}


                        <View style={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }}>
                       
                            {isEnd ? (
                                <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
                                    <Button
                                        type={21}
                                        bottom
                                        avoidKeyboardLock={avoidKeyboardLock}
                                        onPress={() => {
                                            openAlertFunc({
                                                component: <ChatExit room={room} />
                                            })
                                        }}
                                    >
                                        채팅방 나가기
                                    </Button>
                                </Animated.View>
                            ) : (
                                <InputChat
                                    name={'input'}
                                    state={input}
                                    setState={setInput}
                                    placeholder={`메시지 입력`}

                                    onBlurFunc={() => {
                                        socketRef?.current?.emit('input', false);
                                    }}
                                    // sendMessage={sendMessageTest}
                                    sendMessage={sendMessage}
                                    sendPhoto={sendPhoto}

                                    onPressTicket={(mbData?.level === 1 && room?.type === 2 && !isKeepOn) ? sendFlirting : null}
                                    onPressVoicetalk={room?.type === 2 ? makeCallFunc : null}
                                    onPressVoiceMessage={room?.type === 2 ? sendVoice : null}
                                    onPressCallReserve={room?.type === 2 ? makeCallReserveFunc : null}

                                    room={room}
                                    readOnly={isReadOnly}
                                    isEnd={isEnd}
                                    chatTheme={chatTheme}

                                    readOnlyPlaceHolder={
                                        room?.status === 8 ? (
                                            countdown ? `소개 종료 시까지 ${countdown?.formatted} 남았습니다.` 
                                            : countdown?.isFinished ? '소개 종료중입니다...'
                                            : null
                                        ) : null
                                    }
                                />
                            )}
                            
                        </View>


                    </KeyboardAvoidingView>
                </View>

            </MaskedView>

            {!initLoad && room?.isVip && !vipMessage?.includes(room?.idx) && (
                <ChatVip room={room} />
            )}

            {/* 
                
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Button onPress={() => {
                    console.log('play');
                    setLottie(true);
                }}>
                    <Text>Play</Text>
                </Button>
            </View> */}
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



    })

    return { styles }
}
