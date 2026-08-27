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

import FareDetail from '@/components/Popup/FareDetail';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen, numDoler, useBackHandler, checkBackgroundGpsPermission, startBackgroundGps, getDistanceFromLatLonInKm, numFormat } from '@/libs/utils';

import { useUser, useConfig, useAlert, useLoader, useEtc, useGps } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { idx } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();
    const { lat, lng } = useGps();
    const { configOptions } = useConfig();

    const socketRef = useRef(null);
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [info, setInfo] = useState(null);
    const [carList, setCarList] = useState([]);
    const [selectIndex, setSelectIndex] = useState(null);

    const [item, setItem] = useState(null);

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
            if(appActiveStatus === 'active') {
                dataFunc();
            }
        }, [appActiveStatus, idx])
    );

    useFocusEffect(
        useCallback(() => {
            checkGps()
        }, [])
    );

    const dataFunc = async () => {

        let sender = {
            postIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/post/detail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        if (data?.status === 4) {
            ToastMessage(lang({ id: 'carpool_end_message_1' }));
            router.back();
            return;
        }

        setItem(data);
        await startBackgroundGps();
    }

    const checkGps = async () => {
        let status = await checkBackgroundGpsPermission();
        if (!status) return false;
        await startBackgroundGps();
        return true;
    }

    const stopPointFunc = async () => {
        let status = await checkGps();
        if (!status) return;

        let tripDistance = configOptions?.tripDistance || 500;

        let stop = item?.itinerary?.[item?.currentIndex || 0];
        let distance = getDistanceFromLatLonInKm(lat, lng, stop?.lat, stop?.lng);

        // if (configOptions?.tripDistanceTestIdxs?.includes(mbData?.idx)) {
        //     // 테스트계정 500M 이내 접근 부여
        //     distance = 500;
        // }


        if (distance > tripDistance) {

            let label = lang({ id: item?.currentIndex === 0 ? 'carpool_step_message_1' : item?.currentIndex === item?.itinerary?.length - 1 ? 'carpool_step_message_3' : 'carpool_step_message_2' });
            label = label?.replace("{number}", tripDistance + "m");

            openAlertFunc({
                label: label,
                title: lang({ id: 'carpool_step_message_km' })?.replace("{number}", numFormat(Math.round(distance)) + " m"),
                onPressText: lang({ id: 'ok' })
            })
            return;
        }

        openLoader();

        // API 연결필요
        let sender = {
            postIdx: idx
        }

        const { data, error } = await API.post('/v2/driver/post/updateDrive', sender);

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
            }

            dataFunc(true);

        }, consts.apiDelay)


    }

    const callTo = async () => {
        let url = `tel:+1${item?.driverInfo?.hp}`;
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
            let point = item?.itinerary?.[item?.currentIndex || 0];

            const origin = `${point?.lat},${point?.lng}`;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${origin}&travelmode=driving`;

            await Linking.openURL(url); // 실제 앱 호출
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }
        return;
    }

    const goMain = () => {
        router.canGoBack() ? router.back() : router.replace(routes.tabs);
    }



    return (
        <Layout>

            {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <View style={styles.root}>
                <Animated.View style={[styles.mapBox, mapStyle]} >
                    {item?.mapUri && <Map uri={item?.mapUri} onLoadEnd={() => setInitLoad(false)} />}

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

                    <Pressable style={rootStyle.default48} onPress={() => router.push({
                        pathname: routes.postRoute,
                        params: {
                            idx: item?.idx
                        }
                    })}>
                        <Image source={images.waypoints} style={{ width: '100%', height: '100%' }} transition={100} />
                    </Pressable>

                    <Select
                        setState={(v) => {
                            if (v === 1) router.push({
                                pathname: routes.postView,
                                params: {
                                    idx: item?.idx
                                }
                            });
                        }}
                        list={[
                            { idx: 1, title: lang({ id: 'view_post' }) },
                        ]}
                    >
                        <View style={rootStyle.default48}>
                            <Image source={images.map_menu} style={{ width: '100%', height: '100%' }} transition={100} />
                        </View>
                    </Select>
                </Animated.View>
            </View>

            <BottomSheetTemplate sheetRef={sheetRef} animatedPosition={sheetPosition} >

                <View style={[styles.sheet, {}]}>
                    <View>
                        {/* <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{item?.idx} {lat} {lng}</Text> */}

                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'trip_has_started' })}</Text>

                        </View>
                        <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'heading_to' })} {item?.itinerary?.[item?.currentIndex || 0]?.name}</Text>
                    </View>

                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={consts.s3Url + item?.creator?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                        <View style={[{ flex: 1, gap: 2 }]}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.creator?.firstName} {item?.creator?.lastName}</Text>
                                <Tag msg={lang({ id: 'driver' })} />
                            </View>
                            <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium), marginTop: 5 }}>{item?.creator?.driverInfo?.carType} · {item?.creator?.driverInfo?.carNumber}</Text>
                        </View>
                    </View>

                    <RoutesViewSimple start={item?.itinerary?.[(item?.currentIndex - 1)]?.name || ''} end={item?.itinerary?.[item?.currentIndex || 0]?.name} />

                    <Button
                        onPress={stopPointFunc}>
                        {lang({ id: item?.currentIndex === 0 ? 'start_boarding' : item?.currentIndex === item?.itinerary?.length - 1 ? 'confirm_arrival' : 'next_stop' })}
                    </Button>

                    {/* <Button onPress={() => {
                        router.push({
                            pathname: routes.terms,
                            params: {
                                idx: 7,
                                title: lang({ id: 'precautions' })
                            }
                        })
                    }}>
                        {lang({ id: 'check_precautions' })}
                    </Button> */}

                </View>

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