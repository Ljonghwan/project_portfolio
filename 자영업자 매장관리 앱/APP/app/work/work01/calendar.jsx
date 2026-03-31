import React, { useRef, useState, useEffect, useCallback } from 'react';
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

import Purchase from '@/components/Item/Purchase';

import Calendar from '@/components/Ui/Calendar';
import MonthPicker from '@/components/Ui/MonthPicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

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

    const { sdate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [startDate, setStartDate] = useState(dayjs(sdate || null).startOf('months').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs(sdate || null).endOf('months').format('YYYY-MM-DD'));
    const [stx, setStx] = useState("");

    const [mode, setMode] = useState("list");

    const [total, setTotal] = useState(0); // 
    const [list, setList] = useState([]); // 
    const [selected, setSelected] = useState(null);

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
            endDate: endDate
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work01/list', sender);

        setTotal(data?.reduce((acc, item) => acc + item?.total, 0) || 0);
        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {

    }

    const handleDateChange = (date) => {
        setStartDate(dayjs(date).startOf('months').format('YYYY-MM-DD'))
        setEndDate(dayjs(date).endOf('months').format('YYYY-MM-DD'))
    };

    const renderItem = ({ item, index }) => {

        return (
            <Purchase item={item} styleContext={styles} />
        );
    };

    const header = {
        title: '매입비 관리',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    /**
     * 고오급 정보 - 해외던 국내든 창업 ai
     * 젗책뉴스, 기업정보마당 --
     * AI ddddddddddddddddddddd
     * 
     * 
     * 창업 유저 확보 ------> 고오급정보, 대표(초기, 실무자
     */

    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: insets?.bottom + 100,
                }}
            >
                <View>
                    <View style={{ paddingHorizontal: rootStyle.side }}>
                        <View style={{ marginBottom: 36 }}>
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

                        <View style={{ gap: 8, alignItems: 'center' }}>
                            <Text style={styles.label}>총 매입 금액</Text>
                            <Text style={styles.price}>{numFormat(total)}원</Text>

                            <TouchableOpacity style={[rootStyle.flex, { gap: 14, marginTop: 12 }]} onPress={() => {
                                router.replace({
                                    pathname: routes.매입비관리,
                                    params: {
                                        sdate: startDate,
                                        edate: endDate
                                    }
                                });
                            }}>
                                <Text style={{ ...rootStyle.font(14, colors.primary, fonts.medium) }}>리스트로 보기</Text>
                                <Image source={images.link2} style={rootStyle.default18} />
                            </TouchableOpacity>
                        </View>
                        
                    </View>
                    
                    <View style={{ marginVertical: 22, paddingVertical: 20, borderTopWidth: 8, borderTopColor: colors.fafafa }}>
                        {load && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.dimWhite }} fixed />)}
                        <Calendar
                            date={startDate}
                            list={list}
                            dayContainerStyle={{ height: 70 }}
                        />
                    </View>
                    

                    {/* <View style={[rootStyle.flex, { height: 32, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.efeff5 }]}>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>품목명</Text>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>수량</Text>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>단가</Text>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>공급가액</Text>
                    </View> */}
                </View>


            </ScrollView>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} onPress={() => {
                router.push(routes.매입등록방식선택);
            }} >매입 등록</Button>

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

        rows1: {
            width: '25%',
        },
        rows2: {
            width: '20%',
        },
        rows3: {
            width: '20%',
        },
        rows4: {
            width: '35%',
        },

    })

    return { styles }
}
