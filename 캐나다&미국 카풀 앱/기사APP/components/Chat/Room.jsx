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
    Keyboard,
} from 'react-native';

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import { FlashList } from "@shopify/flash-list";
// import { LegendList } from "@legendapp/list/keyboard-controller";

import { KeyboardAvoidingView, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";

import { io, Socket } from "socket.io-client"

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Empty from '@/components/Empty';
import InputChat from '@/components/InputChat';

import Balloon from '@/components/Chat/Balloon';
import BalloonSystem from '@/components/Chat/BalloonSystem';

import RoutesView from '@/components/Post/RoutesView';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';
import SocketService from '@/libs/ws';

import { useUser, useAlert, useLoader, useEtc } from '@/libs/store';
import { numFormat, ToastMessage, badgeReload } from '@/libs/utils';

import chatQueue from '@/libs/chatQueue';

export default function Page({ headerHeight = 100 }) {

    const {
        idx,
        userIdx,
        profile,
        title,
        type
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { height, progress } = useReanimatedKeyboardAnimation();

    const { token, mbData, setRoomIdx } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();

    const socketRef = useRef(null);
    const listRef = useRef(null);
    const lottieRef = useRef(null);

    const [room, setRoom] = useState(null); // 
    const [post, setPost] = useState(null); // 


    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [lastIndex, setLastIndex] = useState(null);
    const [input, setInput] = useState('');

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
            if (appActiveStatus === 'active') {
                setRoomIdx(idx);
                roomInfo((data) => {
                    dataFunc(true, data);
                    socketConnect();
                });
            } 

            return () => {
                socketDisconnect();
                setRoomIdx(null);
            };
        }, [appActiveStatus, idx])
    );

    useEffect(() => {


    }, [appActiveStatus])


    useEffect(() => {

        if (reload) {
            // dataFunc(true);
            roomInfo();
        }

    }, [reload]);

    useEffect(() => {
        console.log('height, progress', height, progress);
    }, [height, progress])
    // useEffect(() => {
    //     if (socketRef?.current) { // 소켓이 연결되었을때
    //         if (input) {
    //             socketRef?.current?.emit('input', true);
    //         } else {
    //             socketRef?.current?.emit('input', false);
    //         }
    //     }
    // }, [socketRef, input])

    const roomInfo = async (callback) => {

        let sender = {
            chatIdx: idx
        }

        const { data, error } = await API.post('/v2/chat/chatInfo', sender);

        setRoom(data);
        setUsers(data?.members);
        setPost(data?.postInfo);

        if (callback) await callback(data);
    }

    const dataFunc = async (reset, roomInfo) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            chatIdx: idx,
            nextToken: reset ? null : nextToken
        }

        const { data, error } = await API.post('/v2/chat/messageList', sender);

        let fetchData = data?.list.reverse() || [];

        setMessages(prev => {
            return reset ? fetchData : [...fetchData, ...prev]
        });
        setNextToken(data?.nextToken);


        // badgeReload();

        setTimeout(() => {

            if (reset) {
                console.log('room?.lastIndex', roomInfo?.lastIndex);
                let index = fetchData?.findIndex(x => x?.idx === roomInfo?.lastIndex);
                // setLastIndex(index < 0 ? messages?.length - 1 : index);
                setLastIndex(fetchData?.length - 1);
            }
            // if (reset) listRef?.current?.scrollToEnd({ animated: false });

            // setList([]);
            setTimeout(() => {
                setInitLoad(false);
                setLoad(false);
                setReload(false);
            }, consts.apiDelay)

        }, consts.apiDelay)
    }

    const dataFuncTest = async (reset) => {

        setLoad(true);

        let fetchData = dummy.getChatDummys(100);
        fetchData = fetchData?.map((x, i) => {
            return {
                ...x,
                senderIdx: i % 3 === 0 ? mbData?.idx : 13
            }
        })
        setMessages(prev => {
            return reset ? fetchData : [...fetchData, ...prev]
        });


        setTimeout(() => {
            // let fetchData = data?.list || [];


            // setList([]);
            setTimeout(() => {
                setInitLoad(false);
                setLoad(false);
                setReload(false);
            }, consts.apiDelay)

        }, consts.apiDelay)
    }





    const socketConnect = () => {

        const socket = SocketService.getInstance();

        socket.emit('join', {
            chatIdx: idx
        });

        if (socket.listeners("message")?.length > 0) {
            return;
        }

        socket.on('message', (msg) => {
            console.log('message 왔음 !', msg, mbData?.idx);
            // setMessages((prev) => [...prev, msg || {}]);
            /* 
            {
                "chatIdx": 11, 
                "createAt": "2025-09-17T10:06:38.994Z", 
                "data": null, 
                "idx": 196, 
                "message": "send message!!!", 
                "receiveId": null, 
                "senderIdx": 13, 
                "type": "message", 
                "updateAt": "2025-09-17T10:06:38.994Z"
            }
            */
            chatQueue.enqueue(msg);
        });

        socket.on('input', (data) => {
            setIsEdit(data?.isEdit)
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
                setMessages((prev) => [...prev, msg || {}]);
                // listRef?.current?.recomputeViewableItems();
                if (msg?.data?.senderIdx === mbData?.idx) {
                    // listRef?.current?.scrollToOffset({ offset: 0, animated: true });
                };
            } catch (error) {
                console.error("Error handling message:", error);
                // chatQueue.enqueue(msg); // 실패 시 재추가
            }
        };
    }

    const socketDisconnect = () => {
        const socket = SocketService.getInstance();

        socket.emit('leave');
        socket.off('message');
        socket.off('input');
        socket.off('data');
    }

    const sendMessage = () => {

        if (isReadOnly) return;

        const socket = SocketService.getInstance();

        const inputReplace = input?.replace(/\s+/g, '');
        if (!input || inputReplace?.length < 1) {
            return;
        }

        socket.emit('message', {
            command: "message",
            message: input
        });

        socket?.emit('input', false);

        setInput('');
    }

    const renderItem = ({ item, index }) => {

        let next = messages?.[index + 1];
        let prev = messages?.[index - 1];

        let curDay = dayjs(item?.createAt).format("YYYY. MM. DD");
        let prevDay = dayjs(prev?.createAt).format("YYYY. MM. DD");

        let nextTime = dayjs(next?.createAt).format("YYYY.MM.DD HH:mm");
        let curTime = dayjs(item?.createAt).format("YYYY.MM.DD HH:mm");
        let prevTime = dayjs(prev?.createAt).format("YYYY.MM.DD HH:mm");

        let isMe = (item?.senderIdx === mbData?.idx);
        let isTime = (!next || next?.senderIdx !== item?.senderIdx || nextTime !== curTime);
        let isProfile = (prev?.senderIdx !== item?.senderIdx || prevTime !== curTime);

        let sender = users?.find(x => x?.idx === item?.senderIdx) || null;
        // if(index === 0) {
        //     console.log('RNImage.queryCache([ consts.apiUrl + item?.sender?.profile])', await RNImage.queryCache([ consts.apiUrl + item?.sender?.profile]));
        // }
        return (
            <>
                {(!prev?.idx || prevDay !== curDay) && (
                    <View style={styles.date}>
                        <Text style={styles.dateText}>{dayjs(item?.createAt).format('MMM DD, YYYY')}</Text>
                    </View>
                )}

                {item?.type === 'system' ? (
                    <BalloonSystem
                        item={item}
                        isMe={item?.data?.data?.idx === mbData?.idx}
                        isLast={!next}
                        users={users}
                        roomInfoReload={roomInfo}
                    // viewables={viewables}
                    />
                ) : (
                    <Balloon item={item} isMe={isMe} isProfile={isProfile} isTime={isTime} sender={sender} />
                )}
            </>
        )

    };

    return (
        <View style={{ flex: 1 }}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            {/* <Pressable style={styles.header} onPress={() => {
                router.dismissTo({
                    pathname: routes.postView,
                    params: {
                        idx: room?.postIdx
                    }
                })
            }}>
                <Text>{room?.idx}</Text>
                <RoutesView style={{ gap: 7 }} textStyle={{ fontSize: 16 }} way={[post?.itinerary[0], post?.itinerary?.at(-1)]} />
            </Pressable> */}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                contentContainerStyle={{ flex: 1 }}
                // behavior={Platform.OS === 'ios' ? "translate-with-padding" : "translate-with-padding"}
                // keyboardVerticalOffset={headerHeight}
                behavior={"position"}
                keyboardVerticalOffset={(insets?.top + rootStyle.header.height) - (insets?.bottom)}
            >
                {messages?.length > 0 ? (
                    <View style={{ flex: 1 }}>
                        <FlashList
                            ref={listRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => item?.idx}
                            initialScrollIndex={lastIndex}
                            maintainVisibleContentPosition={{
                                autoscrollToBottomThreshold: 0.2,
                                startRenderingFromBottom: true,
                            }}
                            keyboardDismissMode={'on-drag'}
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                paddingVertical: 20,
                                paddingHorizontal: rootStyle.side
                            }}

                            ListHeaderComponent={
                                () => {
                                    if (initLoad || !load || reload) return null;
                                    return (
                                        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                                            <ActivityIndicator size="small" color={colors.black} />
                                        </View>
                                    )
                                }

                            }
                            onStartReached={() => dataFunc()}
                            onStartReachedThreshold={0.6}

                        // maxItemsInRecyclePool={0}
                        // estimatedItemSize={49}
                        // maintainVisibleContentPosition={{
                        //     disabled: true,
                        //     animateAutoScrollToBottom: false,
                        //     autoscrollToBottomThreshold: 0.2,
                        //     startRenderingFromBottom: true,
                        // }}
                        // estimatedItemSize={30}
                        // initialScrollIndex={messages?.length - 1}
                        // maintainVisibleContentPosition




                        // refreshing={reload}
                        // onRefresh={() => {
                        //     setReload(true);
                        // }}

                        // onStartReached={() => dataFunc()}
                        // onStartReachedThreshold={0.6}

                        // showsVerticalScrollIndicator={false}
                        // style={{ backgroundColor: 'red' }}
                        // contentContainerStyle={{ 
                        //     padding: 16,
                        //     rowGap: 20,
                        //     // flex: 1
                        // }}

                        // keyExtractor={(item, index) => index}
                        // recycleItems={true}
                        // initialScrollIndex={messages.length - 1}
                        // drawDistance={1000}
                        // waitForInitialLayout
                        // initialScrollOffset={Number.MAX_SAFE_INTEGER}
                        // alignItemsAtEnd // Aligns to the end of the screen, so if there's only a few items there will be enough padding at the top to make them appear to be at the bottom.
                        // maintainScrollAtEnd // prop will check if you are already scrolled to the bottom when data changes, and if so it keeps you scrolled to the bottom.
                        // maintainScrollAtEndThreshold={0.1} // prop will check if you are already scrolled to the bottom when data changes, and if so it keeps you scrolled to the bottom.
                        // maintainVisibleContentPosition //Automatically adjust item positions when items are added/removed/resized above the viewport so that there is no shift in the visible content.



                        // onViewableItemsChanged={onViewableItemsChanged}
                        // viewabilityConfig={{
                        //     viewAreaCoveragePercentThreshold: 1,
                        //     minimumViewTime: 20
                        // }}
                        />
                    </View>
                ) : (
                    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
                        <Empty image={false} msg={lang({ id: 'no_message' })} />
                    </Pressable>
                )}

                <InputChat
                    name={'input'}
                    state={input}
                    setState={setInput}
                    placeholder={lang({ id: 'type_message' })}
                    onFocusFunc={() => {
                        if (input) socketRef?.current?.emit('input', true);
                    }}
                    onBlurFunc={() => {
                        socketRef?.current?.emit('input', false);
                    }}
                    sendMessage={sendMessage}
                    room={room}
                    readOnly={isReadOnly}
                    isEnd={isEnd}
                />

            </KeyboardAvoidingView>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        header: {
            paddingHorizontal: rootStyle.side,
            borderBottomColor: colors.sub_2,
            borderBottomWidth: 1,
            paddingBottom: 10,
            // position: 'absolute',
            // top: 0,
            // left: 0,
            // width: '100%',
            backgroundColor: colors.white,
            zIndex: 1,
        },
        date: {
            alignSelf: 'center',
            backgroundColor: colors.taseta_sub_2,
            borderRadius: 12,
            paddingHorizontal: 8,
            height: 23,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 30
        },
        dateText: {
            fontSize: 14,
            color: colors.taseta,
            fontFamily: fonts.medium
        }

    })

    return { styles }
}
