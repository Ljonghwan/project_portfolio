import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useStripe } from '@stripe/stripe-react-native';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import RoutesView from '@/components/Call/RoutesView';

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

import { ToastMessage, hpHypen, numDoler } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {


    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { callType, start, end, way } = useCall();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

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

    const toggleStyle = useAnimatedStyle(() => ({
        top: sheetPosition.value - 50 - rootStyle.side,
    }));

    useEffect(() => {
        dataFunc();
        getMyCard();

    }, [])

    useEffect(() => {
        setMileage(0);
    }, [selectIndex])

    useEffect(() => {
        console.log('sheetPosition', sheetPosition);
    }, [sheetPosition])

    useEffect(() => {

    }, [step])

    const dataFunc = async () => {

        const sender = {
            type: callType,
            startLat: start?.lat,
            startLng: start?.lng,
            endLat: end?.lat,
            endLng: end?.lng,
            wayPoint: way,
            // country: 'US',
            // stateCode: 'CA'
        }

        console.log('sender', JSON.stringify(sender, null, 2));

        const { data, error } = await API.post('/v2/passenger/call/estimated', sender);

        console.log( data, error )

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setInfo(data);
        setCarList(data?.list || []);

    }

    const getMyCard = async () => {

        const { data, error } = await API.post('/v2/passenger/call/cardList');
        console.log('card data', data);
        setCard(data);
        // setCard(null);

    }

    const toggleMap = () => {
        setStep(step === 99 ? 0 : 99);
        sheetRef.current.expand();
    }

    const applyMileage = () => {
        let pay = carList?.find(x => x?.type === selectIndex)?.pay;
        if (!pay) {
            ToastMessage(lang({ id: 'please_select_a_vehicle' }), { type: 'error' })
            return;
        }

        openAlertFunc({
            component: <ApplyMileage value={mileage} pay={pay} onSubmit={applyMileageFunc} />,
            input: 200
        })
    }

    const applyMileageFunc = (v) => {
        setMileage(v);
    }

    const addCardPop = async () => {
        if (addLoad) return;

        setAddLoad(true);
        openLoader();

        try {
            // // 1) 서버에서 clientSecret + customerId + ephemeralKey 받기
            const { data, error } = await API.post('/v2/billing/setupIntent', {});

            if (error) {
                throw "server error";
            }

            // 2) 저장 모드 초기화 (결제용 clientSecret가 아니라 "setupIntentClientSecret")
            const { error: error2 } = await initPaymentSheet({
                merchantDisplayName: 'Taseta',
                customerId: data?.customerId,
                customerEphemeralKeySecret: data?.ephemeralKey,
                setupIntentClientSecret: data?.clientSecret, // ← 저장 모드 포인트
            });

            if (error2) {
                throw "initPaymentSheet error";
            }

            // 3) 표시 → 카드 저장 및 3DS 인증까지 자동 처리
            const { error: e2 } = await presentPaymentSheet();

            if (!e2) {
                console.log("성공", e2)
                // 성공: 서버의 웹훅(setup_intent.succeeded)에서 PaymentMethod 저장됨
            } else {
                throw "present error";
            }
        } catch (error) {
            console.log('error', error);
        } finally {
            setAddLoad(false);
            closeLoader();
            getMyCard();
        }
    }

    const submitAlert = () => {
        openAlertFunc({
            component: <FareDetail onSubmit={submitFunc} />
        })
    }

    const submitFunc = async () => {

        if (submitLoad) return;

        setSubmitLoad(true);

        let pay = carList?.find(x => x?.type === selectIndex)?.pay;

        const sender = {
            callType: selectIndex,
            cardIdx: card?.idx,
            mileage: mileage,

            startLat: start?.lat,
            startLng: start?.lng,
            startAddress: start?.address,
            startName: start?.name,

            endLat: end?.lat,
            endLng: end?.lng,
            endAddress: end?.address,
            endName: end?.name,

            wayPoint: way,

            distance: info?.distance,
            fare: pay
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/passenger/call/request', sender);

        setTimeout(() => {
            setSubmitLoad(false);

            if (error) {
                console.log('error', error);
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            } else {
                router.canDismiss() && router.dismissAll();
                router.replace(routes.call);
            }

        }, consts.apiDelay)

    }

    function typeToImg(type) {
        if (type === 1) return images.carRide
        else if (type === 2) return images.carRideLarge
        else if (type === 3) return images.carTaseta
        else if (type === 4) return images.carTasetaLarge
    }



    return (
        <Layout>

            {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <View style={styles.root}>
                <View style={styles.mapBox} >
                    {info?.mapUri && <Map uri={info?.mapUri} onLoadEnd={() => setInitLoad(false)} />}

                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            router.back()
                        }}
                    >
                        <Image source={images.back} style={rootStyle.size_24} />
                    </TouchableOpacity>
                </View>

                <AnimatedTouchable style={[styles.toggle, toggleStyle]} onPress={toggleMap}>
                    <Image source={step === 0 ? images.waypoints : images.waypoints_map} style={rootStyle.default48} transition={100} />
                </AnimatedTouchable>
            </View>

            <BottomSheetTemplate sheetRef={sheetRef} snapPoints={[200 - (Platform.OS === 'ios' ? insets?.bottom : 0)]} animatedPosition={sheetPosition} enableHandlePanningGesture={step === 0}>
                {step === 0 ? (
                    <View style={styles.bottom}>
                        <View style={styles.car}>
                            {carList?.map((item, index) => {
                                return (
                                    <TouchableOpacity
                                        key={"ct-i-" + index}
                                        style={[styles.carItemBox, (item?.type === selectIndex ? styles.carItemBoxActive : {})]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            sheetRef.current?.expand();
                                            setSelectIndex(item?.type);
                                        }}
                                    >
                                        <Image source={typeToImg(item?.type)} style={[rootStyle.selectCar, { width: '15%' }]} />
                                        <View style={styles.carItemInfoBox}>
                                            <Text style={rootStyle.font(18, colors.main, fonts.semiBold)}>{lang({ id: item?.nameId })}</Text>
                                            <View style={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "center" }}>
                                                <Image source={images.personFill} style={rootStyle.size_16} />
                                                <Text style={rootStyle.font(16, colors.main, fonts.regular)}>{(item?.type === 2 || item?.type === 4) ? 6 : 4}</Text>
                                            </View>
                                            <View style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                                <Text style={rootStyle.font(16, colors.main, fonts.medium)}>{lang({ id: "per_1km" })} / {item?.perPay}$ {lang({ id: 'pay' })}</Text>
                                                <Text style={rootStyle.font(16, colors.main, fonts.medium)}>{numDoler(item?.pay)}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>

                        <View >
                            <View style={styles.btnView}>
                                <TouchableOpacity
                                    style={styles.btnItemBox}
                                    onPress={() => {
                                        // router.back()
                                        addCardPop();
                                    }}
                                >
                                    <Image source={images.creditCard} style={rootStyle.size_24} />
                                    {card ? (
                                        <Text style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>
                                            {`${card?.cardName?.toUpperCase()} ${lang({ id: 'card' })}(${card?.cardNum})`}
                                        </Text>
                                    ) : (
                                        <Text style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>
                                            {lang({ id: "payment_method_regis" })}
                                        </Text>
                                    )}

                                    <Image source={images.arrowRight} style={rootStyle.size_24} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.btnItemBox}
                                    onPress={() => {
                                        // router.back()
                                        applyMileage();
                                    }}
                                >
                                    <View>
                                        <Image source={images.coin} style={rootStyle.size_24} />
                                        {mileage > 0 && <View style={styles.dot} />}
                                    </View>
                                    <Text style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>{lang({ id: "mileage_application" })}</Text>
                                    <Image source={images.arrowRight} style={rootStyle.size_24} />
                                </TouchableOpacity>

                                <Button disabled={(!selectIndex || !card)} load={submitLoad} style={styles.completeBtn} onPress={submitAlert}>{!selectIndex ? lang({ id: 'call_all_vehicles' }) : `${lang({ id: 'calling' })} ${lang({ id: carList?.find(item => item?.type === selectIndex)?.nameId })}`}</Button>
                            </View>

                            
                        </View>
                    </View>
                ) : (
                    <RoutesView />
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
        headerBox: {
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 20,
            paddingBottom: 15
        },
        completeBtn: {
            width: "100%",
            marginTop: 16,
            // paddingHorizontal: rootStyle.side
        },
        mapBox: {
            // width: "100%",
            // height: "100%"
            flex: 1
        },
        bottom: {
            paddingBottom: insets?.bottom + 20
        },
        car: {
        },
        carItemBox: {
            display: "flex",
            flexDirection: "row",
            alignItems: 'center',
            paddingVertical: 15,
            gap: 14,
            paddingHorizontal: rootStyle.side,
        },
        carItemBoxActive: {
            backgroundColor: colors.sub_3,
        },
        carItemInfoBox: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
        },
        toggle: {
            position: 'absolute',
            right: rootStyle.side,
            zIndex: 1
        },

        btnView: {
            marginHorizontal: rootStyle.side,
            borderTopWidth: 1,
            borderTopColor: colors.sub_1,
            paddingTop: 12
        },
        btnItemBox: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            paddingVertical: 6,
            gap: 12
        },
        backBtn: {
            position: "absolute",
            top: insets?.top + 20,
            left: rootStyle.side
        },
        dot: {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 100,
            backgroundColor: colors.text_popup,
            right: 0
        }

    })

    return { styles }
}