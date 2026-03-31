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

import { useStore, useAlert, useLoader, useConfig, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, unitPriceCalc } from '@/libs/utils';


export default function Page({ }) {

    const { route, mode, all=false } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();
    const { setContext } = usePageContext();

    const [list, setList] = useState([]); // 
    const [viewList, setViewList] = useState([]); // 
    const [selected, setSelected] = useState([]);
    const [chkAll, setChkAll] = useState(false);

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

        const { data, error } = await API.post('/v1/work07/list');

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
                    if(mode === 'select') {
                        setContext({
                            key: 'select',
                            data: item
                        });
                        router.back();
                    } 
                }}
            >
                <View style={{ gap: 3, flex: 1 }}>
                    <View style={[ rootStyle.flex, { justifyContent: 'flex-start', gap: 11 }]}>
                        <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1}} numberOfLines={2}>{item?.work_type}</Text>
                    </View>

                    <Text style={{...rootStyle.font(12, colors.iconGray, fonts.medium), lineHeight: 24 }}>
                        매주 {item?.work_day?.map(x => consts.week?.find(y => y?.idx === x)?.title)?.join(', ')}
                        , {item?.work_stime} ~ {item?.work_etime}
                    </Text>
                </View>

                <Image source={images.link3} style={rootStyle.default} />
            </TouchableOpacity>
        );
    };

    const header = {
        title: '근무형태 관리',
        right: {
            icon: 'exit',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ flex: 1 }}>

                {([`/${routes.일용노무등록}`, `/${routes.직원등록}`].includes(route) && list?.length < 1) ? (
                    <View style={{ flex: 1 }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, paddingBottom: insets?.top + rootStyle.header.height, paddingHorizontal: rootStyle.side }}>
                            <Image source={images.notfound} style={rootStyle.default48} />

                            <View style={{ gap: 8 }}>
                                <Text style={{...rootStyle.font(20, colors.textPrimary, fonts.semiBold), textAlign: 'center', lineHeight: 32 }}>{`아직 등록된 근무형태가 없어요.`}</Text>
                                <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium), textAlign: 'center', lineHeight: 24 }}>{`근무 형태 관리 화면에서 바로 입력할 수 있습니다.`}</Text>
                            </View>
                        </View>

                        <Button bottom onPress={() => { 
                            router.replace({
                                pathname: routes.근무형태등록,
                                params: {
                                    route: route
                                }
                            })
                        }}>근무형태 등록</Button>
                    </View>
                ) : (
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
                        ListEmptyComponent={
                            <Empty msg={'등록된 근무형태가 없습니다.'} style={{ paddingBottom: 0 }}  />
                        }
                    />
                )}
            </View>

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
