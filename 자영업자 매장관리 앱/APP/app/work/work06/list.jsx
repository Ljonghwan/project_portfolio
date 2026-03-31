import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Pressable,
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

import Tab from '@/components/Ui/Tab';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, imageViewer } from '@/libs/utils';


const sorts = [
    { idx: '', title: '상태 전체' },
    { idx: 1, title: '서명 대기' },
    { idx: 2, title: '서명 완료' },
]

export default function Page({ }) {

    const { sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [tab, setTab] = useState(1);

    const [list, setList] = useState([]); // 
    const [viewList, setVeiwList] = useState([]); // 

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

        setVeiwList(
            list?.filter(x => (
                !tab || ( tab === x?.status ) 
            )) 
        );

    }, [list, tab])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/work06/list');

        setList(data?.map((x) => {
            return {
                ...x,
                customersText: x?.senders?.[0]?.name + (x?.senders?.length > 1 ? ' 외 ' + (x?.senders?.length - 1) + '명' : ''),
            }
        }) || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const renderItem = ({ item, index }) => {
        return (
            <Pressable style={styles.item} onPress={() => {
                router.push({
                    pathname: routes.이벤트상세,
                    params: { idx: item?.idx }
                });
            }} >
                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.title}</Text>
                    <Text style={{ ...rootStyle.font(14, colors.primary, fonts.medium) }}>{`상세보기 >`}</Text>
                </View>

                <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium)}}>{`${dayjs(item?.sdate).format('YYYY.MM.DD')} ~ ${dayjs(item?.edate).format('YYYY.MM.DD')}`}</Text>
                    <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium)}}>대상: {item?.customersText}</Text>
                    <Text style={{ ...rootStyle.font(14, colors.primaryBright, fonts.medium)}}>{item?.senders?.[0]?.sendAt ? "발송 완료" : "발송 대기"}</Text>
                </View>
            </Pressable>
        );
    };

    const header = {
        title: '이벤트관리',
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

            <View style={{ flex: 1, gap: 10, paddingTop: 7 }}>
                <Tab
                    style={{ marginHorizontal: rootStyle.side }}
                    tabs={[
                        { key: 1, title: '진행중' },
                        { key: 2, title: '예정' },
                        { key: 3, title: '종료됨' },
                    ]}
                    active={tab}
                    setActive={setTab}
                    type='3'
                    scroll={false}
                />
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
                        flex: viewList?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{ paddingBottom: 0 }} />
                    }
                />

            </View>

            <Button bottom onPress={() => {
                router.push(routes.이벤트등록);
            }} >이벤트 등록</Button>


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
            lineHeight: 24
        },
        price: {
            color: colors.header,
            fontSize: 20,
            fontFamily: fonts.bold,
        },

        item: {
            marginBottom: 9,
            borderRadius: 10,
            backgroundColor: colors.fafafa,
            paddingHorizontal: 29,
            paddingVertical: 21,
            gap: 12,
        }

    })

    return { styles }
}
