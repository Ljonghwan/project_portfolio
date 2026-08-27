import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking, Platform, Pressable } from 'react-native';
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
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import LoadingRipple from '@/components/LoadingRipple';
import Select from '@/components/Select';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import RoutesViewSimple from '@/components/Call/RoutesViewSimple';

import ApplyMileage from '@/components/Popup/ApplyMileage';
import FareDetail from '@/components/Popup/FareDetail';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen, checkBackgroundGpsPermission, startBackgroundGps, getDistanceFromLatLonInKm, numFormat } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, useConfig, useGps, useEtc } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { callType, start, end, way } = useCall();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();
    const { configOptions } = useConfig();
    const { lat, lng } = useGps();

    const socketRef = useRef(null);
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [call, setCall] = useState(null); // 진행중 콜 정보

    const [info, setInfo] = useState(null);
    const [carList, setCarList] = useState([]);
    const [selectIndex, setSelectIndex] = useState(null);

    const [card, setCard] = useState(null);

    const [mileage, setMileage] = useState(0);

    const [step, setStep] = useState(0);

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

    const dataFunc = async (toast = true) => {

        const { data, error } = await API.post('/v2/driver/call/dispatchInfo');

        console.log('data', JSON.stringify(data, null, 2));

        if (error) {
            if (toast) ToastMessage(lang({ id: error?.message }), { type: 'error' });
            goMain();
            return;
        }

        setCall(data);
    }


    const socketConnect = () => {

        const socket = io(consts.rideSocketUrl, {
            auth: {
                token: token
            }
        });

        socketRef.current = socket;

        socket.on('message', (data) => {
            console.log('message 왔음 !', data);
            if (data?.type === 'dispatch_cancel') {
                // 승객이 취소했을때
                openAlertFunc({
                    label: lang({ id: 'the_passenger_canceled_the_service' }),
                    onPressText: lang({ id: 'close' }),
                    onPress: () => dataFunc(false),
                })
            } else {
                dataFunc();
            }
        });


        socket.on('connect', () => {
            console.log('🟢 Socket connected:', socket.id);
            dataFunc();
        });

    }

    const goMain = () => {
        router.canDismiss() && router.dismissAll();
        router.replace(routes.tabs);
    }

    const rejectCall = async () => {

        const sender = {
            dispatchIdx: call?.idx
        }
        const { data, error } = await API.post('/v2/driver/call/cancelDispatch', sender);
        console.log('error', error);
        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        goMain();
    }

    const corfirmBoarding = async () => {
        const sender = {
            dispatchIdx: call?.idx
        }
        const { data, error } = await API.post('/v2/driver/call/boarding', sender);

        console.log('corfirmBoarding', data, error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        dataFunc();
    }

    const checkGps = async () => {
        let status = await checkBackgroundGpsPermission();
        if (!status) return false;
        await startBackgroundGps();
        return true;
    }


    const corfirmEnd = async () => {

        let status = await checkGps();
        if (!status) return;

        let tripDistance = configOptions?.tripDistance || 500;
        let distance = getDistanceFromLatLonInKm(lat, lng, call?.endLat, call?.endLng);

        // if (configOptions?.tripDistanceTestIdxs?.includes(mbData?.idx)) {
        //     // 테스트계정 500M 이내 접근 부여
        //     distance = 500;
        // }

        if (distance > tripDistance) {

            let label = lang({ id: 'carpool_step_message_3' });
            label = label?.replace("{number}", tripDistance + "m");

            openAlertFunc({
                label: label,
                title: lang({ id: 'carpool_step_message_km' })?.replace("{number}", numFormat(Math.round(distance)) + "m"),
                onPressText: lang({ id: 'yes' })
            })
            return;
        }

        
        const sender = {
            dispatchIdx: call?.idx
        }
        const { data, error } = await API.post('/v2/driver/call/completed', sender);

        console.log('corfirmEnd', data, error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        router.canDismiss() && router.dismissAll();
        router.replace({
            pathname: routes.reviewsForm,
            params: {
                idx: call?.userInfo?.idx,
                targetDispatch: call?.idx,
            }
        });

    }

    const callTo = async () => {
        let url = `tel:+1${call?.userInfo?.hp}`;
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

    const naviTo = async () => {
        try {
            const destination = call?.status === 5 ? `${call?.endLat},${call?.endLng}` : `${call?.startLat},${call?.startLng}`;
            const waypoints = call?.status === 5 ? call?.wayPoint?.map(x => `${x?.lat},${x?.lng}`)?.join("|") : "";

            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
            await Linking.openURL(url); // 실제 앱 호출
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }
        return;
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


                <Animated.View key={sheetPosition?.value || 0} style={[styles.toggle, toggleStyle]}>

                    <Pressable style={rootStyle.default48} onPress={naviTo}>
                        <Image source={images.navigation} style={{ width: '100%', height: '100%' }} transition={100} />
                    </Pressable>

                    <Select
                        setState={(v) => {
                            if (v === 1) callTo();
                            else if (v === 2) closeFunc();
                        }}
                        list={[
                            { idx: 1, title: lang({ id: 'call_a_passenger' }) },
                            { idx: 2, title: lang({ id: 'cancellation_call' }), role: 'destructive' },
                        ]}
                    >
                        <View style={rootStyle.default48}>
                            <Image source={images.map_menu} style={{ width: '100%', height: '100%' }} transition={100} />
                        </View>
                    </Select>

                </Animated.View>
            </View>

            <BottomSheetTemplate sheetRef={sheetRef} animatedPosition={sheetPosition} >

                {call?.status === 1 || call?.status === 3 ? (
                    <View style={[styles.sheet, {}]}>
                        <View>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ride_confirmed' })}</Text>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ready_to_meet' })} {call?.userInfo?.firstName} {call?.userInfo?.lastName}</Text>
                            {/* <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium), marginTop: 5 }}>Toyota Corolla Cross · CUD945</Text> */}
                        </View>

                        <RoutesViewSimple start={call?.startName} end={call?.endName} way={call?.wayPoint} />
                        <Button style={{ flex: 1 }} onPress={corfirmBoarding}>{lang({ id: 'confirm_boarding' })}</Button>
                    </View>
                ) : call?.status === 5 ? (
                    <View style={[styles.sheet, {}]}>
                        <View>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'boarding_confirmed' })}</Text>
                            {/* <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ready_to_meet' })} {call?.userInfo?.firstName} {call?.userInfo?.lastName}</Text> */}
                            {/* <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium), marginTop: 5 }}>Toyota Corolla Cross · CUD945</Text> */}
                        </View>

                        <RoutesViewSimple start={call?.startName} end={call?.endName} way={call?.wayPoint} />

                        <Text style={{ ...rootStyle.font(14, colors.text_popup, fonts.medium) }}>{lang({ id: 'did_any_passengers_leave' })}</Text>
                        <Button style={{ flex: 1 }} onPress={corfirmEnd}>{lang({ id: 'operation_completed' })}</Button>
                    </View>

                ) : (
                    <></>
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
            zIndex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
        },
    })

    return { styles }
}