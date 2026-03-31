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
    Platform,
    Dimensions,
    useWindowDimensions,
    ActivityIndicator,
    Pressable
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Tag from '@/components/Tag';
import Map from '@/components/Map';
import Empty from '@/components/Empty';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import RequestDecline from '@/components/Popup/RequestDecline';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat, numDoler, getDday, getTreeBadge } from '@/libs/utils';

import { useAlert, useEtc, useUser, useConfig } from '@/libs/store';

function ListItem2({ item, index, onReject = () => { }  }) {

    const { styles } = useStyle();
    const { mbData } = useUser();

    const [boxHeight, setBoxHeight] = useState(0);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    return (
        <View style={{ gap: 20 }}>
            <Pressable style={[rootStyle.flex, { alignItems: 'flex-start', justifyContent: 'flex-start', gap: 15 }]} onPress={() => {
                router.push({
                    pathname: routes.userView,
                    params: {
                        idx: item?.userIdx
                    }
                })
            }}>
                <Image source={consts.s3Url + item?.user?.profile} style={{ width: '20%', aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                <View style={[{ flex: 1, gap: 7 }]}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                        <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.user?.firstName} {item?.user?.lastName} / {lang({ id: consts.genderOptions?.find(x => x?.idx === item?.user?.gender)?.title })}</Text>
                    </View>

                    <View style={{ gap: 7 }} onLayout={onLayout}>
                        <View style={[styles.bar, { height: boxHeight - 30 }]} />
                        <View style={{ gap: 15 }} >
                            <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                    <Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.start?.name}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ gap: 15 }} >
                            <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                    <Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.end?.name}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
            <Button type={10} onPress={onReject}>{lang({ id: 'decline' })}</Button>
        </View>
    );
}

function ListItem({ item, index, onAccept = () => { }, onReject = () => { } }) {

    const { styles } = useStyle();
    const { mbData } = useUser();

    const [boxHeight, setBoxHeight] = useState(0);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    return (
        <Pressable style={styles.item} onPress={() => {
            router.push({
                pathname: routes.userView,
                params: {
                    idx: item?.userIdx
                }
            })
        }}>
            <Image source={consts.s3Url + item?.user?.profile} style={{ width: '20%', aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />

            <View style={{ flex: 1, gap: 10 }}>
                <View style={[rootStyle.flex, { alignItems: 'flex-start', justifyContent: 'flex-start', gap: 15 }]}>

                    <View style={[{ flex: 1, gap: 7 }]}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                            <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.user?.firstName} {item?.user?.lastName} / {lang({ id: consts.genderOptions?.find(x => x?.idx === item?.user?.gender)?.title })}</Text>
                        </View>

                        <View style={{ gap: 11 }} onLayout={onLayout}>
                            <View style={[styles.bar, { height: boxHeight - 30 }]} />
                            <View style={{ gap: 15 }} >
                                <View style={[rootStyle.flex, { gap: 11, justifyContent: 'flex-start' }]}>
                                    <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                        <Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>{item?.start?.name}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ gap: 15 }} >
                                <View style={[rootStyle.flex, { gap: 11, justifyContent: 'flex-start' }]}>
                                    <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                        <Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>{item?.end?.name}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Button type={3} style={{ flex: 1 }} containerStyle={{ justifyContent: 'center' }} onPress={onAccept}>{lang({ id: 'accept' })}</Button>
                    <Button type={11} style={{ flex: 1 }} containerStyle={{ justifyContent: 'center' }} onPress={onReject}>{lang({ id: 'decline' })}</Button>
                </View>
            </View>

        </Pressable>
    );
}

export default function Page({ item, reload, setReload, dataFunc }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, login, logout } = useUser();
    const { badges } = useConfig();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const [status, setStatus] = useState(true);
    const [treeBadge, setTreeBadge] = useState(null);
    const [confirmList, setConfirmList] = useState([]);
    const [requestList, setRequestList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [boxHeight, setBoxHeight] = useState(0);

    useEffect(() => {

        setStatus((getDday(item?.driveAt) > 0 && (item?.seats - item?.joinCount) > 0));
        setTreeBadge( getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }) );

        setConfirmList(
            item?.joins?.filter(x => x?.status === 2)?.map(x => {
                return { ...x, start: item?.itinerary?.find(xx => xx?.idx === x?.startIdx), end: item?.itinerary?.find(xx => xx?.idx === x?.endIdx) }
            }) || []
        );
        setRequestList(
            item?.joins?.filter(x => x?.status === 1)?.map(x => {
                return { ...x, start: item?.itinerary?.find(xx => xx?.idx === x?.startIdx), end: item?.itinerary?.find(xx => xx?.idx === x?.endIdx) }
            }) || []
        )

    }, [item]);

    const renderItem = ({ item, index }) => {
        return (
            <ListItem item={item} onReject={() => onRejectAlert(item?.idx)} onAccept={() => onAcceptAlert(item?.idx)} />
        )
    }

    const onAcceptAlert = (idx) => {
         openAlertFunc({
            label: lang({ id: 'accept_request' }),
            title: lang({ id: 'are_you_sure_3' }),
            onCencleText: lang({ id: 'close' }),
            onPressText: lang({ id: 'accept' }),
            onCencle: () => { },
            onPress: () => onConfirm({ idx, status: true })
        })
    };

    const onRejectAlert = (idx) => {
        openAlertFunc({
            component: <RequestDecline onPress={(v) => onConfirm({ idx, status: false, desc: v})} />
        })
    };

    const onRejectAlert2 = (idx) => {
        openAlertFunc({
            component: <RequestDecline onPress={(v) => onConfirmCancel({ idx, status: false, desc: v})} />
        })
    }

    const onConfirm = async ({ idx, status, desc }) => {

        let sender = {
            joinIdx: idx,
            status,
            desc
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/post/confirm', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        } 

        dataFunc(true);
    }

    const onConfirmCancel = async ({ idx, status, desc }) => {
        let sender = {
            joinIdx: idx,
            desc
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/post/confirmCancel', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        } 

        dataFunc(true);
    }

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };


    return (
        <View style={{ flex: 1 }}>
            {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}
            {/* <Text>{startIndex}{endIndex}</Text> */}
            <View style={{ flex: 1 }} onLayout={onContentLayout}>
                <FlatList
                    data={requestList}
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
                        paddingHorizontal: rootStyle.side,
                        gap: 20,
                        // flex: requestList?.length < 1 ? 1 : 'unset'
                    }}
                    ListHeaderComponent={
                        <View style={{ gap: 20 }}>
                            {confirmList?.length > 0 && (
                                <>
                                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{lang({ id: 'confirmed' })} {confirmList?.length}/{item?.seats}</Text>
                                    {confirmList?.map((x, i) => {
                                        return (
                                            <ListItem2 key={x?.idx} item={x} onReject={() => onRejectAlert2(x?.idx)}/>
                                        )
                                    })}
                                </>
                            )}
                            <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>
                                {lang({ id: 'requested' })}
                                <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}> {requestList?.length}</Text>
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty style={{ minHeight: 300 }} image={'find_passenger'} msg={lang({ id: 'find_new_passenger' })} />
                    }
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
        bar: {
            position: 'absolute',
            left: 19 / 2 - 1,
            top: 15,
            height: '100%',
            borderRightWidth: 1,
            borderRightColor: colors.taseta,
            borderStyle: Platform.OS === 'ios' ? 'solid' : 'dashed'
        },
        item: {
            borderRadius: 12,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
            paddingVertical: 19,
            paddingHorizontal: 22,
            gap: 10,
            flexDirection: 'row',
            alignItems: 'flex-start'
        }
    })

    return { styles }
}
