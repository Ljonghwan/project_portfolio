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

import Menu from '@/components/Item/Menu';

import Tag from '@/components/Ui/Tag';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader, useConfig } from '@/libs/store';
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

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

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
        }, [])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/work04/list');

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity 
                style={[ rootStyle.flex, { justifyContent: 'space-between', backgroundColor: colors.fafafa, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 26, marginBottom: 13 }]}
                onPress={() => {
                    router.push({
                        pathname: routes.직원상세,
                        params: { idx: item?.idx }
                    });
                }}
            >
                <View style={{ gap: 3 }}>
                    <View style={[ rootStyle.flex, { justifyContent: 'flex-start', gap: 11 }]}>
                        <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{item?.name}</Text>
                        <Text style={{...rootStyle.font(12, colors.iconGray, fonts.medium)}}>{configOptions?.staffCategory?.find(x => x?.idx === item?.type)?.title} ({item?.work_type || '-'})</Text>
                        <Tag type={item?.status === 9  ? 4 : dayjs(item?.edate).isBefore(dayjs()) ? 3 : 2} tag={item?.status === 9 ? '퇴사' : dayjs(item?.edate).isBefore(dayjs()) ? '근무종료' : '재직'} />
                    </View>

                    <Text style={{...rootStyle.font(12, colors.iconGray, fonts.medium), lineHeight: 24 }}>매주 {item?.work_day?.map(x => consts.week?.find(y => y?.idx === x)?.title)?.join(', ')}</Text>
                </View>

                <Image source={images.link3} style={rootStyle.default} />
            </TouchableOpacity>
        );
    };

    const header = {
        title: '직원관리',
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
            
                <View style={{ paddingHorizontal: rootStyle.side, paddingBottom: 13 }}>
                    <TextInput
                        value={stx}
                        onChangeText={setStx}
                        placeholder="직원명으로 검색해 보세요"
                        maxLength={20}
                        icon={images.search}
                        iconStyle={rootStyle.default20}
                    />
                </View>

                <FlashList
                    data={list?.filter(x => (x?.name?.includes(stx)))}
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
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListEmptyComponent={
                        <Empty msg={'등록된 직원이 없습니다.'} style={{ height: 150, paddingBottom: 0 }}  />
                    }
                />

            </View>

            <Button bottom onPress={() => {
                router.push(routes.직원등록);
            }} >신규 직원 등록</Button>

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
