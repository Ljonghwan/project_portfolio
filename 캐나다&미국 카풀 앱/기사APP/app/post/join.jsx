import { useEffect, useState, useRef, use } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, Platform, Pressable } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Tag from '@/components/Tag';

import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import SelectCard from '@/components/Form/SelectCard';

import JoinPostAlert from '@/components/Popup/JoinPostAlert';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useLang, useAlert, useLoader } from '@/libs/store';

import { ToastMessage, numDoler, getDday, sumPay, getFeePrice, sumDecimal } from '@/libs/utils';

const routesTab = [
    { key: '1', title: lang({ id: 'carpool' }) },
    { key: '2', title: lang({ id: 'status' }) },
    { key: '3', title: lang({ id: 'chat' }) },
];
export default function Page() {

    const { idx, startIdx, endIdx } = useLocalSearchParams();
    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { country } = useLang();

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const [paySum, setPaySum] = useState(0);
    const [payRide, setPayRide] = useState(0);
    const [payFee, setPayFee] = useState(0);

    const [item, setItem] = useState(null);

    const [card, setCard] = useState(null);

    const [view, setView] = useState(false);
    const [cardView, setCardView] = useState(false); // 카드 선택화면

    const [addLoad, setAddLoad] = useState(false); // 카드등록 로딩

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        cardList()
    }, [])

    useEffect(() => {
        dataFunc(true);
    }, [idx]);

    useEffect(() => {

        setStart(item?.itinerary?.find(x => x?.idx == startIdx));
        setEnd(item?.itinerary?.find(x => x?.idx == endIdx));

    }, [item]);

    useEffect(() => {

        if (start && end) {
            let pay = sumPay({ itinerary: item?.itinerary, startIndex: item?.itinerary?.findIndex(x => x?.idx === start?.idx), endIndex: item?.itinerary?.findIndex(x => x?.idx === end?.idx) });
            let fee = getFeePrice({ price: pay, rate: item?.feeRate });

            setPayRide(pay);
            setPayFee(fee);
            setPaySum(sumDecimal(pay, fee));
        }

    }, [start, end]);

    useEffect(() => {
        setDisabled(!(card));
    }, [card])

    const dataFunc = async (reset) => {

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

        if (data?.isJoin) {
            ToastMessage(lang({ id: 'this_is_the_carpool_already_applied' }), { type: 'error' });
            router.back();
            return;
        }

        // if( !( getDday(item?.driveAt) > 0 && (item?.seats - item?.joinCount) > 0 ) ) {
        //     ToastMessage(lang({ id: 'currently_cant_be_booked' }), { type: 'error' });
        //     router.back();
        //     return;
        // }

        setItem(data);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const cardList = async () => {

        const { data, error } = await API.post('/v2/driver/call/cardList');
        setCard(data);
    }

    const addCardPop = async () => {
       
    }

    const payAlert = () => {
        openAlertFunc({
            component: <JoinPostAlert onPress={payFunc}/>
        })
    }

    const payFunc = async (hour=12) => {

        setLoad(true);

        const sender = {
            postIdx: item?.idx,
            startIdx: start?.idx,
            endIdx: end?.idx,
            limitHour: hour
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v2/driver/post/join', sender);

        console.log({ data, error });

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            ToastMessage(lang({ id: data }));

            router.dismissTo({
                pathname: routes.postView,
                params: {
                    idx: item?.idx,
                    back: true
                }
            })

        }, consts.apiDelay)
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'join_carpool' }),
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
                <View style={{ flex: 1 }}>
                    {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}
                    {/* <Text>{startIndex}{endIndex}</Text> */}
                    <ScrollView
                        scrollEnabled={!cardView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingTop: 23,
                            paddingBottom: insets?.bottom + 120,
                            paddingHorizontal: rootStyle.side,
                        }}
                    >

                        <View style={{ gap: 15 }}>
                            <View style={{ gap: 15 }}>
                                <Text style={styles.title}>{lang({ id: 'ride_information' })}</Text>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'type_of_boarding' })}</Text>
                                    <Tag msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
                                </View>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'departure' })}</Text>
                                    <Text style={styles.content}>{start?.name}</Text>
                                </View>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'destination' })}</Text>
                                    <Text style={styles.content}>{end?.name}</Text>
                                </View>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'estimated_ride_time' })}</Text>
                                    <Text style={styles.content}>{dayjs(`${start?.driveDate} ${start?.driveTime}`).format('MMM DD, YYYY, h:mm A')}</Text>
                                </View>
                            </View>

                            <View style={{ gap: 15 }}>
                                <Text style={styles.title}>{lang({ id: 'vehicle_information' })}</Text>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'driver' })}</Text>
                                    <Text style={styles.content}>{item?.creator?.firstName} {item?.creator?.lastName}</Text>
                                </View>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>
                                    <Text style={styles.content}>{item?.creator?.driverInfo?.carType}</Text>
                                </View>
                                <View style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>
                                    <Text style={styles.content}>{item?.creator?.driverInfo?.carNumber}</Text>
                                </View>
                            </View>

                            <View style={{ gap: 15 }}>
                                <Text style={styles.title}>{lang({ id: 'payment_information' })}</Text>

                                <Pressable style={styles.list} onPress={() => setView(!view)}>
                                    <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'price_details' })}</Text>
                                    <View style={[rootStyle.flex]}>
                                        <Text style={[styles.content, { color: colors.taseta }]}>{numDoler(paySum)}</Text>
                                        <Image source={view ? images.up_fill : images.down_fill} style={rootStyle.default18} />
                                    </View>
                                </Pressable>

                                {view && (
                                    <>
                                        <View style={styles.list}>
                                            <Text style={styles.label}>{lang({ id: 'ride_fare' })}</Text>
                                            <Text style={styles.content}>{numDoler(payRide)}</Text>
                                        </View>
                                        <View style={styles.list}>
                                            <Text style={styles.label}>{lang({ id: 'taseta_service_fee' })}</Text>
                                            <Text style={styles.content}>{numDoler(payFee)}</Text>
                                        </View>
                                    </>
                                )}

                                <Pressable style={styles.list} onPress={addCardPop}>
                                    <Text style={styles.label}>{lang({ id: 'payment_method' })}</Text>
                                    {card ?
                                        <Text style={[styles.content, { textDecorationLine: 'underline' }]} >{card?.cardName?.toUpperCase()} {card?.cardNum}</Text>
                                        :
                                        <Text style={[styles.content, { textDecorationLine: 'underline' }]} >{lang({ id: 'register_credit_card' })}</Text>
                                    }
                                </Pressable>

                            </View>

                            <View style={{ gap: 15 }}>
                                <Text style={styles.title}>{lang({ id: 'policies' })}</Text>
                                <Pressable style={styles.list} onPress={() => {
                                    router.push({
                                        pathname: routes.terms,
                                        params: {
                                            idx: 5,
                                            title: lang({ id: 'cancellation_policy' })
                                        },
                                    });
                                }}>
                                    <Text style={styles.label}>{lang({ id: 'cancellation_policy' })}</Text>
                                    <Image source={images.link} style={rootStyle.default} />
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>

                    <BottomSheetTemplate
                        sheetRef={sheetRef}
                        animatedPosition={sheetPosition}
                        handleStyle={{ height: 0 }}
                        handleIndicatorStyle={{ height: 0 }}
                    >

                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingBottom: insets?.bottom + 20, paddingHorizontal: rootStyle.side }]}>
                            <View style={{ gap: 5, alignItems: 'center' }}>
                                <Text numberOfLines={1} style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{numDoler(paySum)}</Text>
                                <Text style={{ ...rootStyle.font(14, colors.sub_1, fonts.medium) }}>{lang({ id: 'this_includes_vat' })}</Text>
                            </View>

                            <Button
                                load={load}
                                style={{ width: 150 }}
                                disabled={disabled}
                                onPress={payAlert}
                            >
                                {lang({ id: 'join_carpool' })}
                            </Button>
                        </View>

                    </BottomSheetTemplate>


                </View>

            </View>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            // borderTopColor: colors.sub_1,
            // borderTopWidth: 1,
            // paddingHorizontal: rootStyle.side
        },
        title: {
            ...rootStyle.font(18, colors.main, fonts.semiBold)
        },
        list: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10
        },
        label: {
            ...rootStyle.font(16, colors.sub_1, fonts.medium)
        },
        content: {
            ...rootStyle.font(16, colors.main),
            flexShrink: 1,
            textAlign: 'right',

        },
    })

    return { styles }
}