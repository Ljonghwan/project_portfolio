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
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

import Personnel from '@/components/Item/Personnel';

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
import { ToastMessage, getFullDateFormat, numFormat, formatToAbs, formatToAbsColor } from '@/libs/utils';

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

    const [total, setTotal] = useState(0); // 
    const [total2, setTotal2] = useState(0); // 

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [startDate, endDate, all])
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
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/personnel/list', sender);

        console.log('data', data);

        setTotal(data?.filter(x => x?.staff)?.reduce((acc, item) => acc + item?.pay_calc, 0) || 0);
        setTotal2(data?.filter(x => !x?.staff)?.reduce((acc, item) => acc + item?.pay_calc, 0) || 0);
        setList(data || []);

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
            <Personnel style={[ index === 0 && { marginTop: 12.5 } ]} item={item} />
        );
    };

    const header = {
        title: '인건비',
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


                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

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
                        <View>
                            <View style={{ marginBottom: 23, paddingHorizontal: 36, paddingBottom: 24, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
                                <View style={{ marginBottom: 27 }}>
                                    <DatePicker
                                        onDateChange={handleDateChange}
                                        initialStartDate={startDate}
                                        initialEndDate={endDate}
                                        mode='pick'
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

                                <View style={{ marginBottom: 21, gap: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.f6f6f6, paddingBottom: 30 }}>
                                    <Text style={styles.label}>총 인건비 합계</Text>
                                    <Text style={styles.price}>{numFormat(total + total2)}원</Text>
                                </View>

                                <View style={{ gap: 20 }}>
                                    <View style={[rootStyle.flex, { gap: 13, justifyContent: 'space-between' }]}>
                                        <View style={[rootStyle.flex, { flex: 1, gap: 7, justifyContent: 'flex-start' }]}>
                                            <Image source={images.personnel} style={rootStyle.default} />
                                            <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}} numberOfLines={1}>고정직원 인건비</Text>
                                        </View>
                                        <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold)}} >{numFormat(total)}원</Text>
                                    </View>
                                    <View style={[rootStyle.flex, { gap: 13, justifyContent: 'space-between' }]}>
                                        <View style={[rootStyle.flex, { flex: 1, gap: 7, justifyContent: 'flex-start' }]}>
                                            <Image source={images.personnel2} style={rootStyle.default} />
                                            <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}} numberOfLines={1}>일용직 인건비</Text>
                                        </View>
                                        <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold)}} >{numFormat(total2)}원</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={{ paddingHorizontal: 36 }}>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={styles.title}>출근 현황</Text>
                                </View>
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{ paddingBottom: 0 }} />
                    }
                />

            </View>

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
            lineHeight: 16
        },
        price: {
            color: colors.header,
            fontSize: 24,
            fontFamily: fonts.bold,
        },
        increment: {
            color: colors.blue,
            fontSize: 12,
            fontFamily: fonts.medium,
            lineHeight: 16
        },
        title: {
            color: colors.header,
            fontSize: 16,
            fontFamily: fonts.semiBold,
        }

    })

    return { styles }
}
