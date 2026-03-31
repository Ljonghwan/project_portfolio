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
    Dimensions,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';

import Post from '@/components/Item/PostPassenger';

import SearchRadius from '@/components/Popup/SearchRadius';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, getPosition, numFormat } from '@/libs/utils';

import { useLang, useAlert, useEtc, useCarpool } from '@/libs/store';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9; // 카드 실제 크기 (80%)
const SPACING = 10;             // 카드 간격

export default function Page({ }) {

    const { back } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { start, end, way, date, type } = useCarpool();
    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);
    const listRef2 = useRef(null);

    const [list, setList] = useState([]);
    const [bestList, setBestList] = useState([]);
    const [nextToken, setNextToken] = useState(null);

    const [radius, setRadius] = useState(10); // 반경

    const [page, setPage] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [optionReload, setOptionReload] = useState(false); // 새로고침

    const [boxHeight, setBoxHeight] = useState(0);

    const viewables = useSharedValue([]);


    // useFocusEffect(
    //     useCallback(() => {
    //         dataFunc(true);
    //     }, [])
    // );

    useEffect(() => {
        dataFunc(true);
    }, []);

    useEffect(() => {

        if (back) {
            // dataFunc(true);
            setOptionReload(true);
            // setReload(true);
        }

    }, [back]);

    useEffect(() => {

        if (reload || optionReload) {
            dataFunc(true);
        }

    }, [reload, optionReload]);

    const dataFunc = async (reset, options) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            startLat: start?.lat,
            startLng: start?.lng,
            endLat: end?.lat,
            endLng: end?.lng,
            radius,
            date: date ? dayjs(date).format('YYYYMMDD') : null,
            type,
            ...options
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/reqpost/list', sender);

        console.log('error', data?.length, error);
        // setNextToken(data?.nextToken);
        // console.log('data', data);
        setBestList(data?.best || []);
        setList(data?.list || []);

        setTimeout(() => {
            if (reset) {
                listRef?.current?.scrollToOffset({ offset: 0, animated: true });
                listRef2?.current?.scrollToOffset({ offset: 0, animated: true });
            }
            router.setParams({ back: '' });
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setOptionReload(false);

        }, consts.apiDelay)
    }

    const radiusPop = () => {
        openAlertFunc({
            alertType: 'Sheet',
            component: <SearchRadius value={radius} setValue={(v) => {
                setRadius(v);
                setOptionReload(true);
                // dataFunc(true, { radius: v });
                // setReload(true);
            }} />
        })
    }

    const renderItem = ({ item, index }) => {

        return (
            <Post item={item} style={{ marginHorizontal: rootStyle.side, marginBottom: 23 }} />
        )

    };

    const renderItemBest = ({ item, index }) => {

        return (
            <Post item={item} style={{ width: CARD_WIDTH }} />
        )

    };


    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + SPACING)); // 현재 페이지 계산
        setPage(index);
    };

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};

    return (
        <View style={{ flex: 1 }}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
            {optionReload && (<Loading color={colors.taseta} style={{ backgroundColor: colors.dimWhite }} size={'large'} fixed />)}

            {/* <SearchRadius value={radius} setValue={setRadius} /> */}
            <View style={styles.header}>
                <TouchableOpacity style={[rootStyle.flex, { gap: 5 }]} onPress={radiusPop}>
                    <Image source={images.map_fin_start_on} style={rootStyle.default} />
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'up_to_km' })?.replace("{number}", radius)}</Text>
                </TouchableOpacity>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    {/* <TouchableOpacity onPress={() => router.push(routes.postFav)}>
                        <Image source={images.star} style={rootStyle.default} />
                    </TouchableOpacity> */}
                    <TouchableOpacity onPress={() => router.push(routes.filterFind)}>
                        <Image source={images.filter} style={rootStyle.default} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1 }} onLayout={onContentLayout}>
                <FlashList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    numColumns={1}
                    keyExtractor={(item) => item?.idx}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 20,
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}

                    ListHeaderComponent={
                        <View style={{ gap: 20 }}>

                            {bestList?.length > 0 && (
                                <View>
                                    <View style={{ ...rootStyle.flex, justifyContent: 'space-between', paddingHorizontal: rootStyle.side }}>
                                        <Text style={{ ...rootStyle.font(20, colors.taseta, fonts.semiBold) }}>{lang({ id: 'best_match' })}</Text>
                                        <Text style={{ ...rootStyle.font(20, colors.taseta, fonts.semiBold) }}>{page + 1}/{bestList?.length}</Text>
                                    </View>
                                    <FlatList
                                        ref={listRef2}
                                        data={bestList}
                                        renderItem={renderItemBest}
                                        contentContainerStyle={{
                                            paddingHorizontal: (width - CARD_WIDTH) / 2,
                                            paddingTop: 15,
                                            paddingBottom: 20
                                        }}

                                        ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
                                        horizontal
                                        snapToInterval={CARD_WIDTH + SPACING}
                                        decelerationRate="fast"
                                        snapToAlignment="start"
                                        pagingEnabled
                                        disableIntervalMomentum={true}
                                        showsHorizontalScrollIndicator={false}
                                        onScroll={handleScroll}
                                        scrollEventThrottle={16} // 16ms 마다 이벤트 (60fps)
                                    />
                                    <View style={styles.sectionBar} />
                                </View>
                            )}


                            <View style={{ paddingHorizontal: rootStyle.side, marginBottom: 23 }}>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.medium) }}>
                                    <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{numFormat(list?.length)}</Text> {lang({ id: 'list' })}
                                </Text>
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty style={{ height: boxHeight }} msg={lang({ id: 'no_posts' })} />
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

                    onViewableItemsChanged={onViewableItemsChanged}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />
            </View>




        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 60,
            paddingHorizontal: rootStyle.side,
            backgroundColor: colors.white
        },
        sectionBar: {
            width: '100%',
            height: 8,
            backgroundColor: colors.sub_3
        },
        sticky: {
            position: 'absolute',
            bottom: 20,
            left: 0,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: rootStyle.side
        },
        stickyButton: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 1000,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        }
    })

    return { styles }
}
