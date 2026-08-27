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

import { useStore, useAlert, useLoader, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, unitPriceCalc, hpHypen } from '@/libs/utils';


export default function Page({ }) {

    const { route, mode, find=false } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { setContext } = usePageContext();

    const [list, setList] = useState([]); // 
    
    const [viewList, setViewList] = useState([]); // 
    const [selected, setSelected] = useState([]);
    const [chkAll, setChkAll] = useState(false);

    const [stx, setStx] = useState("");
    const [vip, setVip] = useState(false);

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

    }, [stx, list, vip])

    useEffect(() => {

        setChkAll(viewList?.length > 0 && viewList?.filter(x => !x?.check)?.length < 1);

    }, [viewList])

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
            <TouchableOpacity style={[rootStyle.flex, { justifyContent: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.e9e9e9 }]} activeOpacity={0.7} onPress={() => {
                if(mode === 'select') {
                    setContext({
                        key: 'copy',
                        data: item
                    });
                    router.back();
                } else {
                    setViewList(l => l?.map(x => {
                        if(x?.idx !== item?.idx || x?.type !== item?.type) return x;
                        return {...x, check: !x?.check}
                    }));
                }
            }}>
                {mode !== 'select' && (
                    <View style={[rootStyle.flex, { justifyContent: 'center', ...styles.rows1 }]}>
                        <Image source={item?.check ? images.check2_on : images.check2_off} style={{ width: 14, aspectRatio: 1 }} transition={50} />
                    </View>    
                )}
                
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows2 }}>{item?.name}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows3 }}>{hpHypen(item?.hp)}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows4 }}>{ item?.vip ? 'Y' : 'N' }</Text>
            </TouchableOpacity>
        );
    };

    const header = {
        title: '고객 검색',
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
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
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 100,
                        paddingHorizontal: rootStyle.side,
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListHeaderComponent={
                        <View>
                            <View style={{ paddingBottom: 17, gap: 30 }}>
                                <TextInput
                                    value={stx}
                                    onChangeText={setStx}
                                    placeholder={"이름 또는 연락처를 입력해주세요"}
                                    maxLength={20}
                                    icon={images.search}
                                    iconStyle={rootStyle.default20}
                                />

                                <View style={[rootStyle.flex, {justifyContent: 'space-between' }]}>
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

                            <TouchableOpacity style={[rootStyle.flex, { height: 40, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.f4f4f5 }]} activeOpacity={0.7} onPress={() => {
                                if(mode === 'select') return;
                                setViewList(l => l?.map(x => ({ ...x, check: !chkAll })));
                            }}>
                                {mode !== 'select' && (
                                    <View style={[rootStyle.flex, { justifyContent: 'center', ...styles.rows1 }]}>
                                        <Image source={chkAll ? images.check2_on : images.check2_off} style={{ width: 14, aspectRatio: 1 }} transition={50} />
                                    </View>
                                )}
                               
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>고객명</Text>
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>연락처</Text>
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>VIP</Text>
                                
                            </TouchableOpacity>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'고객 리스트가 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                    }
                />

            </View>

            
            {mode !== 'select' && (
                 <Button bottom disabled={viewList?.filter(x => x?.check)?.length < 1 } onPress={() => {
                    let selectList = viewList?.filter(x => x?.check);
                    setContext({
                        key: 'list',
                        data: {
                            list: selectList?.map(x => x?.idx),
                            text: selectList?.[0]?.name + (selectList?.length > 1 ? ' 외 ' + (selectList?.length - 1) + '명' : ''),
                        }
                    });
                    router.back();
                }} >{viewList?.filter(x => x?.check)?.length}명 선택됨</Button>
            )}
           

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets(); 
    const { width } = useSafeAreaFrame();
    
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
            width: '10%',
        },
        rows2: {
            width: '25%',
        },
        rows3: {
            width: width <= 330 ? '35%' : '45%',
        },  
        rows4: {
            width: width <= 330 ? '30%' : '20%',
        },

    })

    return { styles }
}
