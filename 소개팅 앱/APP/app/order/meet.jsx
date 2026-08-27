import React, { useRef, useState, useEffect } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Pressable
} from 'react-native';

import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import dayjs from "dayjs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/EmptyKeboardAvoid';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Filter from '@/components/Filter';
import Input from '@/components/Input';
import DatePicker from '@/components/DatePicker';

import OrderMeet from '@/components/list/OrderMeet';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser } from '@/libs/store';

import { ToastMessage, useDebounce } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();

    const searchRef = useRef(null);
    const listRef = useRef(null);

    const [filter, setFilter] = useState(null); // 

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);
    const [search, setSearch] = useState('');

    const [viewList, setViewList] = useState([]); // 

    const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [activeDays, setActiveDays] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {

        dataFunc(true);

    }, [filter]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    useEffect(() => {

        const groups = Object.entries(
            list?.filter(item => item?.name?.includes(debouncedSearch))?.reduce((acc, item) => {
                const date = item?.lastAt?.slice(0, 10);
                (acc[date] = acc[date] || []).push(item);
                return acc;
            }, {})
        )
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .flatMap(([date, items]) => [date, ...items]);

        setViewList(groups || []);
        setActiveDays(groups?.filter(item => typeof item === "string") || []);
        
    }, [list, debouncedSearch]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/user/meetHistory');


        // let testArr = [...Array(50)]?.map((x, i) => { return { 
        //     ...data?.[0],
        //     idx: i, 
        // }})

        let dataList = data || [];
      
        setList(dataList?.map(item => {
            return {
                ...item,
                name: item?.status === 9 ? '탈퇴회원' : item?.status === 8 ? '정지회원' : item?.name
            }
        }));

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const renderItem = ({ item, index }) => {

        return (
            <OrderMeet item={item} />
        );
    };

    const handleDateChange = (dates) => {
        setStartDate(dates?.startDate);
        setEndDate(dates?.endDate);

        const index = viewList?.findIndex(x => x === dates?.startDate);
        if (index !== -1) {
            listRef?.current?.scrollToIndex({ index: index, animated: true });
        }
    };


    const header = {
        title: '소개팅 내역',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'meeting_history',
            style: {
                width: 30,
            }
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>

                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <View style={[rootStyle.flex, { paddingHorizontal: rootStyle.side, paddingVertical: 10, gap: 8 }]}>
                    <View style={[{ flex: 1 }]}>
                        <Input 
                            iref={searchRef}
                            placeholder={width <= 320 ? '상대의 이름을 검색해주세요.' : '소개팅 상대의 이름을 검색해주세요.'}
                            state={search}
                            setState={setSearch}
                            inputWrapStyle={{ height: 44, borderRadius: 12 }}
                            inputStyle={{ fontSize: 14 }}
                            placeholderTextColor={colors.grey6}
                            iconComponent={
                                <TouchableOpacity onPress={() => {
                                    if(search) {
                                        setSearch('');
                                    }
                                }}>
                                    <Image source={search ? images.close : images.search} style={rootStyle.default} transition={100}/>
                                </TouchableOpacity>
                                
                            }
                        />
                    </View>

                    <DatePicker
                        onDateChange={handleDateChange}
                        initialStartDate={startDate}
                        initialEndDate={endDate}
                        mode='pick'
                        activeDays={activeDays}
                        top={12}
                        right={rootStyle.side}
                        transformOrigin='top right'
                    >
                        <View style={styles.filter}>
                            <Image source={images.calendar2} style={rootStyle.default} transition={100}/>
                        </View>
                    </DatePicker>
                    
                    
                </View>

                <FlashList
                    ref={listRef}
                    data={viewList}
                    renderItem={({ item }) => {
                        if (typeof item === "string") {
                            // Rendering header
                            return (
                                <View style={[rootStyle.flex, { height: 40, paddingHorizontal: rootStyle.side, justifyContent: 'space-between', backgroundColor: colors.white }]}>
                                    <Text style={[rootStyle.font(14, colors.text_info, fonts.regular)]}>{item}</Text>
                                </View>
                            );
                        } else {
                            // Render item
                            return renderItem({ item })
                        }
                    }}
                    getItemType={(item) => {
                        // To achieve better performance, specify the type based on the item
                        return typeof item === "string" ? "sectionHeader" : "row";
                    }}
                    stickyHeaderIndices={viewList?.map((item, index) => (typeof item === "string" ? index : null)).filter((index) => index !== null)}

                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 10,
                        paddingBottom: insets?.bottom + 20,
                        flex: viewList?.length < 1 ? 1 : 'unset'
                    }}
                    ListHeaderComponent={
                        <View style={{ paddingHorizontal: rootStyle.side, marginBottom: 8 }}>
                            <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>전체 내역</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{  }} keyboardVerticalOffset={200}/>
                    }
                />
                
{/* 
                <FlatList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    keyExtractor={(item) => item?.idx}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        rowGap: 8,
                        paddingHorizontal: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}

                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} />
                    }
                    onViewableItemsChanged={onViewableItemsChanged}


                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                /> */}


            </View>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: colors.main
        },
        top: {
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.greyD,
            paddingVertical: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
        },
        flirtingBox: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.main,
            width: 32,
            aspectRatio: 1/1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        topTitle: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.grey6
        },
        topCount: {
            fontSize: 20,
            fontFamily: fonts.medium,
            color: colors.dark
        },
        bottom: {
            alignSelf: 'flex-end'
        },
        filter: {
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyC,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            height: 44
        },
    })

    return { styles }
}
