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
import BottomMultiButton from '@/components/BottomMultiButton';

import Menu from '@/components/Item/Menu';

import Tag from '@/components/Ui/Tag';
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

import { useStore, useAlert, useLoader, useConfig } from '@/libs/store';
import { ToastMessage, getFullDateFormat, hpHypen, numFormat, unitPriceCalc } from '@/libs/utils';


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
    const [vip, setVip] = useState(false);

    const [mode, setMode] = useState("list");

    const [list, setList] = useState([]); // 
    const [viewList, setViewList] = useState([]); // 

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

    useEffect(() => {

        setViewList(list?.filter(x => (x?.name?.includes(stx) || x?.hp?.includes(stx)) && (!vip || x?.vip === vip)));

    }, [vip, stx, list])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/work05/list');

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
                style={[rootStyle.flex, { justifyContent: 'space-between', backgroundColor: colors.fafafa, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 26, marginBottom: 8 }]}
                onPress={() => {
                    router.push({
                        pathname: routes.고객등록,
                        params: { idx: item?.idx }
                    });
                }}
            >
                <View style={{ gap: 3, flex: 1 }}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 7 }]}>
                        <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={2}>{item?.name}</Text>
                        {item?.vip && <Tag type={2} tag={"VIP"} style={{ height: 20 }} textStyle={{ fontSize: 12 }}/>}
                    </View>

                    <Text style={{ ...rootStyle.font(12, colors.iconGray, fonts.medium), lineHeight: 24 }}>{hpHypen(item?.hp, true)} · {configOptions?.ageType?.find(x => x?.idx === item?.age)?.title} {configOptions?.genderType?.find(x => x?.idx === item?.gender)?.title}</Text>
                </View>

                <Image source={images.link3} style={rootStyle.default} />
            </TouchableOpacity>
        );
    };

    const header = {
        title: '고객관리',
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
                    data={viewList}
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
                    ListHeaderComponent={
                        <View style={{ gap: 12, marginBottom: 22 }}>
                            <View style={[rootStyle.flex, { gap: 15 }]}>
                                <View style={styles.card}>
                                    <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium), lineHeight: 28 }}>총 고객 수</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.primary, fonts.semiBold) }}>{list?.length}명</Text>
                                </View>
                                <View style={styles.card}>
                                    <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium), lineHeight: 28 }}>이번달 신규 고객</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.primary, fonts.semiBold) }}>{list?.filter(x => dayjs(x?.createdAt).isSame(dayjs(), 'month'))?.length}명</Text>
                                </View>
                            </View>

                            <View style={{ paddingBottom: 10 }}>
                                <TextInput
                                    value={stx}
                                    onChangeText={setStx}
                                    placeholder="고객 이름 또는 연락처를 입력하세요"
                                    maxLength={20}
                                    icon={images.search}
                                    iconStyle={rootStyle.default20}
                                />
                            </View>

                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>고객 리스트</Text>
                                <CheckBox
                                    type={2}
                                    label="VIP만 보기"
                                    checked={vip}
                                    onPress={() => setVip(prev => !prev)}
                                    checkboxStyle={{ width: 18 }}
                                />
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'등록된 고객이 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                    }
                />

            </View>


            <BottomMultiButton>

                <Button type={9} style={{ flex: 1 }} onPress={() => {
                    router.push(routes.고객등록);
                }} >고객 등록 (수기)</Button>

                <Button style={{ flex: 1 }} onPress={() => {
                    router.push(routes.고객등록외부);
                }} >고객 등록 (매장)</Button>
            </BottomMultiButton>



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
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.fafafa,
            paddingTop: 12,
            paddingBottom: 18,
        },


    })

    return { styles }
}
