import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Platform, RefreshControl, TouchableOpacity, StyleSheet, useWindowDimensions, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

import { FlashList } from '@shopify/flash-list';
import _ from 'lodash';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Empty from '@/components/Empty';
import Select from '@/components/Select';
import SelectLabel from '@/components/SelectLabel';
import InputSearch from '@/components/InputSearch';
import InputComment from '@/components/InputComment';

import Carousel from '@/components/carousel/Carousel';
import Carousel2 from '@/components/carousel/Carousel2';
import Carousel3 from '@/components/carousel/Carousel3';
import StoryHorizontalList from '@/components/carousel/StoryHorizontalList';

import Feed from '@/components/list/Feed';

import { useEtc } from '@/libs/store';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import API from '@/libs/api';

import { ToastMessage, elapsedTime } from '@/libs/utils';

import fonts from '@/libs/fonts';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomTabHeight = useBottomTabBarHeight();
    const { width, height } = useSafeAreaFrame();

    const { goTop } = useEtc();

    const listRef = useRef(null);
    const filterRef = useRef(null);
    const tabRefs = useRef([]);
    const inputRef = useRef(null);

    const [layoutHeight, setLayoutHeight] = useState(0);

    const [list, setList] = useState([]);
    const [nextToken, setNextToken] = useState(null);

    const [eventList, setEventList] = useState([]);
    const [squareList, setSquareList] = useState([]);
    const [teamList, setTeamList] = useState([]);
    const [feedList, setFeedList] = useState([]);


    const [filter, setFilter] = useState(null); // 
    const [sort, setSort] = useState(1);
    const [stx, setStx] = useState('');

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);
    const [resetLoad, setResetLoad] = useState(false);

    // useFocusEffect(
    //     useCallback(() => {
    //         console.log('useFocusEffect');
    //         dataFunc();
    //     }, [])
    // );

    useEffect(() => {
        dataFunc(true);
    }, [])

    useEffect(() => {
        dataListFunc(true);
    }, [filter, sort, stx])

    useEffect(() => {

        if (reload) {
            dataFunc(true);
            dataListFunc(true);
        }

    }, [reload]);

    useEffect(() => {
        if (goTop) listRef?.current?.scrollTo({ y: 0, animated: true });
    }, [goTop])

    const dataFunc = async () => {

        const { data, error } = await API.post('/v1/main/square');

        // setTimeout(() => {
        //     setInitLoad(false);
        //     setLoad(false);
        //     setReload(false);
        // }, consts.apiDelay)

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        setEventList(data?.eventList || []);
        setSquareList(data?.squareList || []);
        setTeamList(_.chunk(data?.teamList, 3));
        setFeedList(data?.feedList || []);

    }


    const dataListFunc = async (reset = false) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);
        setResetLoad(reset);

        let sender = {
            type: filter,
            orderType: sort,
            searchText: stx,
            nextToken: reset ? null : nextToken
        }

        console.log('sender', sender, nextToken, !filter ? '/v1/feed/list' : '/v1/manager/list');

        const { data, error } = await API.post(!filter ? '/v1/feed/list' : '/v1/manager/list', sender);

        setNextToken(data?.nextToken || null);

        const fetchData = (!filter ? data?.list : data) || [];
        // const fetchData = (!filter ? data?.list : []) || [];

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setResetLoad(false);

        }, consts.apiDelay)
       
    }

    const renderItem = ({ item, index }) => {
        return (
            <Feed item={item} index={index} />
        )
    }

    const renderItemManager = ({ item, index }) => {
        return (
            <Feed item={item} index={index} type={'manager'}/>
        )
    }

    const renderLoad = () => {
        return (
            <Loading style={{ height: 500, backgroundColor: colors.white, paddingBottom: 200  }} color={colors.black} entering={false} />
        )
    }

    const handleFilterPress = (key, index) => {
        setFilter(key);
        // setSort(consts.orderOptions[0]?.idx);

        console.log(key, index);
        // 탭의 위치 측정
        tabRefs.current[index]?.measureLayout(
            filterRef.current,
            (x, y, width, height) => {
                // 탭을 중앙에 배치하도록 스크롤
                console.log('x - (width / 2),', x - (width / 2));
                filterRef.current?.scrollTo({
                    x: x - (width / 2),
                    animated: true
                });
            },
            () => { }
        );

    };

    const scrollToTop = () => {
        // listRef?.current?.scrollToIndex({ index: 0, viewOffset: -150, animated: true });
    }

    const header = {
        left: {
            icon: 'logo2',
            iconStyle: {
                width: 48,
                height: 48
            },
            onPress: () => {
                listRef?.current?.scrollTo(0)
            }
        },
        right: {
            bell: true
        }
    };


    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <FlashList
                ref={listRef}
                data={resetLoad ? [] : list}
                renderItem={({ item, index }) => {
                   if (item?.isFeed) {
                        return renderItem({ item, index })
                    } else {
                        return renderItemManager({ item, index })
                    }
                }}
                getItemType={(item) => {
                    // To achieve better performance, specify the type based on the item
                    return item?.isFeed ? "feed" : "manager";
                }}
                // overrideItemLayout={(layout, item) => {
                //     if (item === 'load') {
                //         layout.span = 2; // 전체 열 차지
                //     }
                // }}
                // keyExtractor={(item, index) => `${item?.isFeed ? 'feed_' : 'manager_'}${item?.idx}`}

                numColumns={2}
                style={{
                    flex: 1,
                }}
                contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: bottomTabHeight + insets?.bottom + 200,
                }}
                refreshing={reload}
                onRefresh={() => {
                    setReload(true);
                }}
                decelerationRate={'normal'}
                onEndReached={() => {
                    dataListFunc();
                }}
                onEndReachedThreshold={1}
                ListEmptyComponent={
                    <View style={{ height: 300 }}>
                        <Empty msg={'검색 결과가 없습니다.'} />
                    </View>
                }
                ListHeaderComponent={
                    <View style={{ marginBottom: 16 }}>
                        
                        {/* <Button onPress={() => router.navigate(routes.payment)}>결제 시작{width}</Button> */}
                        <View style={[styles.box, { gap: 14 }]}>
                            {/* 이벤트 배너 있을시 */}
                            {eventList?.length > 0 && (<Carousel pages={eventList} />)}

                            <View style={{ gap: 20 }}>
                                <View style={[rootStyle.flex, { paddingHorizontal: rootStyle.side, justifyContent: 'space-between' }]}>
                                    <Image source={images.index_story} style={rootStyle.index_story} />
                                </View>

                                <View style={{}}>
                                    <StoryHorizontalList
                                        data={squareList}
                                    />
                                </View>

                                <View style={{ gap: 16 }} >
                                    <Text style={{ ...rootStyle.font(22, colors.black, fonts.bold), paddingHorizontal: rootStyle.side }}>피드 스퀘어</Text>

                                    <ScrollView 
                                        ref={filterRef}
                                        style={{}}
                                        contentContainerStyle={{ 
                                            paddingHorizontal: rootStyle.side,
                                            gap: 6
                                        }}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                    >
                                        <TouchableOpacity ref={(ref) => (tabRefs.current[0] = ref)} style={[styles.filterItem, { backgroundColor: !filter ? colors.grey37 : colors.greyD }]} activeOpacity={0.7} onPress={() => handleFilterPress(null, 0)}>
                                            <Image source={images.index_filter_feed} style={rootStyle.default14} tintColor={!filter ? colors.white : colors.grey6}/>
                                            <Text style={[styles.filterText, { color: !filter ? colors.white : colors.grey6 }]}>피드</Text>
                                        </TouchableOpacity>
                                        {consts.manager?.filter(x => x?.value < 4)?.map((item, index) => (
                                            <TouchableOpacity key={index} ref={(ref) => (tabRefs.current[index + 1] = ref)} style={[styles.filterItem, { backgroundColor: filter === item?.value ? colors.grey37 : colors.greyD }]} activeOpacity={0.7} onPress={() => handleFilterPress(item?.value, index + 1)}>
                                                <Image source={item?.mark} style={rootStyle.default14} />
                                                <Text style={[styles.filterText, { color: filter === item?.value ? colors.white : colors.grey6 }]}>{item?.title}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 12, paddingHorizontal: rootStyle.side }]}>
                                        <Select
                                            // ref={(ref) => (inputRefs.current.type = ref)}
                                            state={sort}
                                            setState={(v) => {
                                                setSort(v);
                                                scrollToTop();
                                            }}
                                            list={consts.orderOptions}
                                            boxStyle={{ width: 80 }}
                                            listStyle={{ paddingHorizontal: 0 }}
                                            transformOrigin={'top center'}
                                        >
                                            <SelectLabel style={{ width: 80 }} title={consts.orderOptions?.find(x => x?.idx === sort)?.title} placeHolder={'정렬'} />
                                        </Select>

                                        <TouchableOpacity style={styles.searchInput} onPress={() => {
                                            inputRef.current?.focus();
                                        }}>
                                            <Text style={{...rootStyle.font(12, colors.grey6, fonts.regular), flex: 1 }}>{stx || '검색어를 입력해주세요.'}</Text>
                                            <Image source={images.search} style={rootStyle.default14} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* <View style={styles.titleBox}>
                                            <Text style={styles.title} numberOfLines={1}>이번 주에는 어떤 만남이 이루어졌을까요?</Text>
                                            <TouchableOpacity hitSlop={10} activeOpacity={0.7} onPress={() => { 
                                                router.navigate(routes.story);
                                                // router.navigate(routes.chatFinalVisual)
                                            }}>
                                                <Text style={styles.link}>{`더보기 >`}</Text>
                                            </TouchableOpacity>
                                        </View> */}

                                {/* <Carousel2 pages={squareList} /> */}
                            </View>
                        </View>

                        {resetLoad && (
                            <Loading style={{ height: 700, backgroundColor: colors.white, paddingBottom: 200  }} color={colors.black} entering={false} />
                        )}
                    </View>
                }
            />

            
            <InputSearch 
                iref={inputRef}
                placeholder='검색어를 입력해주세요.' 
                state={stx}
                setState={setStx}
            />



            {/* <TouchableOpacity style={styles.class} activeOpacity={0.7} onPress={() => setView(true)}>
                <LinearGradient
                    style={[ styles.classBox ]}
                    colors={colors?.rankGradient1}
                >
                    <Image source={images.logo2} style={rootStyle.logo2} />
                    <Text style={styles.classText}>클래스</Text>
                    
                </LinearGradient>
            </TouchableOpacity> */}

        </Layout>
    )
}


const useStyle = () => {

    const { width } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const bottomTabHeight = useBottomTabBarHeight();

    const styles = StyleSheet.create({
        filter: {
            backgroundColor: colors.white,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 48,
            borderRadius: 12,

            elevation: 4, // 안드로이드 그림자
            shadowColor: colors.black, // iOS 그림자
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            marginBottom: 16,
            paddingHorizontal: 10,
        },
        filterItem: {
            borderRadius: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 33,
            paddingHorizontal: 14,
            gap: 4,
            backgroundColor: colors.greyD,
        },
        filterText: {
            fontFamily: fonts.medium,
            fontSize: 14,
            color: colors.grey6,
            letterSpacing: -0.35,
        },
        searchInput: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: 10,
            height: 30,
            borderWidth: 0.5,
            borderColor: colors.grey6,
            flex: width <= 320 ? 1 : 0.7,
        },
    })

    return { styles }
}