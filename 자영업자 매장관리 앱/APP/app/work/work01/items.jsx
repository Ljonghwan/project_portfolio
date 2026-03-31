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

import { router, useFocusEffect, usePathname, useLocalSearchParams } from "expo-router";
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

import { useStore, useAlert, useLoader, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, formatToAbs, formatToAbsColor } from '@/libs/utils';


export default function Page({ }) {

    const { route, mode, company } = useLocalSearchParams();
    const pathname = usePathname();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { setContext } = usePageContext();

    const [list, setList] = useState([]); // 
    const [viewList, setViewList] = useState([]); // 
    const [selected, setSelected] = useState([]);
    const [chkAll, setChkAll] = useState(false);

    const [stx, setStx] = useState("");

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [company])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    useEffect(() => {

        setViewList(list?.filter(x => (x?.company?.includes(stx) || x?.title?.includes(stx))));

    }, [stx, list])

    useEffect(() => {

        setChkAll(viewList?.length > 0 && viewList?.filter(x => !x?.check)?.length < 1);

    }, [viewList])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const sender = {
            company: company
        }

        const { data, error } = await API.post('/v1/work01/items', sender);

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
                        key: 'select',
                        data: item
                    });
                    router.back();
                } else {
                    setViewList(l => l?.map(x => {
                        if(x?.idx !== item?.idx) return x;
                        return {...x, check: !x?.check}
                    }));
                }
            }}>
                {mode !== 'select' && (
                    <View style={[rootStyle.flex, { justifyContent: 'center', ...styles.rows1 }]}>
                        <Image source={item?.check ? images.check2_on : images.check2_off} style={{ width: 14, aspectRatio: 1 }} transition={50} />
                    </View>    
                )}
                
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16,  width: mode === 'select' ? '40%' : styles.rows2.width }}>{item?.title}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows3 }}>{numFormat(item?.amount)}</Text>
                <Text numberOfLines={2} style={{...rootStyle.font(12, colors.text313131), textAlign: 'center', lineHeight: 16, ...styles.rows4 }}>{item?.company}</Text>
            </TouchableOpacity>
        );
    };

    const header = {
        title: '품목검색',
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
    };
    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ flex: 1 }}>
                {(route === `/${routes.제품원가등록}` && list?.length < 1) ? (
                    <View style={{ flex: 1 }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, paddingBottom: insets?.top + rootStyle.header.height, paddingHorizontal: rootStyle.side }}>
                            <Image source={images.notfound} style={rootStyle.default48} />

                            <View style={{ gap: 8 }}>
                                <Text style={{...rootStyle.font(20, colors.textPrimary, fonts.semiBold), textAlign: 'center', lineHeight: 32 }}>{`아직 품목을 등록하지 않았어요.`}</Text>
                                <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium), textAlign: 'center', lineHeight: 24 }}>{`매입 등록 화면에서 바로 입력할 수 있습니다.`}</Text>
                            </View>
                        </View>

                        <Button bottom onPress={() => { 
                            router.replace({
                                pathname: routes.매입등록,
                                params: {
                                    route: route
                                }
                            })
                        }}>품목 등록</Button>
                    </View>
                ) : (
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
                                        placeholder="검색어를 입력해주세요"
                                        maxLength={20}
                                        icon={images.search}
                                        iconStyle={rootStyle.default20}
                                    />
                                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>품목 리스트</Text>
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

                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', width: mode === 'select' ? '40%' : styles.rows2.width }}>품목명</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>단가</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>거래처</Text>
                                </TouchableOpacity>
                            </View>

                        }
                        ListEmptyComponent={
                            <Empty msg={'품목 리스트가 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                        }
                    />
                )}

                

            </View>

            
            {mode !== 'select' && (
                 <Button bottom disabled={viewList?.filter(x => x?.check)?.length < 1 } onPress={() => {
                    setContext({
                        key: 'list',
                        data: viewList?.filter(x => x?.check)?.map(x => ({ title: x?.title, amount: x?.amount }))
                    });
                    router.back();
                }} >{viewList?.filter(x => x?.check)?.length}개 선택됨</Button>
            )}
           

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
            width: '10%',
        },
        rows2: {
            width: '30%',
        },
        rows3: {
            width: '30%',
        },
        rows4: {
            width: '30%',
        },

    })

    return { styles }
}
