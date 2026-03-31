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
import { ToastMessage, getFullDateFormat, numFormat, unitPriceCalc, formatFloat } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
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
    const [stx, setStx] = useState("");

    const [mode, setMode] = useState("list");

    const [total, setTotal] = useState(0); // 
    const [list, setList] = useState([]); // 
    const [calendarList, setCalendarList] = useState([]); // 
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

        const { data, error } = await API.post('/v1/work09/list');
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
            <TouchableOpacity 
                style={[rootStyle.flex, { justifyContent: 'flex-start', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.e9e9e9 }]}
                activeOpacity={0.7}
                onPress={() => {
                    router.push({
                        pathname: routes.제품원가등록,
                        params: {
                            idx: item?.idx,
                            type: item?.type
                        }
                    });
                }}
            >
                {/* <Text>{item?.title}</Text>
                <Text>{item?.company}</Text>
                <Text>{item?.unit}</Text>
                <Text>{item?.volume}</Text>
                <Text>{item?.yield}</Text> */}

                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows1 }}>{item?.title}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows2 }}>{item?.type}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows3 }}>{item?.unit}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows4 }}>{formatFloat(item?.calc)}원</Text>
            </TouchableOpacity>
        );
    };

    const header = {
        title: '제품 원가 관리',
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

                <FlashList
                    data={list?.filter(x => (x?.title?.includes(stx)))}
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
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListHeaderComponent={
                        <View>
                            <View style={{ paddingHorizontal: rootStyle.side, paddingBottom: 24 }}>
                                <TextInput
                                    value={stx}
                                    onChangeText={setStx}
                                    placeholder="검색어를 입력해주세요"
                                    maxLength={20}
                                    icon={images.search}
                                    iconStyle={rootStyle.default20}
                                />
                            </View>
                            
                            <View style={[rootStyle.flex, { height: 32, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.efeff5 }]}>
                                <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>제품명</Text>
                                <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>구분</Text>
                                <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>단위</Text>
                                <Text style={{...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>기준 단가</Text>
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'등록된 제품이 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                    }
                />

            </View>

            <Button bottom onPress={() => {
                router.push(routes.제품원가등록);
            }} >제품 원가 등록</Button>

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
            width: '35%',
        },
        rows2: {
            width: '15%',
        },
        rows3: {
            width: '15%',
        },
        rows4: {
            width: '30%',
        },

    })

    return { styles }
}
