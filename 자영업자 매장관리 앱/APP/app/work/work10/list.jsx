import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { groupBy } from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

import Menu from '@/components/Item/Menu';

import Calendar from '@/components/Ui/Calendar';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, imageViewer } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
]

const payTypes = [
    { idx: '', title: '전체' },
    { idx: 1, title: '입금' },
    { idx: 2, title: '출금' },
]
export default function Page({ }) {

    const { sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [startDate, setStartDate] = useState(dayjs(sdate).format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs(edate).format('YYYY-MM-DD'));
    const [sort, setSort] = useState(1);
    const [payType, setPayType] = useState('');

    const [mode, setMode] = useState("list");

    const [total, setTotal] = useState(0); // 
    const [totalOut, setTotalOut] = useState(0); // 
    const [list, setList] = useState([]); // 

    const [noData, setNoData] = useState(false);
    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [startDate, endDate, payType, sort])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const sender = {
            startDate: startDate,
            endDate: endDate,
            type: payType,
            sort: sort
        }
        
        const { data, error } = await API.post('/v1/work10/list', sender);

        setNoData(data === 'empty');

        if(data !== 'empty') {
            setList(data || []);
            setTotal(data?.filter(x => x?.type === 1)?.reduce((acc, item) => acc + item?.amount, 0) || 0);
            setTotalOut(data?.filter(x => x?.type === 2 )?.reduce((acc, item) => acc + item?.amount, 0) || 0);
        }

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {

    }

    const handleDateChange = (dates) => {
        setStartDate(dates?.startDate);
        setEndDate(dates?.endDate);
    };

    const renderItem = ({ item, index }) => {

        return (
            <Pressable style={styles.item} onPress={() => {
                router.push({
                    pathname: routes.현금거래등록,
                    params: {
                        idx: item?.idx
                    }
                })
            }}>
                <View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <Text style={{...rootStyle.font(14, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.title}</Text>
                    <Text style={{...rootStyle.font(14, item?.type === 1 ? colors.text4A6CFC : colors.primary, fonts.semiBold)}}>{item?.type === 1 ? '+' : '-'}{numFormat(item?.amount)}원</Text>
                </View>
                
                <View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <Text style={{...rootStyle.font(12, colors.text757575, fonts.medium)}}>{dayjs(item?.date).format('YYYY.MM.DD')}</Text>
                    {item?.image && (
                        <TouchableOpacity onPress={() => {
                            imageViewer({ index: 0, list: [consts.s3Url + item?.image] });
                        }}>
                            <Image source={consts.s3Url + item?.image} style={{ width: 40, aspectRatio: 1, borderRadius: 10, backgroundColor: colors.placeholder }} />
                        </TouchableOpacity>
                    )}
                </View>
                {/* <Text>{item?.image}</Text> */}
            </Pressable>
        );
    };

    const header = {
        title: '현금 거래',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
            
            <View style={{ flex: 1 }}>
                {noData ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, paddingBottom: insets?.top + rootStyle.header.height + 100 }}>
                        <Image source={images.cash} style={rootStyle.cash} />

                        <View style={{ gap: 8 }}>
                            <Text style={{...rootStyle.font(20, colors.textPrimary, fonts.semiBold), textAlign: 'center', lineHeight: 32 }}>현금 거래를 기록해 주세요</Text>
                            <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium), textAlign: 'center', lineHeight: 24 }}>{`정확한 매출 관리와 세무 대비를 위해\n현금 거래 내역을 간단히 입력할 수 있어요.`}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <FlashList
                            data={list}
                            renderItem={renderItem}
                            numColumns={1}
                            refreshing={reload}
                            removeClippedSubviews
                            onRefresh={() => {
                                setReload(true);
                            }}
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                paddingTop: 10,
                                paddingBottom: insets?.bottom + 100,
                                flex: list?.length < 1 ? 1 : 'unset',
                            }}
                            keyboardDismissMode={'on-drag'}
                            keyboardShouldPersistTaps={"handled"}
                            nestedScrollEnabled={true}
                            decelerationRate={'normal'}
                            ListHeaderComponent={
                                <View style={{ gap: 20, marginBottom: 24 }}>
                                    <View style={{ paddingHorizontal: 36, paddingBottom: 20, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
                                        <View style={{ marginBottom: 36 }}>
                                            <DatePicker
                                                onDateChange={handleDateChange}
                                                initialStartDate={startDate}
                                                initialEndDate={endDate}
                                                max={31}
                                            >
                                                <DatePickerLabel
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onPrev={() => {
                                                        if (load) return;
                                                        setStartDate(dayjs(startDate).subtract(1, 'days').format('YYYY-MM-DD'))
                                                        setEndDate(dayjs(startDate).subtract(1, 'days').format('YYYY-MM-DD'))
                                                    }}
                                                    onNext={() => {
                                                        if (load) return;
                                                        setStartDate(dayjs(endDate).add(1, 'days').format('YYYY-MM-DD'))
                                                        setEndDate(dayjs(endDate).add(1, 'days').format('YYYY-MM-DD'))
                                                    }}
                                                />
                                            </DatePicker>
                                        </View>

                                        <View style={{ gap: 16 }}>
                                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                                <Text style={styles.label}>입금 합계</Text>
                                                <Text style={[styles.price, { color: colors.text4A6CFC }]}>{numFormat(total)}원</Text>
                                            </View>
                                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                                <Text style={styles.label}>출금/환불 합계</Text>
                                                <Text style={[styles.price, { color: colors.primary }]}>-{numFormat(totalOut)}원</Text>
                                            </View>
                                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                                <Text style={styles.label}>순현금(입금-출금)</Text>
                                                <Text style={[styles.price, { color: colors.header }]}>{numFormat(total - totalOut)}원</Text>
                                            </View>
                                        </View>
                                        
                                    </View>

                                    <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: rootStyle.side }]}>
                                        <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold) }}>일별 거래 내역</Text>
                                        <View style={[rootStyle.flex, { gap: 7 }]}>
                                            <Select
                                                state={payType}
                                                setState={setPayType}
                                                list={payTypes}
                                                style={rootStyle.default}
                                            >
                                                <Button type={4} icon={'down'} pointerEvents="none">{payTypes?.find(x => x?.idx === payType)?.title}</Button>
                                            </Select>
                                            <Select
                                                state={sort}
                                                setState={setSort}
                                                list={sorts}
                                                style={rootStyle.default}
                                            >
                                                <Button type={4} icon={'down'} pointerEvents="none">{sorts?.find(x => x?.idx === sort)?.title}</Button>
                                            </Select>
                                            
                                        </View>
                                    </View>
                                </View>

                            }
                            ListEmptyComponent={
                                <Empty msg={'거래 내역이 없습니다.'} style={{ paddingBottom: 0 }}  />
                            }
                        />
                    </View>
                )}

            </View>

            
            <Button bottom onPress={() => {
                router.push(routes.현금거래등록);
            }} >+ 현금 거래 입력하기</Button>

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        label: {
            color: colors.text757575,
            fontSize: 12,
            fontFamily: fonts.medium,
            lineHeight: 24
        },
        price: {
            color: colors.header,
            fontSize: 20,
            fontFamily: fonts.bold,
        },

        item: { 
            marginHorizontal: rootStyle.side,
            marginBottom: 7,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 17,
            paddingVertical: 24,
            gap: 13,
        }

    })

    return { styles }
}
