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
import Button from '@/components/Button';
import Text from '@/components/Text';
import Tag from '@/components/Tag';
import Map from '@/components/Map';
import Empty from '@/components/Empty';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import CancelPost from '@/components/Popup/CancelPost';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat, numDoler, getDday, nameMasking, getTreeBadge } from '@/libs/utils';

import { useAlert, useEtc, useUser, useConfig } from '@/libs/store';

function ListItem({ item, index }) {

    const { styles } = useStyle();
    const { mbData } = useUser();

    const [boxHeight, setBoxHeight] = useState(0);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    return (
        <View style={{ gap: 10 }}>
            <View style={[rootStyle.flex, { alignItems: 'flex-start', justifyContent: 'flex-start', gap: 15 }]}>
                <Image source={consts.s3Url + item?.user?.profile} style={{ width: '20%', aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                <View style={[{ flex: 1, gap: 7 }]}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                        {mbData?.idx !== item?.userIdx ? (
                            <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.user?.firstName} {item?.user?.lastName} / {lang({ id: consts.genderOptions?.find(x => x?.idx === item?.user?.gender)?.title })}</Text>
                            // <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{nameMasking(item?.user?.firstName + " " + item?.user?.lastName)} / {lang({ id: consts.genderOptions?.find(x => x?.idx === item?.user?.gender)?.title })}</Text>
                        ) : (
                            <Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.user?.firstName} {item?.user?.lastName} / {lang({ id: consts.genderOptions?.find(x => x?.idx === item?.user?.gender)?.title })}</Text>
                        )}

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
            </View>

        </View>
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
    const [myJoinInfo, setMyJoinInfo] = useState(null);
    const [confirmList, setConfirmList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [boxHeight, setBoxHeight] = useState(0);

    useEffect(() => {

        setStatus((item?.status === 1 && (item?.seats - item?.joinCount) > 0));
        setTreeBadge( getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }) );

        let myInfo = item?.joins?.find(x => x?.userIdx === mbData?.idx);
        console.log('myInfo', myInfo);
        setMyJoinInfo(myInfo ? { ...myInfo, start: item?.itinerary?.find(x => x?.idx === myInfo?.startIdx), end: item?.itinerary?.find(x => x?.idx === myInfo?.endIdx) } : null);
        setConfirmList(
            item?.joins?.filter(x => x?.status === 2)?.map(x => {
                return { ...x, start: item?.itinerary?.find(xx => xx?.idx === x?.startIdx), end: item?.itinerary?.find(xx => xx?.idx === x?.endIdx) }
            }) || []
        );

    }, [item]);

    const renderItem = ({ item, index }) => {
        return (
            <ListItem item={item} />
        )
    }

    const onCancelAlert = () => {
        openAlertFunc({
            component: <CancelPost idx={item?.idx} status={myJoinInfo?.status} onPress={onCancelFunc} />
        })
    };

    const onCancelFunc = async (v) => {
        console.log('reason', v);
        // 탑승자가 신청 취소하는 API
        let sender = {
            postIdx: item?.idx,
            desc: v
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/passenger/post/joinCancel', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        } else {
            ToastMessage(lang({ id: 'your_application_has_been_canceled' }));
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
                {!myJoinInfo ? (
                    <Empty image='find_passenger' msg={lang({ id: 'no_application' })}/>
                ) : (
                    <FlatList
                        data={myJoinInfo?.status === 2 ? confirmList : []}
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
                            gap: 20
                        }}
                        ListHeaderComponent={
                            <View style={{ gap: 20 }}>
                                {myJoinInfo && (
                                    <View style={{ gap: 20 }}>
                                        <View style={{ gap: 6 }}>
                                            {myJoinInfo?.status === 1 ? (
                                                <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}>{lang({ id: 'pending_approval' })}</Text>
                                            ) : myJoinInfo?.status === 2 ? (
                                                <>
                                                    <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}>{lang({ id: 'approval' })}</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text style={{ ...rootStyle.font(18, colors.text_popup, fonts.semiBold) }}>{lang({ id: (myJoinInfo?.status === 4 || myJoinInfo?.status === 6) ? 'cancel' : 'decline' })}</Text>
                                                    <Text style={{ ...rootStyle.font(14, colors.text_popup, fonts.medium) }}>{lang({ id: 'reason' })} : {lang({ id: myJoinInfo?.cancelDesc })}</Text>
                                                </>
                                            )}
                                        </View>
                                        
                                        <ListItem item={myJoinInfo} />
                                        {/* {myJoinInfo?.status < 3 && ( <Button style={{ flex: 1 }} type={10} onPress={onCancelAlert}>{lang({ id: 'cancel' })}</Button> )} */}
                                    </View>
                                )}
                                {myJoinInfo?.status === 2 && <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{lang({ id: 'confirmed' })} {confirmList?.length}/{item?.seats}</Text>}
                            </View>
                        }
                        ListEmptyComponent={
                            myJoinInfo?.status === 2 && <Empty style={{ height: 300 }} msg={lang({ id: 'no_approved_passengers' })} />
                        }
                        removeClippedSubviews
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                )}
                
            </View>

            {(item?.isJoin && item?.status < 3) && (
                <Button bottom load={load} onPress={onCancelAlert}>{lang({ id: 'cancel_request' })}</Button>
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

    })

    return { styles }
}
