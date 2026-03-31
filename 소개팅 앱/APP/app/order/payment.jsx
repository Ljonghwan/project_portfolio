import React, { useRef, useState, useEffect } from 'react';
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
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Filter from '@/components/Filter';
import Select from '@/components/Select';
import SelectLabel from '@/components/SelectLabel';

import OrderPayment from '@/components/list/OrderPayment';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser } from '@/libs/store';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';

const sorts = [
    {idx: 1, title: '최신순'},
    {idx: 2, title: '오래된순'},
]

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();

    const listRef = useRef(null);

    const [filter, setFilter] = useState(1); // 

    const [list, setList] = useState([]); // 
    const [viewList, setViewList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const viewables = useSharedValue([]);

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    useEffect(() => {

        const groups = Object.entries(
            list.reduce((acc, item) => {
                const date = item.createAt.slice(0, 10);
                (acc[date] = acc[date] || []).push(item);
                return acc;
            }, {})
        ).sort((a, b) => filter === 1 ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0]) )
        .flatMap(([date, items]) => [date, ...items]);

        setViewList(groups || []);

    }, [list, filter]);


    useEffect(() => {

        console.log('viewList', JSON.stringify(viewList?.map(x => x?.amount), null, 2));
       
    }, [viewList]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/assets/payHistory');

        let dataList = data || [];
        
        setList(dataList);
        // setList([{idx: 1}, {idx: 2}]);


        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        return (
            <OrderPayment item={item} dataFunc={dataFunc} />
        );
    };

    const header = {
        title: '결제 내역',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'wallet',
            style: {
                width: 28
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

                <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: rootStyle.side, paddingVertical: 10 }]}>
                    <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>전체 내역</Text>

                    <Select
                        // ref={(ref) => (inputRefs.current.type = ref)}
                        state={filter}
                        setState={(v) => {
                            setFilter(v);
                            listRef?.current?.scrollToOffset({ offset: 0, animated: true });
                        }}
                        list={sorts}
                        boxStyle={{ width: 80 }}
                        listStyle={{ paddingHorizontal: 0 }}
                        transformOrigin={'top center'}
                    >
                        <SelectLabel style={{ width: 80 }} title={sorts?.find(x => x?.idx === filter)?.title} placeHolder={'정렬'} />
                    </Select>
                </View>

                <FlashList
                    ref={listRef}
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

                    data={viewList}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}

                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} />
                    }

                />


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
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.greyD,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            height: 44
        },
        filterText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            width: 90
        }
    })

    return { styles }
}
