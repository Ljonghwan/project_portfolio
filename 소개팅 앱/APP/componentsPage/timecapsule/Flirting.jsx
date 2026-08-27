import { useEffect, useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming, FadeIn, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { numFormat, ToastMessage, } from '@/libs/utils';
import dayjs from 'dayjs';

const INITIAL_OFFSET = 300; // Non-sticky 헤더 높이
const STICKY_HEIGHT = 36; // Sticky 요소 높이

export default function Component({
    roomIdx,
    tabNewFunc=()=>{}
}) {

    const { configOptions } = useConfig();
    const insets = useSafeAreaInsets();

    const listRef = useRef(null);

    const [active, setActive] = useState(null);

    const [my, setMy] = useState(null);
    const [target, setTarger] = useState(null);

    const [totalFlirting, setTotalFlirting] = useState(0);
    const [todayFlirting, setTodayFlirting] = useState(0);

    const [data, setData] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [disabled, setDisabled] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침

    const [boxHeight, setBoxHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (roomIdx) dataFunc();
    }, [roomIdx])

    useEffect(() => {
        if (reload) {
            dataFunc(true);
        }
    }, [reload]);

    useEffect(() => {

        if(scrollPosition?.y > boxHeight) listRef?.current?.scrollTo({ y: 0 });

    }, [active])

    const dataFunc = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/flirting', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        tabNewFunc();
        
        setMy(data?.myInfo);
        setTarger(data?.targetUser);
        setTotalFlirting(data?.totalFlirting);
        setTodayFlirting(data?.todayFlirting)

        setData(data?.list || []);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }

    const onLayout = useCallback((event) => {

        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                console.log('x, y, width, height, pageX, pageY', { x, y, width, height, pageX, pageY });
                // setPosition({ x: scrennWidth - pageX - width, y: pageY });
                setBoxHeight(y + 8);
            },
        );

    }, []);

    const handleScroll = (event) => {
        const { x, y } = event.nativeEvent.contentOffset;
        setScrollPosition({ x, y }); // 현재 스크롤 위치 저장
    };

    return (
        <View style={styles.root}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}
            {/* <Text>{scrollPosition?.y } // {boxHeight}</Text> */}
            <ScrollView
                ref={listRef}
                style={{
                    flex: 1,
                }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: insets?.bottom + 20,
                }}
                refreshControl={
                    <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                }
                stickyHeaderIndices={[1]}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >

                <View style={styles.header} >
                    <Text style={styles.title}>플러팅</Text>

                    <View style={{ gap: 8 }}>
                        <Text style={styles.name}>
                            <Text style={[styles.name, { color: colors.dark, fontFamily: fonts.semiBold }]}>{my?.name}님</Text>
                            {`이 ${my?.level === 1 ? '이 소개팅에 사용한 플러팅' : '이 소개팅에서 받은 플러팅'}`}
                        </Text>
                        <View style={{ gap: 10 }}>
                            <View style={[styles.box]}>
                                <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                                    <Image source={images.flirting} style={[rootStyle.flirting, { width: 12 }]} />
                                    <Text style={styles.boxText}>누적 플러팅 갯수</Text>
                                </View>
                                <Text style={[styles.title, { fontSize: 22 }]}>{numFormat(totalFlirting)}개</Text>
                            </View>
                            <View style={[styles.box, { backgroundColor: colors.pupple }]}>
                                <View style={[rootStyle.flex, { flex: 1, gap: 10, justifyContent: 'flex-start' }]}>
                                    <Image source={images.flirting} style={[rootStyle.flirting, { width: 12 }]} />
                                    <Text style={[styles.boxText]} >{my?.level === 1 ? '오늘 전달 가능한 플러팅 갯수' : '오늘 전달 받을 수 있는 플러팅 갯수'}</Text>
                                </View>
                                <Text style={[styles.title, { fontSize: 22 }]}>{numFormat(todayFlirting)}개</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ marginVertical: 8 }} collapsable={false} onLayout={onLayout} >
                    <View style={[styles.filterBox]}>
                        {[null, 1, 2, 3, 4]?.map((x, i) => {
                            return (
                                <TouchableOpacity key={i} activeOpacity={0.7} style={[styles.filter, active === x && { backgroundColor: colors.grey6 }]} onPress={() => setActive(x)}>
                                    <Text style={[styles.filterText, active === x && { color: colors.white }]}>{x ? x + '일차' : '전체'}</Text>
                                </TouchableOpacity>
                            )

                        })}
                    </View>
                </View>

                <View >
                    {data?.filter(item => !active ? true : active === item?.useDay)?.map((item, index) => {
                        return (
                            <Animated.View entering={FadeInLeft} key={active + "_" + index} style={styles.list}>
                                <Image source={images.flirting_main} style={[rootStyle.flirting, { width: 12 }]} />

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>
                                        {target?.name} 님에게 플러팅을 <Text style={[styles.listTitle, { fontFamily: fonts.bold }]}>{numFormat(item?.count)}개</Text>를
                                        {
                                            my?.level === 2 ? (
                                                item?.status === 5 ? ' 다시 돌려줬어요.' : ' 받았어요.'
                                            ) :
                                                my?.level === 1 && (
                                                    item?.status === 5 ? ' 돌려 받았어요.' : ' 전달했어요.'
                                                )
                                        }
                                    </Text>
                                    {item?.roomMessage && <Text style={styles.listComment}>{item?.roomMessage}</Text>}
                                    <Text style={styles.day}>{dayjs(item?.createAt).format('YYYY.MM.DD')}</Text>
                                </View>

                            </Animated.View>
                        )
                    })}

                    {data?.filter(item => !active ? true : active === item?.useDay)?.length < 1 && (
                        <Empty msg={'내역이 없습니다.'} style={{ height: 200 }} />
                    )}
                </View>


                {/*                 
                <Animated.FlatList
                    indicatorStyle={'black'}
                    data={data?.filter(item => !active ? true : active === item?.dayCount)}
                    renderItem={renderItem}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: insets?.bottom + 20,
                        rowGap: 8
                    }}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                       
                    }
                    ListEmptyComponent={
                        <Empty msg={'러브미터가 없습니다.'} style={{ height: 400 }} />
                    }
                /> */}


            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    header: {
        gap: 20,
        paddingTop: 20
    },
    title: {
        color: colors.dark,
        fontSize: 20,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.5,
    },
    name: {
        color: colors.grey6,
        fontSize: 20,
        letterSpacing: -0.5,
    },
    box: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: colors.system
    },
    boxText: {
        color: colors.black,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
    },
    filterBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.white,
        paddingVertical: 12
    },
    filter: {
        flex: 1,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: colors.greyF1
    },
    filterText: {
        color: colors.grey6,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.35,
    },
    list: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.greyE,
        gap: 5,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    day: {
        color: colors.dark,
        fontSize: 14,
        lineHeight: 24,
        letterSpacing: -0.35,
    },
    listTitle: {
        color: colors.dark,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: fonts.medium,
        letterSpacing: -0.4,
    },
    listComment: {
        color: colors.dark,
        fontSize: 14,
        lineHeight: 24,
        letterSpacing: -0.35,
    },




});
