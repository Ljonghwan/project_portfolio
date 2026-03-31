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
    useWindowDimensions,
    ActivityIndicator,
    Pressable,
    Keyboard
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import _ from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';


import SelectLabel from '@/components/Ui/SelectLabel';
import Calendar from '@/components/Ui/Calendar';
import MonthPicker from '@/components/Ui/MonthPicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';
import SalesChart from '@/components/Ui/SalesChart';
import TableRow from '@/components/Ui/TableRow';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, getMonthList, getYearList } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]
export default function Page({ }) {


    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [startDate, setStartDate] = useState(dayjs().startOf('months').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().endOf('months').format('YYYY-MM-DD'));
    const [selected, setSelected] = useState(dayjs().startOf('year').format('YYYY'));

    
    const [chart, setChart] = useState([]);

    const [total, setTotal] = useState(0); // 
    const [expenseTotal, setExpenseTotal] = useState(0); // 
    const [expenseList, setExpenseList] = useState([]); // 
    const [staffList, setStaffList] = useState([]); // 
    const [staffDaily, setStaffDaily] = useState([]); // 

    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [loadChart, setLoadChart] = useState(false); // 차트 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useFocusEffect(
        useCallback(() => {
            dataFuncChart(true);
        }, [selected])
    );

    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [startDate, endDate])
    );

   

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);


    const dataFunc = async (reset) => {

        if (load) return;

        if(!initLoad) openLoader();
        setLoad(true);

        const sender = {
            startDate: startDate,
            endDate: endDate
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/accountBook/list', sender);

        setTotal(data?.total || 0);
        setExpenseTotal(data?.expenseTotal || 0);
        setStaffList(data?.staffList || []);

        const staffDailyList = _(data?.staffDaily).groupBy(item => `${item?.name}_${item?.hp}`).map((items) => ({
            ...items[0],
            count: items.length,
            total: items.reduce((acc, item) => acc + item?.pay_calc, 0),
        })).value();

        setStaffDaily(staffDailyList || []);   

        setExpenseList(data?.expenseList || []);

        // setChart(chart);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            closeLoader();

        }, consts.apiDelay)
    }

    const dataFuncChart = async (reset) => {

        if (loadChart) return;

        setLoadChart(true);

        const sender = {
            year: selected
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/accountBook/chart', sender);
        console.log('datdataFuncCharta', data);
        setChart(data || []);

        setTimeout(() => {
            setLoadChart(false);
        }, consts.apiDelay)
    }

    const handleDateChange = (date) => {

        setStartDate(dayjs(date).startOf('months').format('YYYY-MM-DD'))
        setEndDate(dayjs(date).endOf('months').format('YYYY-MM-DD'))
    };

    const header = {
        title: '장부',
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 40 }}>

                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

                <View style={{ paddingHorizontal: 36, paddingBottom: 30, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
                    <View style={{ marginBottom: 27 }}>
                        <MonthPicker
                            state={startDate}
                            setState={handleDateChange}
                        >
                            <DatePickerLabel
                                format={'YYYY년 M월'}
                                range={false}
                                startDate={startDate}
                                endDate={endDate}
                                onPrev={() => {
                                    if (load) return;
                                    handleDateChange(dayjs(startDate).subtract(1, 'months'));
                                }}
                                onNext={() => {
                                    if (load) return;

                                    const nextMonth = dayjs(startDate).add(1, 'months');
                                    const twoMonthsLater = dayjs().add(3, 'month');

                                    // 다다다음 달 이상이면 이동 불가
                                    if (nextMonth.isAfter(twoMonthsLater, 'month') || nextMonth.isSame(twoMonthsLater, 'month')) {
                                        ToastMessage('더 이상 이동할 수 없어요');
                                        return;
                                    }

                                    handleDateChange(nextMonth);
                                }}
                            />
                        </MonthPicker>
                    </View>

                    <View style={{ marginBottom: 21, gap: 8, alignItems: 'center' }}>
                        <Text style={styles.label}>이번 달 총 매출</Text>
                        <Text style={styles.price}>{numFormat(total)}원</Text>
                        <Text style={styles.label2}>{dayjs(startDate).format('M월 D일')} ~ {dayjs(endDate).format('M월 D일')} 기준</Text>
                    </View>

                    <View style={{ marginBottom: 27, gap: 5, paddingBottom: 26, borderBottomWidth: 1, borderBottomColor: colors.f6f6f6 }}>
                        {/* <View style={styles.box}>
                            <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium) }}>이번 달 총 매출</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>{numFormat(total)}원</Text>
                        </View> */}
                        <View style={styles.box}>
                            <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium) }}>총 지출</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>{numFormat(expenseTotal)}원</Text>
                        </View>
                    </View>

                    <View>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>월별 매출 현황</Text>
                            
                            <Select
                                state={selected}
                                setState={setSelected}
                                list={getYearList()}
                            >
                                <Button type={4} icon={'down'} pointerEvents="none">{selected || '년도 선택'}</Button>
                            </Select>   
                           
                        </View>

                        <View>
                            {loadChart && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.dimWhite2 }} fixed />)}
                            <SalesChart data={chart} type={'month'} />
                        </View>
                    </View>
                </View>

                <View style={{ paddingVertical: 20, gap: 26 }}>

                    <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: 36 }]}>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold) }}>상세 내역</Text>
                    </View>
                    
                    <View>
                        <TableRow labels={['구분', '항목명', '금액']} />
                        {expenseList?.map((x, i) => {
                            return (
                                <TableRow key={i} type={2} labels={[i === 0 ? '지출' : '', x?.title, numFormat(x?.amount) + '원']} />
                            )
                        })}
                        {staffList?.filter(x => x?.work_day_count > 0)?.map((x, i) => {
                            return (
                                <TableRow key={i} type={2} labels={[i === 0 ? '고정 직원' : '', x?.name, numFormat(x?.pay_type === 1 ? x?.pay_calc * x?.work_day_count : x?.pay) + '원']} />
                            )
                        })}
                        {staffDaily?.map((x, i) => {
                            return (
                                <TableRow key={i} type={2} labels={[i === 0 ? '일용직' : '', x?.name, numFormat(x?.pay_calc) + '원']} />
                            )
                        })}

                        <TableRow type={3} style={{ borderTopWidth: 1, borderTopColor: colors.f6f6f6 }} labels={['매출', '총 매출', numFormat(total) + '원']} />
                    </View>
                </View>

            </ScrollView>

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        label: {
            color: colors.text757575,
            fontSize: 14,
            fontFamily: fonts.medium,
            lineHeight: 16
        },
        label2: {
            color: colors.textA6A6A6,
            fontSize: 10,
            fontFamily: fonts.medium,
            lineHeight: 16
        },
        price: {
            color: colors.header,
            fontSize: 24,
            fontFamily: fonts.bold,
        },
        box: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: colors.fafafa
        }

    })

    return { styles }
}
