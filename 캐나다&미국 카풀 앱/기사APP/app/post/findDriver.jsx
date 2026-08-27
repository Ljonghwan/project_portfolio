import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, RefreshControl, Pressable, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Tag from '@/components/Tag';
import Map from '@/components/Map';

import RoutesView from '@/components/Post/RoutesView';
import Report from '@/components/Popup/Report';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useLang, useUser, useAlert, useLoader, useConfig } from '@/libs/store';

import { ToastMessage, getDday, sumPay, getTreeBadge, numDoler } from '@/libs/utils';

export default function Page() {

    const { idx, back, startIndex, endIndex } = useLocalSearchParams();
    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { country } = useLang();
    const { badges } = useConfig();

    const [index, setIndex] = useState(0);

    const [item, setItem] = useState(null);

    const [status, setStatus] = useState(true);
    const [treeBadge, setTreeBadge] = useState(null);
    const [myJoinInfo, setMyJoinInfo] = useState(null);

    const [boxHeight, setBoxHeight] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        dataFunc(true);
    }, [idx]);

    useEffect(() => {
        if (reload || back) dataFunc(true);
    }, [reload, back]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        let sender = {
            postIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/reqpost/detail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);
        console.log('data????????', data?.joins)

        setMyJoinInfo(data?.joins?.[0] || null);

        setStatus((data?.status === 1 && getDday(data?.driveAt) > 0));
        setTreeBadge(getTreeBadge({ badges: badges, userBadges: data?.creator?.badges }));

        setTimeout(() => {
            // setList([]);
            router.setParams({
                idx: idx,
                back: '',
                startIndex: startIndex,
                endIndex: endIndex
            });

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const filterPress = (type) => {
        console.log('type', type);
        if (type === 1) {
            openAlertFunc({
                input: 200,
                component: <Report idx={idx} />
            })
        } else if (type === 2) {
            openAlertFunc({
                label: lang({ id: 'block_this_passenger' }),
                title: lang({ id: 'blocked_passengers_w' }),
                onPressText: lang({ id: 'block' }),
                onCencleText: lang({ id: 'no' }),
                onPress: blockFunc
            })
        } else if (type === 3) {

            openAlertFunc({
                label: lang({ id: 'delete_this_post' }),
                title: lang({ id: 'once_deleted_youll2' }),
                onPressText: lang({ id: 'delete' }),
                onCencleText: lang({ id: 'cancel' }),
                onPress: deleteFunc
            })

        }
    }

    const blockFunc = async () => {
        console.log('Block This Passenger !!');

        let sender = {
            idx: item?.creator?.idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/lock', sender);
        console.log({ data, error });

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        router.back();
        ToastMessage(lang({ id: 'this_driver_has_been_blocked' }))

    }

    const deleteFunc = async () => {


    }

    const cancelFunc = async () => {

        let sender = {
            postIdx: item?.idx
        }

        const { data, error } = await API.post('/v2/driver/reqpost/joinCancel', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        } else {
            ToastMessage(lang({ id: 'your_application_has_been_canceled' }));
        }
        
        dataFunc(true);
    }

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'post_info' }),
        filter: {
            list: [
                { idx: 1, title: lang({ id: 'report' }) },
                { idx: 2, title: lang({ id: 'block' }) },
            ],
            onPress: filterPress
        }
    };

    return (
        <Layout header={{
            ...header,
            filter: {
                list: mbData?.idx === item?.creator?.idx ? [
                    { idx: 3, title: lang({ id: 'delete' }), role: 'destructive' },
                ] : [
                    { idx: 1, title: lang({ id: 'report' }) },
                    { idx: 2, title: lang({ id: 'block' }) },
                ],
                onPress: filterPress
            }
        }}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
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
                    <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), marginBottom: 15 }}>{lang({ id: 'posted' })} : {dayjs(item?.createAt).format('MMMM DD, YYYY, h:mm A')}</Text>

                    <Pressable style={{ gap: 12 }} onPress={() => {
                        router.push({
                            pathname: routes.userView,
                            params: {
                                idx: item?.creator?.idx
                                // idx: 22
                            }
                        })
                    }}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                            <Image source={consts.s3Url + item?.creator?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />

                            <View style={[{ flex: 1, gap: 2 }]}>
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                    <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.creator?.firstName} {item?.creator?.lastName}</Text>
                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 2 }]}>
                                        {item?.creator?.badges?.filter(x => badges?.filter(xx => xx?.type !== 1)?.map(xx => xx?.idx + "")?.includes(x))?.map((x, i) => {
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
                                        {i === 0 && (
                                            <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>
                                                {dayjs(`${x?.driveDate} ${x?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
                                            </Text>
                                        )}

                                    </View>
                                </View>
                            )
                        })}
                    </View>

                    <View style={[rootStyle.flex, { gap: 10, marginVertical: 18 }]}>
                        <Image source={images.exclamation_circle} style={rootStyle.default} />
                        <Text style={{ flex: 1, ...rootStyle.font(14, colors.main, fonts.medium) }}>{lang({ id: 'all_times_are_based_on' })}</Text>
                    </View>

                    <View style={{ gap: 10 }}>
                        <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
                            {status ? <Tag textStyle={{ lineHeight: 20 }} msg={lang({ id: 'searching' })} /> : <Tag type={3} textStyle={{ lineHeight: 20 }} msg={lang({ id: 'matched' })} />}
                            <Tag type={4} msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
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

                    <View style={{ gap: 20, marginVertical: 30 }}>
                        <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{lang({ id: 'description' })}</Text>
                        <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium) }}>{item?.desc || '-'}</Text>
                    </View>

                    <View style={styles.mapBox} >
                        {mapLoad && <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white, paddingBottom: 0 }} fixed />}
                        {item?.mapUri && <Map uri={item?.mapUri} onLoadEnd={() => setMapLoad(false)} />}
                    </View>

                    {myJoinInfo && (
                        <View style={{ gap: 20, marginTop: 30 }}>
                            <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{lang({ id: 'my_offer' })}</Text>
                            <View style={{ gap: 10 }}>
                                <View style={[rootStyle.flex, { alignItems: 'flex-start', justifyContent: 'flex-start', gap: 15 }]}>
                                    <Image source={consts.s3Url + myJoinInfo?.user?.profile} style={{ width: '20%', aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                                    <View style={[{ flex: 1, gap: 7 }]}>

                                        <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
                                            <Tag type={4} msg={lang({ id: myJoinInfo?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
                                            <Tag type={1} textStyle={{ lineHeight: 20 }} msg={numDoler(myJoinInfo?.pay)} />
                                        </View>
                                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                            <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{myJoinInfo?.user?.firstName} {myJoinInfo?.user?.lastName} / {lang({ id: consts.genderOptions?.find(x => x?.idx === myJoinInfo?.user?.gender)?.title })}</Text>
                                        </View>

                                        <RoutesView style={{ gap: 12 }} way={[{name: myJoinInfo?.startName}, {name: myJoinInfo?.endName}]} />
                                    </View>
                                </View>
                            </View>
                            
                            
                        </View>
                    )}


                </ScrollView>

                {(!myJoinInfo && status) ? (
                    <Button bottom onPress={() => {
                        router.push({
                            pathname: routes.postOffer,
                            params: {
                                idx: item?.idx
                            }
                        })
                    }}>{lang({ id: 'offer_ride' })}</Button>
                ) : myJoinInfo ? (
                    <Button bottom type={2} onPress={cancelFunc}>{lang({ id: 'cancel_offer' })}</Button>
                ) : (
                    <></>
                )}


            </View>

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
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