import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking, Platform, Pressable, Share } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { io } from 'socket.io-client';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import LoadingRipple from '@/components/LoadingRipple';
import Select from '@/components/Select';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import RoutesViewSimple from '@/components/Call/RoutesViewSimple';

import ReportCall from '@/components/Popup/ReportCall';
import FareDetail from '@/components/Popup/FareDetail';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen, numDoler, useBackHandler } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, useEtc } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();

    const socketRef = useRef(null);
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [info, setInfo] = useState(null);
    const [carList, setCarList] = useState([]);
    const [selectIndex, setSelectIndex] = useState(null);

    const [card, setCard] = useState(null);

    const [mileage, setMileage] = useState(0);

    const [step, setStep] = useState(0);

    const [call, setCall] = useState(null); // 진행중 콜 정보

    const [initLoad, setInitLoad] = useState(true);
    const [addLoad, setAddLoad] = useState(false); // 카드등록 로딩
    const [submitLoad, setSubmitLoad] = useState(false); // 콜 호출 로딩


    const mapStyle = useAnimatedStyle(() => ({
        height: sheetPosition.value + 10,
    }));
    const toggleStyle = useAnimatedStyle(() => ({
        top: sheetPosition.value - 40 - rootStyle.side,
    }));
    // useBackHandler(() => {
    //     closeFunc();
    //     return true;
    // });

    useFocusEffect(
        useCallback(() => {
            if (appActiveStatus === 'active') {
                socketConnect();
            } else {
                socketRef.current?.disconnect();
            }

            return () => {
                socketRef.current?.disconnect();
            };
        }, [appActiveStatus])
    );


    useEffect(() => {
        setMileage(0);
    }, [selectIndex])

    useEffect(() => {
        console.log('sheetPosition', sheetPosition);
    }, [sheetPosition])

    useEffect(() => {

    }, [step])

    const socketConnect = () => {

        const socket = io(consts.rideSocketUrl, {
            auth: {
                token: token
            }
        });

        socketRef.current = socket;

        socket.on('message', async (data) => {
            console.log("socket msg call", data)

            console.log('message 왔음 !', data);
            if (data?.type === "call_fail") {
                openAlertFunc({
                    label: lang({ id: 'error_code_2001' }),
                    onPressText: lang({ id: 'close' }),
                    onPress: () => dataFunc(false),
                })
            } else if (data?.type === "dispatch_cancel") {
                // 기사가 취소했을때
                closeAlertFunc();
                dataFunc(false);
                setTimeout(() => {
                    openAlertFunc({
                        label: lang({ id: 'the_driver_canceled_the_service' }),
                        onPressText: lang({ id: 'close' }),
                    })
                }, 300)
            } else if (data?.type === "call_done") {
                // 운행완료
                closeAlertFunc();
                router.replace({
                    pathname: routes.reviewsForm,
                    params: {
                        idx: data?.data?.driverIdx,
                        targetDispatch: data?.data?.idx
                    }
                });
            } else {
                dataFunc();
            }
        });
        // return () => {
        //     socket.off('call');
        // }

        socket.on('connect', () => {
            console.log('🟢 Socket connected: 111111', socket.id);
            dataFunc();
        });

    }

    const dataFunc = async (toast = true) => {

        const { data, error } = await API.post('/v2/passenger/call/requestInfo');
        console.log('{ data, error }', data, error);
        if (error) {
            if (toast) ToastMessage(lang({ id: error?.message }), { type: 'error' });
            goMain();
            return;
        }
        console.log('data', JSON.stringify(data, null, 2));
        setCall(data);
        // socketConnect();
    }

    const goMain = () => {
        router.canDismiss() && router.dismissAll();
        router.replace(routes.tabs);
    }

    const cancelCall = async () => {
        
        const sender = {
            dispatchIdx: call?.idx
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v2/passenger/call/cancelDispatch', sender);
        console.log('error', error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        ToastMessage(lang({ id: 'the_rideshare_has_been_cancelled' }));
        goMain();
    }

    const rejectCall = async () => {
        
        const sender = {
            dispatchIdx: call?.idx
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v2/passenger/call/cancelDispatch', sender);
        console.log('error', error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        ToastMessage(lang({ id: 'the_rideshare_has_been_cancelled' }));
        goMain();
    }

    const callTo = async () => {
        let url = `tel:+1${call?.driverInfo?.hp}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }

    };

    const shareFunc = async () => {
        let url = `${call?.shareUri}`;
        try {
            await Share.share({ message: url });
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }

    };

    const reportPop = () => {
        openAlertFunc({
            component: <ReportCall dispatchIdx={call?.idx} />,
            input: 250
        })
    }

    const emergencyFunc = () => {
        router.push({
            pathname: routes.emergency,
            params: {
                call: true
            }
        })
    }

    const closeFunc = () => {
        openAlertFunc({
            label: lang({ id: 'would_you_like_to_cancel_call' }),
            onCencleText: lang({ id: 'cancel' }),
            onPressText: lang({ id: 'yes' }),
            onCencle: () => { },
            onPress: rejectCall
        })
    }



    return (
        <Layout>

            {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <View style={styles.root}>
                <Animated.View style={[styles.mapBox, mapStyle]} >
                    {call?.mapUri && <Map uri={call?.mapUri} onLoadEnd={() => setInitLoad(false)} />}

                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={goMain}
                    >
                        <Image source={images.menu_2_on} style={rootStyle.size_24} />
                    </TouchableOpacity>
                </Animated.View>

                {call?.type === 'dispatch' && (
                    <Animated.View key={sheetPosition?.value || 0} style={[styles.toggle, toggleStyle]}>
                        <Select
                            setState={(v) => {
                                if (v === 1) callTo();
                                else if (v === 2) closeFunc();
                                else if (v === 3) reportPop();
                                else if (v === 4) shareFunc();
                                else if (v === 5) emergencyFunc();
                            }}
                            list={
                                call?.status < 5 ?
                                    [
                                        { idx: 1, title: lang({ id: 'call_a_driver' }) },
                                        { idx: 2, title: lang({ id: 'cancellation_call' }), role: 'destructive' }
                                    ]
                                    :
                                    [
                                        { idx: 4, title: lang({ id: 'share' }) },
                                        { idx: 3, title: lang({ id: 'report' }) },
                                        { idx: 5, title: lang({ id: 'emergency_call' }), role: 'destructive' },
                                    ]
                            }
                        >
                            <View style={rootStyle.default48}>
                                <Image source={images.map_menu} style={{ width: '100%', height: '100%' }} transition={100} />
                            </View>
                        </Select>
                    </Animated.View>
                )}

            </View>

            <BottomSheetTemplate sheetRef={sheetRef} animatedPosition={sheetPosition} >

                {call?.type !== 'dispatch' ? (
                    <View style={[styles.sheet, { alignItems: 'center' }]}>
                        <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'nearby_driver_will' })}</Text>
                        {/* <RoutesViewSimple start={call?.startName} end={call?.endName} way={call?.wayPoint} /> */}
                        <LoadingRipple />
                        <Button type={10} onPress={closeFunc}>{lang({ id: 'cancellation_call' })}</Button>
                    </View>
                ) : (
                    <View style={[styles.sheet, {}]}>
                        {call?.status < 5 && (
                            <View>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'call_complete' })}</Text>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{call?.driverInfo?.firstName} {call?.driverInfo?.lastName} {lang({ id: 'is_on_the_move_to' })} {mbData?.firstName} {mbData?.lastName}</Text>
                            </View>
                        )}

                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                            <Image source={consts.s3Url + call?.driverInfo?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                            <View style={[{ flex: 1, gap: 2 }]}>
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                    <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{call?.driverInfo?.firstName} {call?.driverInfo?.lastName}</Text>
                                    <Tag msg={lang({ id: 'driver'})} />
                                </View>
                                <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium), marginTop: 5 }}>{call?.driverInfo?.carType} · {call?.driverInfo?.carNumber}</Text>
                            </View>
                        </View>


                        <RoutesViewSimple start={call?.startName} end={call?.endName} way={call?.wayPoint} />

                        <Button onPress={() => {
                            router.push({
                                pathname: routes.terms,
                                params: {
                                    idx: 7,
                                    title: lang({ id: 'precautions' })
                                }
                            })
                        }}>
                            {lang({ id: 'check_precautions' })}
                        </Button>

                    </View>
                )}


            </BottomSheetTemplate>
        </Layout >
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            // paddingTop: insets?.top,
        },
        mapBox: {
            // width: "100%",
            // height: "100%"
            // flex: 1
        },
        backBtn: {
            position: "absolute",
            top: insets?.top + 20,
            left: rootStyle.side,
            width: 40,
            height: 40,
            borderRadius: 1000,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.black,

            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        },

        sheet: {
            gap: 20,
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20
        },
        toggle: {
            position: 'absolute',
            right: rootStyle.side,
            zIndex: 1
        },
    })

    return { styles }
}