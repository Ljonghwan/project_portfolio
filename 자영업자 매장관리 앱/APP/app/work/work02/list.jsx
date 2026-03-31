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
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
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
import { ToastMessage, getFullDateFormat, numFormat, unitPriceCalc } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]
export default function Page({ }) {

    const { sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

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

        const { data, error } = await API.post('/v1/work02/list');

        let list = data?.map(x => { 
            let total = x?.list?.reduce((acc, x) => acc + (x?.input * x?.calc), 0) || 0;
            let margin = ( (x?.amount - total) / x?.amount * 100 || 0);
            return {
                ...x, 
                total: total,
                margin: margin
            }
        });

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
            <Menu item={item} />
        );
    };

    const header = {
        title: '원가계산기',
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
                        paddingHorizontal: rootStyle.side,
                        flex: list?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListHeaderComponent={
                        <View style={{ gap: 26, marginBottom: 22 }}>
                            <View style={[rootStyle.flex, { gap: 11 }]}>
                                <View style={styles.card}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>총 메뉴 수</Text>
                                        <Image source={images.work02_icon_01} style={rootStyle.default} />
                                    </View>
                                    <Text style={{...rootStyle.font(20, colors.black, fonts.semiBold), lineHeight: 30 }}>{list?.length}개</Text>
                                </View>
                                <View style={styles.card}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>평균 마진</Text>
                                        <Image source={images.work02_icon_01} style={rootStyle.default} />
                                    </View>
                                    <Text style={{...rootStyle.font(width <= 320 ? 18 : 20, colors.primaryBright, fonts.semiBold), lineHeight: 30 }}>
                                        {numFormat( (list?.reduce((acc, x) => acc + x?.margin, 0) / list?.length || 0).toFixed(1) )}%
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold) }}>메뉴 리스트</Text>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'등록된 메뉴가 없습니다.'} style={{ paddingBottom: 0 }}  />
                    }
                />

            </View>

            <TouchableOpacity
				style={[styles.addBox, { bottom: insets?.bottom + 20 }]}
                activeOpacity={0.7}
                onPress={() => {
                    router.push(routes.원가계산기등록);
                }} 
			>
                <View style={styles.add}>
                    <Image source={images.add_white} style={rootStyle.default20}></Image>
                </View>
			</TouchableOpacity>

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        addBox: {
			position: 'absolute',
			bottom: 0,
			right: 20,
		},
		add: {
			backgroundColor: colors.primary,
			width: 65,
			aspectRatio: 1 / 1,
			borderRadius: 1000,
			alignItems: 'center',
			justifyContent: 'center'
		},
        card: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 17,
            paddingVertical: 22,
            flex: 1,
            gap: 11
        },


    })

    return { styles }
}
