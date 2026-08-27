import React, { useRef, useState, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';

import { router, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useStripe } from '@stripe/stripe-react-native';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import InputDate from '@/components/InputDate';

import Card from '@/components/Item/Card';

import CardDelete from '@/components/Popup/CardDelete';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat, numDoler } from '@/libs/utils';

import { useLang, useAlert, useLoader } from '@/libs/store';

function ListItem({ item, index, viewables, isDayLabel }) {

    const { styles } = useStyle();
    const { country } = useLang();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            opacity: withTiming(isVisible ? 1 : 0, { duration: 150 })
        }

    }, [item.idx, viewables])

    const goLink = (item) => {
        console.log('item', item?.idx)
        router.push({
            pathname: routes.noticeView,
            params: {
                idx: item?.idx,
            },
        });
    }

    return (
        <Animated.View
            style={[animatedStyle]}
        >
            <View style={styles.listItem} >
                {isDayLabel && (
                    <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('MMMM / YYYY')}</Text>
                )}
                <View style={{ flex: 1, gap: 7 }}>
                    <View style={[rootStyle.flex, { gap: 12, justifyContent: 'space-between' }]}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>{lang({ id: item?.type === 'add' ? 'earned' : 'used' })} - {lang({ id: item?.title })}</Text>
                        <Text style={[styles.listItemValue, { color: item?.type === 'add' ? colors.taseta : colors.main }]}>{item?.type === 'add' ? '+' : '-'}{numDoler(item?.amount)}</Text>
                    </View>
                    <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('MMMM/DD/YYYY A h:mm')}</Text>
                </View>
            </View>
        </Animated.View>
    );
}

export default function Page({ }) {

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const pathname = usePathname();
    const { type, sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [cards, setCards] = useState([]); // 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [addLoad, setAddLoad] = useState(false); // 카드등록 로딩

    const viewables = useSharedValue([]);

    useEffect(() => {
        cardList();
    }, [])

    useEffect(() => {

        dataFunc(true);

    }, [type, sdate, edate]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
            cardList();
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            filter: type,
            startTime: sdate ? dayjs(sdate).valueOf() : null,
            endTime: edate ? dayjs(edate).valueOf() : null,

            nextToken: reset ? null : nextToken,
            limit: 50
        }
        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/payHistory', sender);

        setNextToken(data?.nextToken);
        console.log('data', data)
        const fetchData = data || [];
        // const fetchData = [];
        // const fetchData = dummy.getBoardDummys(100);

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });

        // if (reset && !reload) {
        //     viewables.value = [];
        //     listRef?.current?.scrollToOffset({ offset: 0, animated: true })
        // }

        setTimeout(() => {

            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const cardList = async () => {

        const { data, error } = await API.post('/v2/my/cardList');
        setCards(data || []);

    }


    const renderItem = ({ item, index }) => {

        const prev = list?.[index - 1];

        let curDay = dayjs(item?.createAt).format("YYYY.MM");
        let prevDay = dayjs(prev?.createAt).format("YYYY.MM");

        let isDayLabel = (!prev || prevDay !== curDay);


        return (
            <ListItem item={item} viewables={viewables} isDayLabel={isDayLabel} />
        )
    };

    const renderItemCard = ({ item, index }) => {
        if (!item) {
            return (
                <TouchableOpacity style={styles.add} activeOpacity={0.7} onPress={addCardPop}>
                    <Image source={images.card_add} style={rootStyle.default32} />
                </TouchableOpacity>
            )
        } else {
            return (
                <Card item={item} viewables={viewables} onPress={() => openPop(item)} />
            )
        }
    };

    const openPop = (item) => {

        openAlertFunc({
            component: <CardDelete item={item} />
        })

    }
    const openFilter = () => {
        router.push({
            pathname: routes.filterPayment,
            params: { type: type || "", sdate, edate }
        });

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
                // applePay: { merchantCountryCode: 'US' },
                // googlePay: { merchantCountryCode: 'US', testEnv: true },
                // returnURL: 'taseta://stripe-redirect',

            });

            if (error2) {
                console.log('error2', error2);
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
            cardList();
            setAddLoad(false);
            closeLoader();
        }
    }

    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };



    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'payment_management' })
    };


    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <FlatList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}

                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingBottom: insets?.bottom,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                    // stickyHeaderIndices={[0]}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.headerText}>{lang({ id: 'payment_cards' })}</Text>

                            {/* <View>
                                <FlatList
                                    data={[...cards, null]}
                                    renderItem={renderItemCard}
                                    contentContainerStyle={{
                                        gap: 20,
                                        paddingHorizontal: 20
                                    }}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={
                                        <View style={[styles.add, { width: width - 40, paddingHorizontal: 40, gap: 26 }]} >
                                            <Text style={styles.emptyTitle}>{lang({ id: 'no_registered_cards' })}</Text>
                                            <Button onPress={addCardPop}>{lang({ id: 'register_credit_card' })}</Button>
                                        </View>
                                    }
                                />
                            </View> */}

                            <View style={{ paddingHorizontal: rootStyle.side }}>
                                <Button type={1} onPress={addCardPop}>{lang({ id: 'payment_method_management' })}</Button>
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: rootStyle.side }]}>
                                <Text style={[styles.headerText, { paddingHorizontal: 0, flexShrink: 1 }]}>{lang({ id: 'payment_history' })}</Text>
                                <TouchableOpacity onPress={openFilter}>
                                    <Image source={images.filter} style={rootStyle.default} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'no_history' })} />
                    }
                    // ListFooterComponent={
                    //     () => {
                    //         if(initLoad || !load || reload) return null;
                    //         return (
                    //             <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                    //                 <ActivityIndicator size="small" color={colors.black} />
                    //             </View>
                    //         )
                    //     }
                    // }

                    nestedScrollEnabled
                    onViewableItemsChanged={onViewableItemsChanged}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />


            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        header: {
            backgroundColor: colors.white,
            gap: 26,
            marginBottom: 26
        },
        headerText: {
            paddingHorizontal: rootStyle.side,
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        add: {
            width: 282,
            aspectRatio: rootStyle.card.aspectRatio,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.sub_3
        },
        emptyTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.sub_1,
            letterSpacing: -0.36,
            textAlign: 'center'
        },
        listItem: {
            paddingVertical: 14,
            paddingHorizontal: rootStyle.side,
            gap: 20,
        },
        listItemTitle: {
            fontFamily: fonts.medium,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36,
            flexShrink: 1
        },
        listItemValue: {
            fontFamily: fonts.extraBold,
            fontSize: 20,
            color: colors.main,
            letterSpacing: -0.4
        },
        listItemDate: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },

    })

    return { styles }
}
