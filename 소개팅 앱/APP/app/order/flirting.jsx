import React, { useRef, useState, useEffect, useCallback } from 'react';
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
    ActivityIndicator,
    Pressable
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import dayjs from "dayjs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Filter from '@/components/Filter';
import Button from '@/components/Button';

import OrderFlirting from '@/components/list/OrderFlirting';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser } from '@/libs/store';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();

    const listRef = useRef(null);

    const [filter, setFilter] = useState(null); // 

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [info, setInfo] = useState("");

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [position, setPosition] = useState({});

    const viewables = useSharedValue([]);

    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
            getFlirting();
        }, [])
    );


    useEffect(() => {

        if (reload) {
            dataFunc(true);
            getFlirting();
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        let sender = {
            status: null
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v1/assets/flirtingHistory', sender);

        let dataList = data || [];
        const groups = Object.entries(
            dataList.reduce((acc, item) => {
                const date = item.createAt.slice(0, 10);
                (acc[date] = acc[date] || []).push(item);
                return acc;
            }, {})
        ).flatMap(([date, items]) => [date, ...items]);
            
        setList(groups || []);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const getFlirting = async () => {
        const { data, error } = await API.post('/v1/assets/flirting');
        console.log('data', JSON.stringify(data, null, 2));
        setInfo(data);
    }

    const renderItem = ({ item, index }) => {

        // let title = item?.chargeType === 4 ? item?.targetName : null;

        return (

            <OrderFlirting item={item} level={mbData?.level}  />
        );
    };


    const onLayout = useCallback((event) => {

        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                setPosition({ top: pageY + height, right: 20 })
            },
        );

    }, []);


    const header = {
        title: '픽켓 내역',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'picket',
            style: {
                width: 30
            }
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>

                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <View style={{ gap: 10, paddingTop: 20, paddingHorizontal: rootStyle.side }}>

                    <View style={[rootStyle.flex, { gap: 10 }]}>
                        <View style={styles.top}>
                            <Text style={styles.topTitle}>{mbData?.level === 2 ? '정산 가능한 픽켓' : '보유한 픽켓'}</Text>
                            <View style={[rootStyle.flex, { alignSelf: 'flex-end', height: 24, gap: 8 }]}>
                                <Image source={images.picket} style={[rootStyle.picket, { width: 20 }]} />
                                <Text style={styles.topCount}>
                                    {numFormat(mbData?.level === 2 ? info?.applyFlirting : mbData?.flirting)}장
                                </Text>
                            </View>
                        </View>
                        {mbData?.level === 2 && (
                            <View style={[styles.top, { borderColor: colors.primary4, backgroundColor: colors.primary4 }]}>
                                <Text style={[styles.topTitle, { color: colors.white }]}>정산 중인 픽켓</Text>
                                <View style={[rootStyle.flex, { alignSelf: 'flex-end', height: 24, gap: 8 }]}>
                                    <Image source={images.picket} style={[rootStyle.picket, { width: 20 }]} tintColor={colors.white}/>
                                    <Text style={[styles.topCount, { color: colors.white }]}>{numFormat(info?.flirting - info?.applyFlirting)}장</Text>
                                </View>
                            </View>
                        )}
                    </View>



                    <Button
                        containerStyle={[rootStyle.flex, { gap: 2 }]}
                        textStyle={{ fontSize: 16 }}
                        frontIcon={mbData?.level === 2 ? 'settlement' : 'menu_2_on'}
                        frontIconStyle={mbData?.level === 2 ? rootStyle.default32 : rootStyle.default}
                        frontIconTintColor={colors.white}
                        onPress={() => {
                            if (mbData?.level === 2) {
                                router.navigate(routes.paymentFlirtingSettlement)
                            } else {
                                router.navigate(routes.paymentProduct)
                            }
                        }}
                    >
                        {mbData?.level === 2 ? '픽켓 정산하기' : '픽켓 구매하기'}
                    </Button>

                    {/* <View style={styles.bottom} collapsable={false} onLayout={onLayout}>
                        <Filter
                            list={flirtingOptions?.filter(x => !x?.level || x?.level === mbData?.level)}
                            listStyle={{ width: 140 }}
                            top={position?.top}
                            right={position?.right}
                            onPress={(v) => { setFilter(v?.value) }}
                            component={
                                <View style={styles.filter}>
                                    <Text style={styles.filterText}>{flirtingOptions?.find(x => x?.value === filter)?.title} {filter}</Text>
                                    <Image source={images.filter_down} style={rootStyle.default} />
                                </View>
                            }
                        />
                    </View> */}

                </View>

                <View style={styles.bar} />

                <FlashList
                    data={list}
                    renderItem={({ item }) => {
                        if (typeof item === "string") {
                            // Rendering header
                            return (
                                <View style={[rootStyle.flex, { height: 40, paddingHorizontal: rootStyle.side, justifyContent: 'space-between', backgroundColor: colors.white }]}>
                                    <Text style={[rootStyle.font(14, colors.text_info, fonts.regular)]}>{item}</Text>
                                </View>
                            );
                        } else {
                            // Render item
                            return renderItem({ item })
                        }
                    }}
                    getItemType={(item) => {
                        // To achieve better performance, specify the type based on the item
                        return typeof item === "string" ? "sectionHeader" : "row";
                    }}
                    stickyHeaderIndices={list?.map((item, index) => (typeof item === "string" ? index : null)).filter((index) => index !== null)}

                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    ListHeaderComponent={
                        <View style={{ paddingHorizontal: rootStyle.side, marginBottom: 8 }}>
                            <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>전체 내역</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{  }}/>
                    }
                />

                {/* <FlatList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    keyExtractor={(item, index) => item?.idx}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        rowGap: 8,
                        paddingTop: 20,
                        paddingHorizontal: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}

                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} />
                    }

                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                /> */}


            </View>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: colors.main
        },
        top: {
            flex: 1,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: colors.primary,
            padding: 12,
            gap: 23
        },
        flirtingBox: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.main,
            width: 32,
            aspectRatio: 1 / 1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        topTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            fontFamily: fonts.medium,
            color: colors.primary
        },
        topCount: {
            fontSize: 16,
            fontFamily: fonts.bold,
            color: colors.primary
        },
        bar: {
            width: '100%',
            height: 14,
            backgroundColor: colors.greyD9,
            marginTop: 20
        },


        bottom: {
            alignSelf: 'flex-end'
        },
        filter: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.greyD,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            height: 44
        },
        filterText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            width: 90
        }
    })

    return { styles }
}
