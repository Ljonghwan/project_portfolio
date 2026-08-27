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
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Flow } from 'react-native-animated-spinkit'
import LottieView from 'lottie-react-native';

import { FlashList } from "@shopify/flash-list";
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
import BalloonEditing from '@/components/chat/BalloonEditing';
import ChatNotice from '@/components/chat/ChatNotice';

import ChatLeave from '@/components/popups/ChatLeave';
import ChatInfoFlirting from '@/components/popups/ChatInfoFlirting';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
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
            roomInfo();
        }, [])
    );
    
    useEffect(() => {

        if(appActiveStatus === 'active') {
            dataFunc(true);
        }

    }, [appActiveStatus])

    useEffect(() => {

        setRoomIdx(roomIdx);

        return () => {
            setRoomIdx(null);
            setAudioId(null);
        };

    }, []);

    // useEffect

    useEffect(() => {

        if (lottie) {
            setTimeout(() => {
                lottieRef.current?.play();
            }, 10)
        } 

    }, [lottie]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            roomIdx: roomIdx,
            nextToken: reset ? null : nextToken
        }

        const { data, error } = await API.post('/v1/chat/chatList', sender);

        setNextToken(data?.nextToken);
        badgeReload();

        setTimeout(() => {
            let fetchData = data?.list || [];
            setMessages(prev => {
                return reset ? fetchData : [...prev, ...fetchData]
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

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setRoom(data);
        setUsers(data?.users);
        setIsEnd(data?.status !== 1); // 채팅 종료
        setIsReadOnly(data?.lock); // 채팅 얼리기
        setIsKeepOn(( data?.type === 2 && data?.status === 1 && data?.userAccept === 2 && data?.visualAccept === 2 && !data?.endTimestamp )) // 채팅 계속유지

        sender = {
            limit: 20
        }
        
        const { data: notice } = await API.post('/v1/notice/list', sender);
        setNotices(notice?.list || []);

        if (callback) await callback(data);
    }


    const renderItem = ({ item, index }) => {

        let next = messages?.[index - 1];
        let prev = messages?.[index + 1];

        let curDay = dayjs(item?.createAt).format("YYYY.MM.DD (dd)");
        let prevDay = dayjs(prev?.createAt).format("YYYY.MM.DD (dd)");

        let nextTime = dayjs(next?.createAt).format("YYYY.MM.DD HH:mm");
        let curTime = dayjs(item?.createAt).format("YYYY.MM.DD HH:mm");
        let prevTime = dayjs(prev?.createAt).format("YYYY.MM.DD HH:mm");

        let isMe = (item?.senderId === mbData?.idx);
        let isTime = (!next || next?.senderId !== item?.senderId || nextTime !== curTime);
        let isProfile = (prev?.senderId !== item?.senderId || prevTime !== curTime);

        return (
            <>
                {(!prev?.idx || prevDay !== curDay) && (
                    <View style={styles.date}>
                        <Image source={images.calendar} style={rootStyle.default20} />
                        <Text style={styles.dateText}>{curDay}</Text>
                    </View>
                )}

                {item?.type === 'system' ? (
                    <BalloonSystem 
                        item={item} 
                        isMe={item?.data?.data?.idx === mbData?.idx} 
                        isLast={!next} 
                        leaveAlert={leaveAlert} 
                        lottiePlay={() => {
                            setLottie(true);
                        }} 
                        users={users}
                        roomInfoReload={roomInfo}
                        // viewables={viewables}
                    />
                ) : (
                    <Balloon item={item} isMe={isMe} isProfile={isProfile} isTime={isTime} />
                )}
            </>
        )

    };

    const leaveAlert = () => {
    }
    
    const headerHeight = (insets?.top + rootStyle.header.height ) - (insets?.bottom);

    return (
        <Layout header={{
            chat: {
                roomIdx: roomIdx,
                roomType: room?.type,
                user: {
                    idx: room?.user?.idx,
                    name: room?.user?.name,
                    type: room?.type === 3 ? consts.manager?.[`manager${room?.user?.type}`]?.title : '회원',
                    profile: room?.user?.profile,
                    level: room?.user?.type
                }
            }
        }}>

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <ChatNotice list={notices} view={notice} setView={setNotice}/>

            <View style={{ flex: 1, display: !notice ? 'flex' : 'none' }}>
                <View style={styles.header}>

                    {/* 컴포넌트로 프리뷰 챗 or 일반 챗 */}
                    {room?.type < 3 && (
                        <TouchableOpacity style={[styles.headerBadge]} activeOpacity={1} onPress={() => {
                            if(room?.type !== 2 || isKeepOn ) return;
                            if(room?.type === 2 && isEnd && !isKeepOn ) return;

                            openAlertFunc({
                                component: <ChatInfoFlirting onPress={sendFlirting} count={room?.flirtingCount} />
                            })
                        }}>
                            <View style={[styles.headerBadgeOverlay, { opacity: (Platform.OS === 'ios' && transparencyEnabled) || Platform.OS === 'android' ? 1 : 0.6 }]} />
                            <BlurView style={[styles.headerBadgeView]} intensity={Platform.OS === 'ios' && transparencyEnabled ? 0 : 30} tint='extraLight'>
                                {room?.type === 1 ? (
                                    <Text style={styles.headerBadgeText}>💕 프리뷰 챗</Text>
                                ) : (
                                    <View style={[rootStyle.flex, { gap: 8 }]}>
                                        <Text style={styles.headerBadgeText}>💕 {(isKeepOn || room?.status === 2) ? '결정완료' : `현재 소개 ${room?.dayCount > 4 ? 4 : room?.dayCount}일차`}</Text>
                                        {(!isKeepOn && room?.status !== 2) && (
                                            <>
                                                <Image source={images.flirting} style={[rootStyle.flirting, { width: 12 }]} />
                                                <Text style={styles.headerBadgeText}>{numFormat(room?.flirtingCount)}개</Text>
                                            </>
                                        )}
                                    </View>
                                )}
                            </BlurView>

                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={{ flex: 1 }}>
                    
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        // behavior={Platform.OS === 'ios' ? "translate-with-padding" : "translate-with-padding"}
                        // keyboardVerticalOffset={headerHeight}
                        behavior="translate-with-padding"
                        keyboardVerticalOffset={headerHeight}
                    >
                        {/* <Text>{messages?.map(x => x.idx)?.join(",")}</Text> */}

                        <View style={{ flex: 1 }}>
                            <FlashList
                                ref={listRef}
                                data={messages}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => item?.idx}
                                getItemType={(item) => {
                                    return item?.type;
                                }}
                                estimatedItemSize={30}
                                // removeClippedSubviews={true}
                                // initialNumToRender={20}
                                inverted
                                // keyboardDismissMode={'on-drag'}
                                keyboardShouldPersistTaps={"never"}
                                style={{ flex: 1 }}
                                contentContainerStyle={{
                                    padding: 16,
                                    paddingBottom: room?.type < 3  ? 100 : 56,
                                    // paddingTop: isEdit ? 60 : 0
                                }}

                                // refreshing={reload}
                                // onRefresh={() => {
                                //     setReload(true);
                                // }}

                                onEndReached={() => dataFunc()}
                                onEndReachedThreshold={0.6}

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

                                ListHeaderComponent={
                                    <>

                                        {isEdit && (
                                            <BalloonEditing isEdit={isEdit} />
                                        )}

                                        {(room?.type === 2 && !warningMessage?.includes(room?.idx)) && (
                                            <View style={styles.roomWarning}>
            
                                                <Image source={images.alarm_warning} style={[rootStyle.default ]} />
            
                                                <View style={{ flex: 1, gap: 4 }}>
                                                    <Text style={styles.roomWarningTitle}>대화방 매너를 지켜주세요!</Text>
                                                    <Text style={styles.roomWarningSubTitle}>{`상대방을 존중해주세요!\n신고 접수 시 탑 비주얼 이용에 제한이 있습니다.`}</Text>
                                                </View>
            
                                                <Icon img={images.exit_grey} imgStyle={rootStyle.default} style={styles.exit} hitSlop={10} onPress={() => {
                                                    setWarningMessage(room?.idx)
                                                }}/>
                                            </View>
                                        )}
                                        

                                    </>
                                
                                }
                                ListFooterComponent={
                                    () => {
                                        if (initLoad || !load || reload) return null;
                                        return (
                                            <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                                                <ActivityIndicator size="small" color={colors.black} />
                                            </View>
                                        )
                                    }

                                }

                                // onViewableItemsChanged={onViewableItemsChanged}
                                // viewabilityConfig={{
                                //     viewAreaCoveragePercentThreshold: 1,
                                //     minimumViewTime: 20
                                // }}
                            />
                        </View>

                        <Button type={4} bottom onPress={() => router.back()}>나가기</Button>

                    </KeyboardAvoidingView>
                </View>
                
            </View>

            <View style={styles.lottie} pointerEvents={'none'}>
                <LottieView
                    ref={lottieRef}
                    source={images.lottie_flirting}
                    autoPlay={false}
                    loop={false}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={'cover'}
                    onAnimationFailure={(err) => {
                        setLottie(false);
                    }}
                    onAnimationFinish={() => {
                        setLottie(false);
                    }}
                />
            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        header: {
            width: '100%',
            position: 'absolute',
            zIndex: 10,
            top: 67,
            gap: 16
        },
        headerBadge: {
            borderRadius: 100,
            alignSelf: 'center',
            overflow: 'hidden'
        },
        headerBadgeOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.system,
            opacity: 0.6
        },
        headerBadgeView: {
            paddingHorizontal: 20,
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
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


        lottie: {
            ...StyleSheet.absoluteFill,
            flex: 1,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            backgroundColor: 'transparent',
            paddingBottom: rootStyle.header.height + insets?.top,
            pointerEvents: 'none', // 터치 통과
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
