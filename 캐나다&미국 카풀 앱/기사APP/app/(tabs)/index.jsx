import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, StyleSheet, Linking } from 'react-native';
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

import { useUser, useAlert, useLang, useLoader, useCall, useGps, useEtc } from '@/libs/store';

import { ToastMessage, getDday } from '@/libs/utils';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';


export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToast();

    const { token, mbData, pushToken, login, logout } = useUser();
    const { country } = useLang();
    const { callStart } = useCall();
    const { gpsStatus } = useGps();
    const { appActiveStatus } = useEtc();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

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
            type: 'passenger'
        }
        const { data, error } = await API.post('/v2/my/appinfo', sender);

        console.log('data', data);
        setRow(data?.[Platform.OS === 'ios' ? 'apple' : 'android']);
    }

    const getTodayRide = async () => {
        const { data, error } = await API.post('/v2/driver/history/onRide');
        setCarpoolList(data?.carpoolList || []);
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
            Linking.openURL(row?.url);
        }
        return;

        openAlertFunc({
            component: <SwitchType />
        })

    }
    

    const startCall = async (type = null) => {
        if (type === 1) {
            if (mbData?.callStatus === 4 || mbData?.callStatus === 5) {
                router.canDismiss() && router.dismissAll();
                router.replace(routes.call);
            } else {
               
                router.canDismiss() && router.dismissAll();
                router.replace(routes.callPending);
            }
            // router.navigate(mbData?.rideShare ? routes.callPending : routes.my);
        } else {
            router.navigate(routes.find)
        }
    }

    const testFunc = () => {
        router.push({
            pathname: routes.reviewsForm,
            params: {
                idx: 9,
                targetDispatch: 25,
            }
        });
    }

    // 드라이버 상태 0=대기중, 1=유저콜중, 2=유저콜진행중, 3=기사콜받는중, 4=기사배차완료, 5=기사운행중, 9=기사자격정지	
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
        >

            <View style={styles.root}>
                <View style={{ flex: 1, paddingHorizontal: rootStyle.side }}>
                    {/* {mbData?.passenger && <View style={{ gap: 20 }}>
                            <Text style={styles.itemText}>Select Level</Text>
                        </View>} */}
                        
                    {/* <Button onPress={testFunc}>TEST BUTTON</Button> */}

                    {(!mbData?.carpool && !mbData?.rideShare) ? (
                        <Lock />
                    ) : (
                        <>
                            <View style={{ gap: 20 }}>

                                <View style={{ gap: 13 }}>
                                    {(mbData?.callStatus === 4 || mbData?.callStatus === 5) && (
                                        <Button type={3} containerStyle={{ justifyContent: 'space-between' }} textStyle={{ textAlign: 'left' }} icon={'link_white'}  onPress={() => startCall(1)}>{lang({ id: 'there_a_rideshare_going_on' })}</Button>
                                    )}

                                    {carpoolList?.length > 0 && (
                                        <Button type={3} containerStyle={{ justifyContent: 'space-between' }} textStyle={{ textAlign: 'left' }} icon={'link_white'} onPress={() => {
                                            router.push(routes.activity)
                                        }}>
                                            {lang({ id: 'there_a_carpool_going_on' })}
                                        </Button>
                                    )}
                                </View>
                               

                                <View style={[rootStyle.flex, { gap: 14 }]}>
                                    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => {
                                        if(!mbData?.rideShare) {
                                            ToastMessage(lang({ id: 'available_after_rideshare_driver_verification' }), { type: 'error' });
                                            return;
                                        }
                                        startCall(1)
                                    }}>
                                        {!mbData?.rideShare && (
                                            <View style={styles.lock}>
                                                <Image source={images.lock} style={rootStyle.default64} />
                                            </View>
                                        )}
                                        <View style={styles.itemContainer}>
                                            <Text style={styles.itemText}>{lang({ id: 'accept_ride' })}</Text>
                                            <View style={[rootStyle.flex, { justifyContent: 'flex-end', gap: 10 }]}>
                                                <Image source={images.human} style={styles.itemImageHuman} />
                                                <Image source={images.car} style={styles.itemImage} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => startCall(2)}>
                                        <View style={styles.itemContainer}>
                                            <Text style={styles.itemText}>{lang({ id: 'carpool' })}</Text>
                                            <Image source={images.car_carpool} style={styles.itemImage} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ flex: 1 }}></View>
                        </>
                    )}

                    {/* 하단 베너 */}
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
            alignSelf: 'stretch',
            height: 130,
            overflow: 'hidden'
        },
        itemContainer: {
            height: '100%',
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
        },
        lock: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.dimWhite,
            borderRadius: 12,
            zIndex: 1
        }

    })

    return { styles }
}
