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
    ActivityIndicator
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
import TextList from '@/components/TextList';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';
import BottomMultiButton from '@/components/BottomMultiButton';

import SalesDay from '@/components/Item/SalesDay';

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
import { ToastMessage, getFullDateFormat, numFormat, formatToAbs, formatToAbsColor, calculateWage } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
export default function Page({ }) {


    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [all, setAll] = useState(false);
    const [sort, setSort] = useState(1);

    const [prev, setPrev] = useState(0); // 
    const [total, setTotal] = useState(0); // 
    const [list, setList] = useState([]); // 
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

        setLoad(true);

        const sender = {
            startDate: startDate,
            endDate: endDate,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work03/list', sender);

        console.log('data', data);

        const list = _(data).groupBy(item => `${item?.name}_${item?.hp}`).map((items) => ({
            ...items[0],
            count: items.length,
            total: items.reduce((acc, item) => acc + item?.pay_calc, 0),
        })).value();
           
        setTotal(list.length || 0);
        setList(list || []);

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
            <AnimatedTouchable entering={FadeIn} style={styles.item} onPress={() => {
                router.push({
                    pathname: routes.일용노무상세,
                    params: { idx: item?.idx }
                });
            }}>
                <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold) }}>{item?.name}</Text>
                <View>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>주민등록번호: {item?.rrn_first} - {item?.rrn_last ? item?.rrn_last?.at(0) + '******' : ''}</TextList>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>근무형태: {item?.work_type}</TextList>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>근무시간: {item?.work_stime} ~ {item?.work_etime}</TextList>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>시급: {numFormat(item?.pay) + '원'}</TextList>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>일당: {numFormat(calculateWage(item?.work_stime, item?.work_etime, item?.pay)) + '원'}</TextList>
                    <TextList style={{ ...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>비고: {item?.memo || '- '}</TextList>
                </View>
            </AnimatedTouchable>
        );
    };

    const renderItemTable = ({ item, index }) => {
        return (
            <Animated.View entering={FadeIn} style={[rootStyle.flex, { justifyContent: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.e9e9e9 }]} >
                <Text numberOfLines={2} style={{ ...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows1 }}>{item?.name}</Text>
                <Text numberOfLines={2} style={{ ...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows2 }}>{item?.work_type}</Text>
                <Text numberOfLines={2} style={{ ...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows3 }}>{numFormat(item?.count)}일</Text>
                <Text numberOfLines={2} style={{ ...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows4 }}>{numFormat(item?.total) + '원'}</Text>
            </Animated.View>
        );
    };

    const header = {
        title: '일용노무대장',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '근로자 등록',
            textStyle: {
                color: colors.primary,
            },
            onPress: () => {
                router.push(routes.일용노무등록);
            }
        }
    };


    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ flex: 1 }}>


                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

                <FlashList
                    data={list}
                    renderItem={startDate !== endDate ? renderItemTable : renderItem}
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
                        <View>
                            <View style={{ marginBottom: 24, paddingHorizontal: rootStyle.side, }}>
                                <View style={{ marginBottom: 24 }}>
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

                                <View style={{}}>
                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                                        <Text style={styles.title}>근로자 리스트</Text>
                                        <Text style={{ ...rootStyle.font(12, colors.primary, fonts.medium) }}>총 {numFormat(total)}명</Text>
                                    </View>
                                </View>
                            </View>
                            {startDate !== endDate && (
                                <View style={[rootStyle.flex, { height: 40, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.f4f4f5 }]}>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>이름</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>근무형태</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>근무일수</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>총 지급액</Text>
                                </View>
                            )}
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} />
                    }
                />

            </View>

            
            <BottomMultiButton>
                <Button type={9} style={{ flex: 1 }} onPress={() => { }} >본인인증 및 자료 출력</Button>
                <Button style={{ flex: 1 }} onPress={() => { router.push(routes.일용노무등록외부) }} >매장 등록</Button>
            </BottomMultiButton>


        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        title: {
            color: colors.header,
            fontSize: 16,
            fontFamily: fonts.semiBold,
        },
        item: {
            gap: 12,
            paddingVertical: 23,
            paddingHorizontal: 26,
            borderRadius: 10,
            backgroundColor: colors.fafafa,
            marginHorizontal: rootStyle.side,
            marginBottom: 12
        },

        rows1: {
            width: '30%',
        },
        rows2: {
            width: '20%',
        },
        rows3: {
            width: '20%',
        },
        rows4: {
            width: '25%',
        },
    })

    return { styles }
}
