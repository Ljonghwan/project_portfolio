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

import { ToastMessage, hpHypen, numDoler, useInterval } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, useEtc } from '@/libs/store';

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
            dataFunc();
        }, [appActiveStatus, idx])
    );

    

    const dataFunc = async () => {

        let sender = {
            postIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/passenger/post/detail', sender);

        if (error || !data?.isJoin) {
            ToastMessage(lang({ id: error?.message || 'error_code_9000' }), { type: 'error' });
            router.back();
            return;
        }

        let myInfo = data?.joins?.find(x => x?.userIdx === mbData?.idx);
        console.log('data', data);

         if(data?.status === 4 || myInfo?.driveStatus === 2) {
            ToastMessage(lang({ id: 'carpool_end_message_1' }));
            router.back();
            return;
        }

        setItem(data);

    }


    const callTo = async () => {
        let url = `tel:+1${item?.creator?.hp}`;
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
        let url = `${item?.shareUri}`;
        try {
            await Share.share({ message: url });
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }

    };

    const reportPop = () => {
        openAlertFunc({
            component: <ReportCall postIdx={call?.idx} />,
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

    const goMain = () => {
        router.canGoBack() ? router.back() : router.replace(routes.tabs);
    }


    useInterval(dataFunc, 5000);

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
                    <Select
                        setState={(v) => {
                            if (v === 1) callTo();
                            else if (v === 2) shareFunc();
                            else if (v === 3) reportPop();
                            else if (v === 4) emergencyFunc();
                        }}
                        list={[
                            { idx: 1, title: lang({ id: 'call_a_driver' }) },
                            { idx: 2, title: lang({ id: 'share' }) },
                            { idx: 3, title: lang({ id: 'report' }) },
                            { idx: 4, title: lang({ id: 'emergency_call' }), role: 'destructive' },
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
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'trip_has_started' })}</Text>
                            <Pressable style={rootStyle.default} onPress={() => router.push({
                                pathname: routes.postRoute,
                                params: {
                                    idx: item?.idx
                                }
                            })}>
                                <Image source={images.waypoints} style={{ width: '100%', height: '100%' }} transition={100} />
                            </Pressable>
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