import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
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
import TextList from '@/components/TextList';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Button from '@/components/Button';

import Tag from '@/components/Ui/Tag';
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

import { useAlert, useLoader, useConfig } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, getMonthList } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]
export default function Page({ }) {


    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();
    
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [startDate, setStartDate] = useState(dayjs().startOf('months').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().endOf('months').format('YYYY-MM-DD'));
    const [selected, setSelected] = useState(null);

    const [total, setTotal] = useState(0); // 
    const [totalFix, setTotalFix] = useState(0); // 고정비 합계
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


    const dataFunc = async (reset) => {

        if (load) return;

        // if(!initLoad) openLoader();
        setLoad(true);
        setSelected(null);

        const sender = {
            startDate: startDate,
            endDate: endDate
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/expense/list', sender);

        setTotal(data?.total);
        setTotalFix(data?.totalFix);
        setList(data?.list || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            closeLoader();

        }, consts.apiDelay)
    }


    const handleDateChange = (date) => {
        setStartDate(dayjs(date).startOf('months').format('YYYY-MM-DD'))
        setEndDate(dayjs(date).endOf('months').format('YYYY-MM-DD'))
    };


    const header = {
        title: '지출 내역',
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 100 }}>
                

                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

                <View style={{ paddingHorizontal: width <= 330 ? 25 : 36, paddingBottom: 30, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
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

                    <View style={{ gap: 20 }}>
                        <View style={[rootStyle.flex, { gap: 13, justifyContent: 'space-between' }]}>
                            <View style={[rootStyle.flex, { flex: 1, gap: 7, justifyContent: 'flex-start' }]}>
                                <Image source={images.expenditure} style={rootStyle.default} />
                                <Text style={styles.label} numberOfLines={1}>이번 달 예정 지출 합계</Text>
                            </View>
                            <Text style={styles.price}>{numFormat(total)}원</Text>
                        </View>
                        <View style={[rootStyle.flex, { gap: 13, justifyContent: 'space-between' }]}>
                            <View style={[rootStyle.flex, { flex: 1, gap: 7, justifyContent: 'flex-start' }]}>
                                <Image source={images.expenditure_fix} style={rootStyle.default} />
                                <Text style={styles.label} numberOfLines={1}>이번 달 고정비 합계</Text>
                            </View>
                            <Text style={styles.price}>{numFormat(totalFix)}원</Text>
                        </View>
                    </View>

                </View>

                <View style={{ paddingVertical: 30, paddingHorizontal: rootStyle.side, gap: 13 }}>
                    <Text style={styles.title}>지출 항목</Text>
                    
                    {list?.length > 0 ? list?.map((x, i) => {
                        return (
                            <Pressable key={`${x?.idx}_${i}`} style={styles.item} onPress={() => {
                                router.push({
                                    pathname: routes.storeExpenditureForm,
                                    params: {
                                        idx: x?.idx
                                    }
                                })
                            }}>
                                <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start' }]}>
                                    <Text style={styles.itemTitle}>{x?.title}</Text>
                                    <Tag tag={configOptions?.expenseType?.find(t => t?.idx === x?.type)?.title} />
                                </View>
                                <View>
                                    <TextList style={styles.itemData}>금액: {numFormat(x?.amount * 1)}원</TextList>
                                    <TextList style={styles.itemData}>예정일: {dayjs(x?.date+"").format('YYYY.MM.DD')}</TextList>
                                    {Boolean(x?.loop) && <TextList style={styles.itemData}>반복: {configOptions?.loopType?.find(t => t?.idx === x?.loop)?.title}</TextList>}
                                    <TextList style={styles.itemData}>메모: {x?.memo || '-'}</TextList>
                                </View>
                            </Pressable>
                        )
                    }) : 
                        <Empty msg={'지출 예정 내역이 없습니다.'} style={[{ height: 200, paddingBottom: 0 }]} />
                    }
                </View>

            </ScrollView>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} onPress={() => {
                router.push({
                    pathname: routes.storeExpenditureForm,
                })
            }} >지출 항목 등록</Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        label: {
            color: colors.text757575,
            fontSize: 14,
            fontFamily: fonts.medium,
            lineHeight: 16,
            flexShrink: 1,
            textAlign: 'right'
        },
        price: {
            color: colors.header,
            fontSize: 16,
            fontFamily: fonts.semiBold,
        },
        title: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.header,
            flexShrink: 1
        },
        item: {
            backgroundColor: colors.fafafa,
            borderRadius: 10,
            paddingHorizontal: 26,
            paddingVertical: 23,
            gap: 7
        },
        itemTitle: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            color: colors.black,
        },
        itemData: {
            fontSize: 14,
            fontFamily: fonts.medium,
            lineHeight: 28,
            color: colors.text757575,
        }

    })

    return { styles }
}
