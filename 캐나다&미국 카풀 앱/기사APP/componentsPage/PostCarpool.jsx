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
    RefreshControl,
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
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import PathChange from '@/components/Popup/PathChange';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, getPosition, numFormat, numDoler, getDday, sumPay, getTreeBadge } from '@/libs/utils';

import { useAlert, useEtc, useUser, useConfig } from '@/libs/store';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8; // 카드 실제 크기 (80%)
const SPACING = 20;             // 카드 간격

export default function Page({ item, reload, setReload, jumpTo, dataFunc }) {

    const { idx, startIndex, endIndex } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, login, logout } = useUser();
    const { badges } = useConfig();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [status, setStatus] = useState(true);
    const [treeBadge, setTreeBadge] = useState(null);
    const [myJoinInfo, setMyJoinInfo] = useState(null);

    const [paySum, setPaySum] = useState(0);
    const [confirmCount, setConfirmCount] = useState(0);

    const [boxHeight, setBoxHeight] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const viewables = useSharedValue([]);

    useEffect(() => {

        if (item?.isJoin) {
            let myInfo = item?.joins?.find(x => x?.userIdx === mbData?.idx);
            setMyJoinInfo(myInfo);
            setStart(item?.itinerary?.find(x => x?.idx === myInfo?.startIdx));
            setEnd(item?.itinerary?.find(x => x?.idx === myInfo?.endIdx));
        } else {
            setStart(item?.itinerary?.[startIndex || 0]);
            setEnd(item?.itinerary?.[endIndex || item?.itinerary?.length - 1]);
        }

        setStatus( item?.status === 1 && (getDday(item?.driveAt) > 0 && (item?.seats - item?.joins?.length) > 0));

        setTreeBadge( getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }) );

        setConfirmCount(
            item?.joins?.filter(x => x?.status === 2)?.length || 0
        );

    }, [item]);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    const onFinishFunc = async (v) => {
        
        let sender = {
            postIdx: item?.idx,
            isActive: item?.status === 2
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/post/finish', sender);
        console.log({ data, error });
        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        }

        dataFunc(true);
    }

    return (
        <View style={{ flex: 1 }}>
            {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}
            {/* <Text>{startIndex}{endIndex}</Text> */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                }
                contentContainerStyle={{
                    paddingTop: 32,
                    paddingBottom: insets?.bottom + 20,
                    paddingHorizontal: rootStyle.side,
                }}
            >
                {/* <Text>{item?.idx} // {dayjs(item?.driveAt).diff(dayjs(), 'minute')}</Text> */}

                <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), marginBottom: 15 }}>{lang({ id: 'posted' })} : {dayjs(item?.createAt).format('MMMM DD, YYYY, h:mm A')}</Text>

                <Pressable style={{ gap: 12 }} onPress={() => {
                    router.push({
                        pathname: routes.userView,
                        params: {
                            idx: item?.creator?.idx
                        }
                    })
                }}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={consts.s3Url + item?.creator?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />

                        <View style={[{ flex: 1, gap: 2 }]}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.creator?.firstName} {item?.creator?.lastName}</Text>
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 2 }]}>
                                    {item?.creator?.badges?.filter(x => badges?.filter(xx => xx?.type !== 1)?.map(xx => xx?.idx+"")?.includes(x))?.map((x, i) => {
                                        let badge = badges?.find(xx => xx?.idx == x);
                                        return (
                                            <Image key={i} source={consts.s3Url + badge?.imgPath} style={{ width: 26, height: 26, borderRadius: 1000 }} />
                                        )
                                    })}
                                </View>
                            </View>

                            {item?.creator?.reviewCount || item?.creator?.rideCount ? (
                                <View style={[rootStyle.flex, { alignItems: 'center', justifyContent: 'flex-start', gap: 2 }]}>

                                    <Image source={images.star_red} style={rootStyle.default16} />
                                    <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.text_popup), lineHeight: 22 }}>{item?.creator?.avgRate || 0}</Text>
                                    <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>({item?.creator?.reviewCount || 0})</Text>

                                    <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>{item?.creator?.rideCount || 0} {lang({ id: 'rides' })}</Text>
                                </View>
                            ) : (
                                <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>{lang({ id: 'no_ratings' })}</Text>
                            )}

                        </View>
                    </View>
                    {treeBadge && (
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                            <Image source={consts.s3Url + treeBadge?.imgPath} style={{ width: 26, height: 26 }} />
                            <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium), flexShrink: 1, lineHeight: 22 }}>{lang({ id: treeBadge?.title })}</Text>
                        </View>
                    )}


                    {/* <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                        <Image source={images.pointer} style={rootStyle.default} />
                        <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>2.8 km of you</Text>
                    </View> */}
                </Pressable>


                <View style={{ gap: 15, marginTop: 18 }} onLayout={onLayout}>
                    <View style={[styles.bar, { height: boxHeight - 30 }]} />
                    {item?.itinerary?.map((x, i) => {
                        return (
                            <View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                    {i === 0 ? (
                                        <Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
                                    ) : i === item?.itinerary?.length - 1 ? (
                                        <Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Text style={{ ...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{x?.name}</Text>
                                    <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>
                                        {dayjs(`${x?.driveDate} ${x?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
                                    </Text>
                                </View>

                            </View>
                        )
                    })}
                </View>
              
                <View style={[rootStyle.flex, { gap: 10, marginVertical: 18, alignItems: 'flex-start' }]}>
                    <Image source={images.exclamation_circle} style={rootStyle.default} />

                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{  ...rootStyle.font(14, colors.main, fonts.medium) }}>{lang({ id: 'all_times_are_based_on' })}</Text>
                        <Text style={{  ...rootStyle.font(14, colors.main, fonts.medium) }}>{lang({ id: 'carpool_start_info_message_1' })}</Text>
                    </View>
                </View>
                

                <View style={{ gap: 10 }}>
                    <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start', }]}>
                        {status ? <Tag msg={lang({ id: 'recruitment' })} /> : <Tag type={3} msg={lang({ id: 'end_of_recruitment' })} />}
                    </View>
                    <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
                        <Tag type={4} msg={item?.creator?.driverInfo?.carType || ''} />
                        <Tag type={4} msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
                        <Tag type={4} msg={`${item?.seats} ${lang({ id: 'seats' })}`} />
                    </View>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 6 }]}>
                        <Image source={images?.[`post_bag_${item?.luggage}`]} style={rootStyle.default30} />
                        <Image source={images?.[`post_dog_${item?.pet}`]} style={rootStyle.default30} />
                        <Image source={images?.[`post_smoke_${item?.smoke}`]} style={rootStyle.default30} />
                        <Image source={images?.[`post_bike_${item?.bicycle}`]} style={rootStyle.default30} />
                        <Image source={images?.[`post_snowboard_${item?.snowboard}`]} style={rootStyle.default30} />
                        <Image source={images?.[`post_tire_${item?.tire}`]} style={rootStyle.default30} />
                    </View>
                </View>

                <TouchableOpacity style={styles.link} onPress={() => { jumpTo('status') }}>
                    <View style={[rootStyle.flex, { flex: 1, gap: 3, justifyContent: 'flex-start', }]}>
                        <Image source={images.personFill} style={rootStyle.default16} />
                        <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{confirmCount} Confirmed | {item?.seats - confirmCount} Seat Left</Text>
                    </View>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>

                <View style={styles.mapBox} >
                    {mapLoad && <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white, paddingBottom: 0 }} fixed />}
                    {item?.mapUri && <Map uri={item?.mapUri} onLoadEnd={() => setMapLoad(false)} />}
                </View>

            </ScrollView>
                    
                

            {(mbData?.idx === item?.userIdx && item?.status < 4) && (
                item?.status === 3 ? (
                    <Button bottom onPress={() => { 
                        router.dismissTo({
                            pathname: routes.postTrip,
                            params: {
                                idx: item?.idx
                            }
                        })
                    }}>{lang({ id: 'view_trip' })}</Button>
                ) : (
                    <Button type={item?.status === 1 ? 2 : 1} bottom load={load} onPress={onFinishFunc}>{lang({ id: item?.status === 1 ? 'end_of_recruitment' : 'recruitment' })}</Button>
                )
            )}

           
            
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
        link: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            height: 50,
            borderWidth: 1,
            borderColor: colors.main,
            borderRadius: 13,
            marginVertical: 20
        },
        mapBox: {
            width: "100%",
            aspectRatio: 1 / 1,
            borderRadius: 13,
            overflow: 'hidden'
            // height: "100%"
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
