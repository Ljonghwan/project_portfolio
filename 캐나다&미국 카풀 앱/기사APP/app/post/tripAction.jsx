import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking, Platform, Pressable, Share, ScrollView } from 'react-native';
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

import { ToastMessage, hpHypen, numDoler, useBackHandler, checkBackgroundGpsPermission, startBackgroundGps, getDistanceFromLatLonInKm } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, useEtc, useGps } from '@/libs/store';

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
            checkGps();
        }, [appActiveStatus, idx])
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

        setItem(data);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay)

    }

    const checkGps = async () => {
        let status = await checkBackgroundGpsPermission();
        if (!status) return false;
        await startBackgroundGps();
        return true;
    }



    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'passenger_check' }),

    };


    return (
        <Layout header={header}>

            {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <ScrollView
                style={styles.root}
                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 20
                }}
            >
                <View >
                    <View style={{ gap: 20 }}>
                        
                    </View>
                </View>

                
            </ScrollView>
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