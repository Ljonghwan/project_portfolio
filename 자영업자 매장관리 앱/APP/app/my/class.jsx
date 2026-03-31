import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { setStatusBarStyle } from 'expo-status-bar';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';


import Layout from '@/components/Layout';

import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Profile from '@/components/Profile';

import BarGraph from '@/components/Ui/BarGraph';
import Tag from '@/components/Ui/Tag';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat, hpHypen, numFormat } from '@/libs/utils';

import { useUser, useStore, useConfig, useEtc, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout } = useUser();
    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { appActiveStatus } = useEtc();

    const { configOptions } = useConfig();

    const badgeListRef = useRef(null);

    const [myClass, setMyClass] = useState(null);
    const [nextClass, setNextClass] = useState(null);

    const [total, setTotal] = useState(0);

    const [badgeList, setBadgeList] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [mode, setMode] = useState('badge');

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle("light", true);
            badgeFunc();
            dataFunc();

            return () => {
                setStatusBarStyle('dark', true);
            }
        }, [])
    );

    useEffect(() => {



    }, []);

    const dataFunc = async () => {

        const sender = {
            startDate: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
            endDate: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
            all: true,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/list', sender);

        setMyClass(configOptions?.class?.find(x => x?.idx === mbData?.class));
        setNextClass(configOptions?.class?.find(x => x?.idx === mbData?.class + 1) || null);
        setTotal(data?.list?.reduce((acc, item) => acc + item?.total, 0) || 0);

        setTimeout(() => {

            setInitLoad(false);

        }, consts.apiDelay)

    }

    const badgeFunc = async () => {

        const { data, error } = await API.post('/v1/my/badgeList');

        setBadgeList(data || []);
    }

    const submitFunc = async () => {

        setLoad(true);

        const sender = {
            type: 'badge',
            badge: selectedBadge
        }
        const { data, error } = await API.post('/v1/my/updateInfo', sender);

        setTimeout(() => {
            setLoad(false);
            setMode('badge');

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            badgeFunc();
            reload();
            ToastMessage("대표 뱃지가 설정되었습니다.");
            badgeListRef?.current?.scrollToOffset({ offset: 0, animated: true });
            setSelectedBadge(null);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        const badge = configOptions?.badges?.find(x => x?.idx === item?.badge_idx);

        return (
            <TouchableOpacity activeOpacity={0.7} style={{ gap: 11, width: 110, height: 180 }} onPress={() => { setSelectedBadge(badge?.idx) }}>
                <View style={{ width: 80, aspectRatio: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                    <Image source={consts.s3Url + badge?.image} style={{ width: '100%', aspectRatio: 1 }} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                    <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium), lineHeight: 16 }}>{dayjs(item?.createdAt).format('YYYY.MM.DD')}</Text>
                    <Text style={{ ...rootStyle.font(14, colors.header, fonts.bold) }} numberOfLines={1}>{badge?.label}</Text>

                    {mode === 'select' ? (
                        <View style={{ marginTop: 2 }}>
                            <Image source={selectedBadge === badge?.idx ? images.radio_on : images.radio_off} style={[rootStyle.default]} transition={100} />
                        </View>
                    ) : (
                        item?.isMain && <Tag type={'badge'} tag={'대표 뱃지'} style={{ paddingHorizontal: 12, marginTop: 2 }} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const header = {
        left: {
            icon: 'back_white',
            onPress: () => router.back()
        },
        title: '나의 등급',
        titleStyle: {
            color: colors.white
        }
    };

    return (
        <Layout header={header} backgroundColor={colors.text363B3A}>

            {initLoad && (<Loading entering={false} color={colors.white} style={{ backgroundColor: colors.text363B3A }} fixed />)}

            <View style={{ flex: 1, }}>
                <ScrollView
                    style={{ flex: 1, backgroundColor: colors.white }}
                    contentContainerStyle={{}}
                >
                    <View style={{ backgroundColor: colors.text363B3A, height: height, position: 'absolute', top: -height, left: 0, right: 0 }} />

                    <View style={{ gap: 15, justifyContent: 'center', alignItems: 'center', paddingTop: 20, paddingBottom: 40, backgroundColor: colors.text363B3A }}>
                        <Text style={{ ...rootStyle.font(16, colors.white, fonts.medium) }}>{mbData?.nickname} 님의 {dayjs().format('M')}월 등급</Text>
                        <Text style={{ ...rootStyle.font(24, colors.white, fonts.bold) }}>{myClass?.label}</Text>
                        <Image source={consts.s3Url + myClass?.image} style={{ width: 200, aspectRatio: 1 }} contentFit='contain' />
                    </View>

                    <View style={{ backgroundColor: colors.white, paddingTop: 22, paddingBottom: insets?.bottom + 20 }}>
                        <View style={{ paddingHorizontal: 27, marginBottom: 50 }}>
                            <View style={[rootStyle.flex, { height: 46, justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>내 현황</Text>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                    router.push(routes.myClassInfo)
                                }}>
                                    <Text style={{ ...rootStyle.font(14, colors.primaryBright, fonts.semiBold) }}>등급 안내</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium) }}>
                                {dayjs().subtract(1, 'months').startOf('month').format('M월 D일')} ~ {dayjs().subtract(1, 'months').endOf('month').format('M월 D일')}까지 현황
                            </Text>

                            <View style={{ marginTop: 25, gap: 10 }}>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium) }}>총 매출금액</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>{numFormat(total)}원</Text>
                                </View>

                                <BarGraph value={initLoad ? 0 : !nextClass ? 1 : Math.min(1, (total / nextClass?.min))} />
                            </View>
                        </View>

                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: 27, marginBottom: 21 }]}>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>나의 뱃지</Text>

                            <TouchableOpacity activeOpacity={0.7} hitSlop={10} onPress={() => {
                                if(mode === 'select') {
                                    setMode('badge');
                                    setSelectedBadge(null);
                                } else {
                                    router.push(routes.myBadgeInfo)
                                }
                            }}>
                                <Text style={{ ...rootStyle.font(14, colors.primaryBright, fonts.semiBold) }}>{mode === 'select' ? '취소' : '뱃지 안내'}</Text>
                            </TouchableOpacity>
                        </View>

                        {badgeList?.length > 0 ? (
                            <FlatList
                                ref={badgeListRef}
                                data={badgeList}
                                renderItem={renderItem}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled={false}
                                contentContainerStyle={{
                                    paddingHorizontal: 27,
                                    gap: 10
                                }}
                            />
                        ) : (
                            <Empty msg={'나의 뱃지가 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                        )}


                        <View style={{ paddingHorizontal: 27, marginTop: 32 }}>
                            {mode === 'select' ? (
                                <Button load={load} disabled={!selectedBadge} onPress={submitFunc}>설정 완료</Button>
                            ) : (
                                <Button load={load} disabled={badgeList?.length < 1} onPress={() => {
                                    setSelectedBadge(mbData?.badge);
                                    setMode('select');
                                }}>대표 뱃지 설정</Button>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>


        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({


    })

    return { styles }
}