import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, StyleSheet, Share, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useFonts } from 'expo-font';
import { useToast, Toast } from "react-native-toast-notifications";
import * as Location from 'expo-location';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Map from '@/components/Map';
import Carousel from '@/components/Carousel';
import Lock from '@/components/Lock';

import SwitchType from '@/components/Popup/SwitchType';

import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import API from '@/libs/api';

import { useUser, useAlert, useLang, useLoader, useCall, useEtc } from '@/libs/store';

import { ToastMessage, getPositionAndPlace, checkBackgroundGpsPermission, startBackgroundGps, getDday } from '@/libs/utils';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';


export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { token, mbData, pushToken, login, logout } = useUser();
    const { country } = useLang();
    const { callStart } = useCall();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();

    const [carpoolList, setCarpoolList] = useState([]);

    const [row, setRow] = useState(null);
    const [banners, setBanners] = useState([]);

    const [startLoad, setStartLoad] = useState(false);

    useEffect(() => {
        dataFunc();
    }, [])

    useFocusEffect(
        useCallback(() => {
            if (appActiveStatus === 'active') {
                getTodayRide();
                getBanner();
            } 
        }, [appActiveStatus])
    );

    const dataFunc = async () => {
        const sender = {
            type: 'driver'
        }
        const { data, error } = await API.post('/v2/my/appinfo', sender);

        console.log('data', data);
        setRow(data?.[Platform.OS === 'ios' ? 'apple' : 'android']);
    }

    const getTodayRide = async () => {
        const { data, error } = await API.post('/v2/passenger/history/onRide');
        
        console.log('data?.carpoolList', data?.carpoolList?.map(x => getDday(x?.driveAt)))
        console.log('data?.callList', data?.callList?.map(x => x?.idx))

        setCarpoolList(data?.carpoolList?.filter(x => getDday(x?.driveAt) < 1) || []);
    }

    const getBanner = async () => {
        const { data, error } = await API.post('/v2/my/bannerList');
        console.log('data', data);
        setBanners(data || []);
    }

    const swichFunc = async () => {

        try {
            const actualUrl = row?.scheme;
            await Linking.openURL(actualUrl); // 실제 앱 호출
        } catch (err) {
            console.log('err', err, row?.url);
            // 스토어로 이동
            Linking.openURL(row?.url );
        }
        return;

        openAlertFunc({
            component: <SwitchType />
        })

    }

    const startCall = async (type = null) => {

        if (type === 1) {
            if (mbData?.callStatus !== 0) {
                router.canDismiss() && router.dismissAll();
                router.replace(routes.call);
            } else {

                if (startLoad) return;

                setStartLoad(true);

                const data = await getPositionAndPlace();

                setStartLoad(false);

                /** 테스트용 */
                // let testPlace = {
                //     lat : 49.252432664301885,
                //     lng : -123.12100382051938,
                //     address : "797 W 22nd Ave, Vancouver, BC V5Z 1Z8, Canada",
                //     name : "797 W 22nd Ave"
                // }
                // let testPlace2 = {
                //     lat : 49.24010583279529,
                //     lng : -123.0839249630975,
                //     address : "1028 E 33rd Ave, Vancouver, BC V5V 3A8, Canada",
                //     name : "1028 E 33rd Ave"
                // }
                // let testPlaceWay = [
                //     {lat: 49.22872413297936, lng: -123.12066049776547, address: "6176 Tisdall St, Vancouver, BC V5Z 2P8, Canada", name: "6176 Tisdall St"},
                //     {lat: 49.22444554145273, lng: -123.10044321617585, address: "250 E 50th Ave, Vancouver, BC V5X 1A5, Canada", name:"250 E 50th Ave"}
                // ]
                // callStart({
                //     callType: type,
                //     start: testPlace,
                //     end: testPlace2,
                //     way: testPlaceWay
                // });
                // router.push({
                //     pathname: routes.callSelectCall,
                //     params: {
                //     }
                // })
                // return;
                /** 테스트용 끝 */

                callStart({
                    callType: type,
                    start: data
                });

                router.push({
                    pathname: routes.callMain,
                    params: {
                        initStart: JSON.stringify(data)
                    }
                })
            }

        } else {
            router.navigate(routes.find);
        }

    }

    const testFunc = async () => {


        try {
            const origin = "37.5551,126.9707(서울역)";
            const destination = "37.4979,127.0276(강남역)";
            const waypoints = [
                "37.5665,126.9780(서울시청)",
                "37.5700,126.9830(종각역)"
            ].join("|");

            const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`;

            await Linking.openURL(url); // 실제 앱 호출
        } catch (err) {
            console.log('err', err);
        }
        return;

        router.push({
            pathname: routes.reviewsForm,
            params: {
                idx: 13,
                targetDispatch: 25,
            }
        });
        return;

        const task = await Location.hasStartedLocationUpdatesAsync("location");
        if (task) {
            await Location.stopLocationUpdatesAsync('location');
        } else {
            let status = await checkBackgroundGpsPermission();
            if (status) await startBackgroundGps();
        }

        return;

        let url = `${consts.apiUrl}`;
        try {
            await Share.share({ message: url });
        } catch (error) {
            console.log('error', error);
            ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
        }

    };


    const header = {
        left: {
            icon: 'logoHome'
        },
        right: {
            bell: true
        },
    };

    return (
        <Layout
            header={{
                ...header,
                rightSub: {
                    icon: 'switch_app',
                    onPress: () => {
                        swichFunc();
                        // router.navigate(routes.joinDriverStart)
                    }
                }
            }}
            statusBar='dark'
        >

            <View style={styles.root}>
                <View style={{ flex: 1, paddingHorizontal: rootStyle.side }}>

                    {/* {mbData?.passenger && <View style={{ gap: 20 }}>
                            <Text style={styles.itemText}>Select Level</Text>
                        </View>} */}
                    {/* <Button onPress={testFunc}>asd</Button> */}

                    {!mbData?.passenger ? (
                        <Lock />
                    ) : (
                        <>
                            <View style={{ gap: 20 }}>
                                <View style={{ gap: 13 }}>

                                    {mbData?.callStatus !== 0 && (
                                        <Button type={3} containerStyle={{ justifyContent: 'space-between' }} textStyle={{ textAlign: 'left' }} icon={'link_white'} onPress={() => {
                                            startCall(1);
                                        }}>
                                            {lang({ id: 'there_a_rideshare_going_on' })}
                                        </Button>
                                    )}

                                    {carpoolList?.length > 0 && (
                                        <Button type={3} containerStyle={{ justifyContent: 'space-between' }} textStyle={{ textAlign: 'left' }} icon={'link_white'} onPress={() => {
                                            router.push(routes.activity)
                                        }}>
                                            {lang({ id: 'there_a_carpool_going_on' })}
                                        </Button>
                                    )}

                                    <Button type={4} icon={'search'} onPress={() => startCall(1)}>{lang({ id: 'tell_your_destinatio' })}</Button>
                                </View>

                                <View style={[rootStyle.flex, { gap: 14 }]}>
                                    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => startCall(1)}>
                                        <Text style={styles.itemText}>{lang({ id: 'ride_share' })}</Text>
                                        <Image source={images.car_taxi} style={styles.itemImage} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => startCall(2)}>
                                        <Text style={styles.itemText}>{lang({ id: 'carpool' })}</Text>
                                        <Image source={images.car_carpool} style={styles.itemImage} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ flex: 1 }}></View>
                        </>
                    )}

                </View>

                {banners?.length > 0 && <Carousel style={{ marginBottom: 29 }} pages={banners} />}
            </View>

            {/* 드라이버 화면 */}
            {/* <View style={styles.root}>
                <View style={{ flex: 1, paddingHorizontal: rootStyle.side }}>
                    {(!mbData?.carpool && !mbData?.rideShare) ? (
                        <Lock />
                    ) : (
                        <>
                            <View style={{ gap: 20 }}>
                                <View style={{ gap: 13 }}>
                                    <Button type={3} textStyle={{ textAlign: 'left' }}>{lang({ id: 'your_driver_status' })}</Button>
                                </View>

                                <View style={[rootStyle.flex, { gap: 14 }]}>
                                    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
                                        <Text style={styles.itemText}>{lang({ id: 'accept_ride' })}</Text>
                                        <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 10 }]}>
                                            <Image source={images.human} style={styles.itemImageHuman} />
                                            <Image source={images.car} style={styles.itemImage} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ flex: 1 }}></View>
                        </>
                    )}

                    <Carousel style={{ marginBottom: 29 }} pages={['Page 1', 'Page 2', 'Page 3']} />
                </View>
            </View> */}

        </Layout >
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            justifyContent: 'space-between',
            paddingBottom: rootStyle.bottomTabs.height + insets.bottom,
            gap: 20
        },
        item: {
            flex: 1,
            padding: 18,
            paddingRight: 12,
            justifyContent: 'space-between',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.taseta,
            backgroundColor: colors.taseta_sub_2,
            gap: 20
        },
        itemText: {
            fontSize: 18,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.36,
            color: colors.taseta
        },
        itemImage: {
            ...rootStyle.car,
            alignSelf: 'flex-end'
        },
        itemImageHuman: {
            width: 18,
            aspectRatio: 18 / 50
        }
    })

    return { styles }
}
