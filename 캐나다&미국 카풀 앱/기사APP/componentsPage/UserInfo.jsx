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
    Pressable
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Rating } from '@kolking/react-native-rating';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';

import BarGraph from '@/components/BarGraph';
import BarGraph2 from '@/components/BarGraph2';

import Review from '@/components/Item/Review';

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

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, login, logout } = useUser();
    const { badges } = useConfig();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const [rating, setRating] = useState(4.6);
    const [treeBadge, setTreeBadge] = useState(null);
    const [tagSum, setTagSum] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useEffect(() => {
        setTreeBadge(getTreeBadge({ badges: badges, userBadges: item?.badges }));
        setTagSum(Object.values(item?.tagData || {}).reduce((sum, value) => sum + value, 0));
    }, [item])

    const handleChange = useCallback(
        (value) => setRating(Math.round((value) * 5) / 5),
        [rating],
    );

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
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 20,
                    paddingHorizontal: rootStyle.side,
                }}
            >
                {/* <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), marginBottom: 15 }}>{lang({ id: 'posted' })} : {dayjs(item?.createAt).format('MMMM DD, YYYY, h:mm A')}</Text> */}

                <View style={{ gap: 15 }}>
                    <View style={{ gap: 10 }}>
                        {item?.badges?.filter(x => badges?.filter(xx => xx?.type !== 1)?.map(xx => xx?.idx+"")?.includes(x) )?.map((x, i) => {
                            let badge = badges?.find(xx => xx?.idx == x);
                            return (
                                <View key={i} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 3 }]}>
                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 3 }]}>
                                        <Image source={consts.s3Url + badge?.imgPath} style={{ width: 24, height: 24 }} />
                                        <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium) }}>{lang({ id: badge?.title })}</Text>
                                    </View>
                                </View>
                            )
                        })}
                        {treeBadge && (
                            <View style={styles.tree}>
                                <Image source={consts.s3Url + treeBadge?.imgPath} style={{ width: 51, height: 51 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), lineHeight: 22 }}>{lang({ id: 'badge' })}</Text>
                                    <Text numberOfLines={2} style={{ ...rootStyle.font(18, colors.main, fonts.semiBold), flexShrink: 1 }}>{lang({ id: treeBadge?.title })}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={consts.s3Url + item?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />

                        <View style={[{ flex: 1, gap: 2 }]}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.firstName} {item?.lastName}</Text>
                            </View>

                            {item?.reviewCount || item?.rideCount ? (
                                <View style={[rootStyle.flex, { alignItems: 'center', justifyContent: 'flex-start', gap: 2 }]}>

                                    <Image source={images.star_red} style={rootStyle.default16} />
                                    <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.text_popup), lineHeight: 22 }}>{item?.avgRate || 0}</Text>
                                    <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>({item?.reviewCount || 0})</Text>

                                    {item?.activeType === 'driver' && <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>{item?.rideCount || 0} {lang({ id: 'rides' })}</Text>}
                                </View>
                            ) : (
                                <Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>{lang({ id: 'no_ratings' })}</Text>
                            )}

                        </View>
                    </View>

                    <View style={[rootStyle.flex, { justifyContent: 'space-between', marginVertical: 5 }]}>
                        <View style={styles.starBox}>
                            <Text style={{ ...rootStyle.font(30, colors.main, fonts.extraBold), textAlign: 'center' }}>{item?.avgRate ? item?.avgRate?.toFixed(1) : '0'}</Text>
                            <Rating
                                size={width < 330 ? 16 : 22}
                                rating={item?.avgRate}
                                disabled={true}
                                onChange={handleChange}
                                baseColor={colors.sub_3}
                                fillColor={colors.taseta_sub_4}
                                touchColor={colors.taseta_sub_4}
                            />
                        </View>
                        <View style={{ flex: 1, gap: 8 }}>
                            {item?.rateData?.map((x, i) => {
                                return (
                                    <View key={'score' + i} style={[rootStyle.flex, { justifyContent: 'center', gap: 8 }]}>
                                        <Text style={{ ...rootStyle.font(10, colors.sub_1, fonts.medium), textAlign: 'right', width: 45 }}>{lang({ id: `score_${5 - i}` })}</Text>
                                        <View style={[rootStyle.flex, { justifyContent: 'center', flex: 1 }]}>
                                            <BarGraph value={x / 100} delay={i * 100} />

                                            <Text style={{ ...rootStyle.font(10, colors.sub_1, fonts.medium), textAlign: 'right', width: 28 }}>{Math.round(x)}%</Text>
                                        </View>
                                    </View>
                                )
                            })}

                        </View>
                    </View>

                    <View style={{ gap: 10 }}>
                        <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), marginBottom: 6 }}>{lang({ id: 'what_i_liked' })}</Text>
                        {Object.entries(item?.tagData || {})?.filter(([key, value], i) => value > 0)?.map(([key, value], i) => {
                            return (
                                <BarGraph2 key={'tag' + i} delay={i * 100} total={tagSum} value={value} title={lang({ id: key })} />
                            )
                        })}
                    </View>

                    {item?.reviews?.length > 0 ? (
                        <View style={{ gap: 20, borderTopColor: colors.sub_2, borderTopWidth: 1, paddingTop: 25, marginTop: 10 }}>
                            {item?.reviews?.map((x, i) => {
                                return (
                                    <Review key={i} item={x} />
                                )
                            })}
                            <Pressable style={[rootStyle.flex, { justifyContent: 'center', paddingVertical: 3 }]} onPress={() => {
                                router.push({
                                    pathname: routes.reviews,
                                    params: {
                                        idx: item?.idx
                                    }
                                })
                            }}>
                                <Image source={images.plus} style={rootStyle.default} />
                                <Text style={{ ...rootStyle.font(16, colors.taseta, fonts.semiBold) }}>{lang({ id: 'read_more' })}</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Empty image={false} style={{ height: 300 }} msg={lang({ id: 'no_ratings' })} />
                    )}

                    {/* <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                        <Image source={images.pointer} style={rootStyle.default} />
                        <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>2.8 km of you</Text>
                    </View> */}
                </View>



            </ScrollView>



        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        tree: {
            paddingHorizontal: 22,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 

            flexDirection: 'row',
            alignItems: 'center',
            gap: 5
        },
        starBox: {
            gap: 28,
            borderRightColor: colors.sub_2,
            borderRightWidth: 1,
            paddingRight: 13,
            paddingVertical: 8.5,
            marginRight: 13,
        }
    })

    return { styles }
}
