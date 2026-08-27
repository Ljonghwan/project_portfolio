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
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Pressable,
    Platform
} from 'react-native';

import { router, useFocusEffect, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { SequencedTransition, FadeIn, ZoomIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import { io } from 'socket.io-client';
import * as Location from 'expo-location';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Switch from '@/components/Switch';
import LoadingRipple from '@/components/LoadingRipple';

import RideShareInfo from '@/components/Item/RideShareInfo';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, useBackHandler, checkBackgroundGpsPermission, startBackgroundGps } from '@/libs/utils';

import { useUser, useAlert, useEtc, useConfig } from '@/libs/store';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Page({ }) {

    const pathname = usePathname();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { appActiveStatus } = useEtc();
    const { configOptions } = useConfig();

    const socketRef = useRef(null);
    const timerRef = useRef(null);

    const [call, setCall] = useState(null);

    const [conneted, setConnected] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩


    const textColor = useSharedValue(0);
    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(!textColor.value ? colors.main : colors.sub_1, { duration: 300 }),
        };
    });
    const animatedTextStyle2 = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value ? colors.main : colors.sub_1, { duration: 300 }),
        };
    });

    useBackHandler(() => {
        closeFunc();
        return true;
    });

    useFocusEffect(
        useCallback(() => {
            if (appActiveStatus === 'active' && mbData?.callStatus === 3) {
                socketConnect();
            } else {
                socketRef.current?.disconnect();
            }

            return () => {
                socketRef.current?.disconnect();
            };
        }, [appActiveStatus, mbData])
    );

    useEffect(() => {
        textColor.value = mbData?.callStatus === 3 ? 1 : 0;
    }, [mbData])


    const socketConnect = () => {

        const socket = io(consts.rideSocketUrl, {
            auth: {
                token: token
            }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🟢 Socket connected:', socket.id);
            setConnected(true);
            // if (Platform.OS !== 'ios' ) {
            //     socket.emit('test', {
            //         userIdx: 13,
            //         event: "message",
            //         data: { idx: 1, userIdx: 14 }
            //     });
            // }
        });
        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setConnected(false);
        });
        socket.on('connect_error', (err) => {
            console.log('❌ Socket connection error:', err.message);
        });


        socket.on('message', (data) => {
            console.log('message 왔음 !', data);
            if (data?.type === "call") {
                callReceive(data?.data);
            } else if (data?.type === "test") {

            }
        });

    }

    const callReceive = (data) => {
        if (!data?.idx) return;

        setCall(data);

        // 10초 타이머 시작
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            rejectCall();
        }, configOptions?.callLimit * 1000);
    }

    const rejectCall = async () => {
        if (load) return;

        setLoad(true);

        const sender = {
            callIdx: call?.idx,
        }

        const { data, error } = await API.post('/v2/driver/call/cancel', sender);
        console.log('error', data, error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        }

        setCall(null);
        setLoad(false);

        // 10초 타이머 종료
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    const acceptCall = async () => {

        if (load) return;

        setLoad(true);

        const sender = {
            callIdx: call?.idx,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v2/driver/call/accept', sender);
        console.log('error', data, error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        } else {
            router.replace(routes.call)
        }

        setCall(null);
        setLoad(false);

        // 10초 타이머 종료
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }


    const testFunc = (data) => {
        if (!data?.idx) return;

        callReceive(data);
    }

    const togglePress = async (v) => {

        if ((mbData?.callStatus === 3) === v) return;

        try {
            if (v) {
                let status = await checkBackgroundGpsPermission();
                if (!status) return;
                await startBackgroundGps();
            } else {
                await Location.stopLocationUpdatesAsync("location");
            }
        } catch (error) {
            console.log("error", error);
        }

        const sender = {
            status: v,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v2/driver/call/chageActive', sender);

        reload();
        // setToggle(v === 1 ? false : v === 2 ? true : !toggle);
    }

    const closeFunc = () => {
        openAlertFunc({
            label: lang({ id: 'should_break_mode' }),
            onCencleText: lang({ id: 'cancel' }),
            onPressText: lang({ id: 'yes' }),
            onCencle: () => { },
            onPress: () => {
                togglePress(false);

                router.canDismiss() && router.dismissAll();
                router.replace(routes.tabs);
                // router.canGoBack() && router.back();
            }
        })
    }

    const header = {
        left: {
            icon: 'back',
            onPress: closeFunc
        },
        title: lang({ id: 'awaiting_requests' })
    };


    return (
        <Layout header={header}>
            <View style={styles.root}>
                <View style={styles.container}>

                    {mbData?.callStatus === 3 && conneted ? (
                        call ? (
                            <Animated.View
                                key={'call'}
                                entering={ZoomIn}
                                style={{
                                    width: '100%',
                                    alignItems: 'center',
                                    gap: 40
                                }}
                            >
                                <View style={{ gap: 5 }}>
                                    <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), textAlign: 'center' }}>{lang({ id: 'new_ride_request' })}</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: 'ready_pick_up' })}</Text>
                                </View>

                                <View style={{ width: '100%', gap: 20 }}>
                                    <RideShareInfo item={call} />
                                    <View style={[rootStyle.flex, { gap: 14 }]}>
                                        <Button style={{ flex: 1 }} type={2} onPress={rejectCall}>{lang({ id: 'reject' })}</Button>
                                        <Button style={{ flex: 1 }} onPress={acceptCall}>{lang({ id: 'accept' })}</Button>
                                    </View>
                                </View>

                            </Animated.View>
                        ) : (
                            <Animated.View
                                key={'active'}
                                entering={FadeIn}
                                style={{
                                    alignItems: 'center'
                                }}
                            >
                                <LoadingRipple />
                                <Text style={{ ...rootStyle.font(20, colors.sub_1, fonts.semiBold), textAlign: 'center' }}>{lang({ id: 'accepting_requests' })}</Text>
                                <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center', marginTop: 5 }}>{lang({ id: 'if_you_leave_the_screen' })}</Text>
                            </Animated.View>
                        )
                    ) : (
                        <Animated.View
                            key={'break'}
                            entering={FadeIn}
                            style={{
                                alignItems: 'center'
                            }}
                        >
                            <Image source={images.tea} style={rootStyle.tea} />
                            <Text style={{ ...rootStyle.font(20, colors.sub_1, fonts.semiBold), textAlign: 'center' }}>{lang({ id: 'taking_break' })}</Text>
                        </Animated.View>
                    )}


                </View>
                <View style={{ gap: 23 }}>
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <Pressable onPress={() => togglePress(false)} >
                            <AnimatedText style={[{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }, animatedTextStyle]} >{lang({ id: 'break' })}</AnimatedText>
                        </Pressable>
                        <Switch
                            value={mbData?.callStatus === 3}
                            togglePress={() => togglePress(!(mbData?.callStatus === 3))}
                        />
                        <Pressable onPress={() => togglePress(true)}>
                            <AnimatedText style={[{ ...rootStyle.font(18, colors.main, fonts.medium) }, animatedTextStyle2]} >{lang({ id: 'active' })}</AnimatedText>
                        </Pressable>
                    </View>
                    <Button onPress={() => {
                        router.push({
                            pathname: routes.terms,
                            params: {
                                idx: 6,
                                title: lang({ id: 'precautions' })
                            }
                        })
                    }}>
                        {lang({ id: 'check_precautions' })}
                    </Button>
                </View>

            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20
        },
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        }

    })

    return { styles }
}
