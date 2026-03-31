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
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { throttle } from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';

import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

import SalesDay from '@/components/Item/SalesDay';

import Calendar from '@/components/Ui/Calendar';
import MonthPicker from '@/components/Ui/MonthPicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import Memo from '@/components/Popup/Memo';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, getMonthList } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]
export default function Page({ }) {


    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, heigth } = useSafeAreaFrame();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);
    const scRef = useRef();

    const [startDate, setStartDate] = useState(dayjs().startOf('months').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().endOf('months').format('YYYY-MM-DD'));
    const [selected, setSelected] = useState(null);

    const [total, setTotal] = useState(0); // 
    const [total2, setTotal2] = useState(0); //
    const [count, setCount] = useState(0); //
    const [cashCount, setCashCount] = useState(0); //

    const [list, setList] = useState([]); // 
    const [item, setItem] = useState(null);
    const [memo, setMemo] = useState(null);

    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


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

    useEffect(() => {

        if (selected) {
            getMemo();
            scRef.current?.scrollToEnd({
                animated: true
            });
        }

    }, [selected]);

    useEffect(() => {

        setItem(list?.find(x => x?.date === selected));

    }, [list, selected]);

    const dataFunc = async (reset) => {
        if (load) return;

        setLoad(true);
        setSelected(null);
        if(!initLoad) openLoader();

        const sender = {
            startDate: startDate,
            endDate: endDate,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/calendar', sender);

        setTotal(data?.list?.reduce((acc, item) => acc + item?.total, 0) || 0);
        setTotal2(data?.list?.reduce((acc, item) => acc + item?.total2, 0) || 0);
        setList(data?.list || []);

        setCount(data?.count || 0);
        setCashCount(data?.cashCount || 0);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            closeLoader();

        }, consts.apiDelay)
    }

    const getMemo = async () => {

        const sender = {
            date: selected
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/memo', sender);

        setMemo(data);
    }


    const handleDateChange = (date) => {

        setStartDate(dayjs(date).startOf('months').format('YYYY-MM-DD'))
        setEndDate(dayjs(date).endOf('months').format('YYYY-MM-DD'))
    };

    const memoEdit = () => {
        sheetRef.current?.present();
    };

    const sheetClose = () => {
        sheetRef.current?.dismiss();
    };

    const onDeleteAlert = () => {
        Keyboard.dismiss();
        sheetRef.current?.present();

        openAlertFunc({
            label: '삭제하시겠어요?',
            title: `삭제한 정보는 복구할 수 없습니다.\n정말 삭제하시겠어요?`,
            onCencleText: '취소',
            onPressText: '삭제',
            onPress: onDelete
        })
    }

    const onDelete = async () => {

        const sender = {
            memoIdx: memo?.idx
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/memoDelete', sender);

        ToastMessage('삭제 되었습니다.');
        getMemo();
        sheetClose();

    }
    const onSubmit = async (comment) => {

        Keyboard.dismiss();

        const sender = {
            date: selected,
            comment: comment,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/memoUpdate', sender);

        ToastMessage('저장 되었습니다.');
        getMemo();
        sheetClose();
    }

    const header = {
        title: '입금 캘린더',
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

            <ScrollView ref={scRef} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 40 }}>


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

                    <View style={{ gap: 16 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={styles.label}>
                                카드매출<Text style={[styles.label, { fontSize: 11}]}> ({numFormat(count)}건)</Text>
                            </Text>
                            <Text style={[styles.price, { color: colors.primary }]}>{numFormat(total)}원</Text>
                        </View>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={styles.label}>
                                현금거래<Text style={[styles.label, { fontSize: 11}]}> ({numFormat(cashCount)}건)</Text>
                            </Text>
                            <Text style={[styles.price, { color: colors.text4A6CFC }]}>{numFormat(total2)}원</Text>
                        </View>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={styles.label}>배달앱</Text>
                            <Text style={styles.help}>준비중</Text>
                        </View>
                    </View>

                    {/* <View style={{ gap: 4, alignItems: 'center' }}>
                        <Text style={styles.label}>합계</Text>
                        <Text style={styles.price}>{numFormat(total)}원</Text>
                    </View> */}

                </View>

                <View style={{ paddingVertical: 20, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>

                    <Calendar
                        date={startDate}
                        selected={selected}
                        setSelected={setSelected}
                        list={list}
                    />

                </View>

                {selected && (
                    <Animated.View key={selected} entering={FadeIn}>
                        <SalesDay style={{ borderBottomWidth: 0 }} item={item} emptyStyle={{ height: 100, paddingBottom: 0, marginBottom: -40 }} />

                        <View style={{ marginTop: 40, gap: 13, marginHorizontal: 30 }}>
                            <Text style={[styles.title, {}]} >메모</Text>
                            <Pressable style={styles.memo} onPress={memoEdit}>
                                <Text style={styles.memoText}>{memo?.comment || '특이사항 및 메모를 남겨주세요.'}</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                )}

            </ScrollView>

            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >
                <Memo value={memo} onDelete={onDeleteAlert} onSubmit={onSubmit} />
            </BottomSheetModalTemplate>
            {/* <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={(list?.length < 1)} onPress={() => { }} >매출 내역 내보내기</Button> */}

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
        help: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.text7A7F86
        },
        increment: {
            color: colors.blue,
            fontSize: 12,
            fontFamily: fonts.medium,
            lineHeight: 16
        },
        title: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.header,
            flexShrink: 1
        },
        memo: {
            minHeight: 130,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.datePickerBorder,
            paddingVertical: 13,
            paddingHorizontal: 18
        },
        memoText: {
            fontSize: 12,
            lineHeight: 18,
            color: colors.text757575
        },
    })

    return { styles }
}
