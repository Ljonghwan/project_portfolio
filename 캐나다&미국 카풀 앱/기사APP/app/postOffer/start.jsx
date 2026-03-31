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

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Empty from '@/components/Empty';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import Post from '@/components/Item/PostPrevious';

import RoutesView from '@/components/Post/RoutesView';

import PathChange from '@/components/Popup/PathChange';
import OfferAlert from '@/components/Popup/OfferAlert';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numDoler, sumPay, useBottomSheetBackHandler } from '@/libs/utils';

import { useLang, useAlert, useEtc, usePost } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { idx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();
    const { postStart, setPostData } = usePost();

    const listRef = useRef(null);
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [selected, setSelected] = useState(null);


    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const [paySum, setPaySum] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useEffect(() => {
        dataFunc(true);
    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    useEffect(() => {

        if (start && end) {
            let pay = sumPay({ itinerary: selected?.itinerary, startIndex: selected?.itinerary?.findIndex(x => x?.idx === start?.idx), endIndex: selected?.itinerary?.findIndex(x => x?.idx === end?.idx), rate: selected?.feeRate })
            setPaySum(pay);
        }

    }, [start, end]);


    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/driver/reqpost/myList');

        console.log('data', data);

        // setList([])
        setList(data || []);
        // setList(data || []);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const pathChangeFunc = () => {
        if (!selected) return;

        openAlertFunc({
            component: <PathChange list={selected?.itinerary} start={start} setStart={setStart} end={end} setEnd={setEnd} />
        })
    }


    const offerAlert = () => {
        if (!selected || !start || !end) return;

        openAlertFunc({
            component: <OfferAlert way={[start, end]?.map(x => ({ ...x, pay: null }))} start={start} onPress={offerFunc} />
        })
    }

    const offerFunc = async () => {

        if (load) return;

        setLoad(true);

        const sender = {
            postIdx: idx,
            targetIdx: selected?.idx,
            startIdx: start?.idx,
            endIdx: end?.idx,
        }

        console.log('sender', sender);
        
        const { data, error } = await API.post('/v2/driver/reqpost/join', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }


            ToastMessage(lang({ id: 'success_code_application' }))

            router.dismissTo({
                pathname: routes.postFindDriver,
                params: {
                    idx: idx,
                    back: true
                }
            })


        }, consts.apiDelay)

    }

    const renderItem = ({ item, index }) => {

        return (
            <Post
                item={item}
                style={{
                    marginHorizontal: rootStyle.side,
                    marginBottom: 23,
                }}
                onPress={() => {
                    setStart(item?.itinerary?.[0]);
                    setEnd(item?.itinerary?.at(-1));

                    setSelected(item);
                    sheetRef.current?.present();
                }}
            />
        )

    };

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const { handleSheetPositionChange } = useBottomSheetBackHandler(sheetRef, () => { });

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'select_post' })
    };

    return (

        <Layout header={header}>
            <View style={styles.root}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <FlashList
                    ref={listRef}
                    data={list}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    renderItem={renderItem}
                    numColumns={1}
                    keyExtractor={(item, index) => item?.idx + "_" + index}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 120,
                        flex: list?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'no_posts' })} />
                    }

                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />

            </View>

            <BottomSheetModal
                ref={sheetRef}
                index={0}
                style={styles.sheet}
                handleStyle={[{ height: 40, justifyContent: 'center' }]}
                handleIndicatorStyle={[{ backgroundColor: colors.sub_2, width: 100, height: 5 }]}
                backdropComponent={renderBackdrop}
                onChange={handleSheetPositionChange}
                enableOverDrag={false}
                enableDynamicSizing={true}
                animatedPosition={sheetPosition}
                backgroundStyle={{ backgroundColor: colors.white, borderRadius: 12 }}
            >
                <BottomSheetView >
                    <View style={styles.component}>
                        <View style={{ gap: 20 }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ride_information' })}</Text>

                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default]}>
                                    <Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
                                </View>
                                <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
                                    {dayjs(`${dayjs(start?.driveDate).format('YYYY-MM-DD')} ${dayjs(start?.driveTime).format('HH:mm')}`).format('MMM DD, YYYY, h:mm A')}
                                </Text>
                            </View>

                            <RoutesView way={[start, end]?.map(x => ({ ...x, pay: null }))} />

                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={{ gap: 5, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text numberOfLines={1} style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{numDoler(paySum)}</Text>

                                    <TouchableOpacity style={[styles.pointTag, {}]} onPress={pathChangeFunc}>
                                        <Text style={{ ...rootStyle.font(14, colors.taseta, fonts.medium) }}>{lang({ id: 'path_change' })}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Button
                                    load={load}
                                    style={{ width: 150 }}
                                    // disabled={!status} 
                                    onPress={offerAlert}
                                >
                                    {lang({ id: 'offer_ride' })}
                                </Button>
                            </View>
                        </View>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
        sheet: {
            elevation: 20, // 안드로이드 그림자

            shadowColor: colors.dark, // iOS 그림자
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,

            borderWidth: 0,
        },
        component: {
            overflow: 'hidden',
            paddingTop: 0,
            minHeight: 200,
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
        },
        pointTag: {
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.taseta_sub_2,
            borderWidth: 1,
            borderColor: colors.taseta
        }
    })

    return { styles }
}