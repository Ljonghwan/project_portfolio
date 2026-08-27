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
    ActivityIndicator,
    Pressable,
    Keyboard,
    Platform
} from 'react-native';

import { router, useFocusEffect, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp, FadeIn, linear } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import { throttle } from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import TextList from '@/components/TextList';
import TextInput from '@/components/TextInput';
import TextArea from '@/components/TextArea';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Switch from '@/components/Switch';
import CheckBox from '@/components/CheckBox';

import BottomMultiButton from '@/components/BottomMultiButton';
import Button from '@/components/Button';

import SelectLabel from '@/components/Ui/SelectLabel';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';
import InputTime from '@/components/Ui/InputTime';

import Memo from '@/components/Popup/Memo';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useAlert, useLoader, useConfig, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, hpHypen, hpHypenRemove, countSelectedDaysFast } from '@/libs/utils';
import { aspectRatio } from '@expo/ui/swift-ui/modifiers';


export default function Page({ }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { idx, type: typeParam } = useLocalSearchParams();
    const pathname = usePathname();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();
    const { context, setContext } = usePageContext();

    const sheetRef = useRef();
    const inputRefs = useRef({});

    const titleRefs = useRef([]);
    const quantityRefs = useRef([]);
    const amountRefs = useRef([]);

    const [item, setItem] = useState(null);
    const [workDays, setWorkDays] = useState(0);
    

    const [initLoad, setInitLoad] = useState(Boolean(idx)); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        dataFunc();
    }, [idx])

    useEffect(() => {
        if (reload) {
            dataFunc();
        }
    }, [reload])

    const dataFunc = async () => {

        const sender = {
            idx: idx
        }
        const { data, error } = await API.post('/v1/work06/get', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem({
            ...data,
            customersText: data?.senders?.[0]?.name + (data?.senders?.length > 1 ? ' 외 ' + (data?.senders?.length - 1) + '명' : ''),
        });

        setTimeout(() => {
            setInitLoad(false)
            setReload(false);
        }, consts.apiDelay)

    }


    const onDeleteAlert = () => {
        Keyboard.dismiss();

        openAlertFunc({
            label: '취소 처리 하시겠어요?',
            title: `취소한 정보는 복구할 수 없습니다.\n정말 취소하시겠어요?`,
            onCencleText: '취소',
            onPressText: '확인',
            onPress: onDelete
        })
    }

    const onDelete = async () => {

        const sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/work06/delete', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        router.back();
        ToastMessage('처리 되었습니다.');
    }


    const renderItem = ({ item, index }) => {

        return (
            <View style={[rootStyle.flex, { height: 44, justifyContent: 'flex-start' }]}>
                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>{item?.name}</Text>
                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>{item?.sendAt ? dayjs(item?.sendAt).format('MM.DD') : '발송 대기'}</Text>
                <Text style={{ ...rootStyle.font(12, item?.usedAt ? colors.text4A6CFC : colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>{item?.usedAt ? dayjs(item?.usedAt).format('MM.DD') : '미사용'}</Text>
            </View>
        )
    };


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={{...header, title: item?.name }} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <FlashList
                data={item?.senders}
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
                }}
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={"handled"}
                nestedScrollEnabled={true}
                decelerationRate={'normal'}
                ListHeaderComponent={
                    <View style={{ gap: 30 }}>
                        <View style={{ paddingHorizontal: 35, paddingBottom: 30, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
                            <View style={{ gap: 28,}}>
                                <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                    <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>이벤트명</Text>
                                    <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1}} numberOfLines={1}>{item?.title}</Text>
                                </View>
                                <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                    <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>진행 기간</Text>
                                    <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{dayjs(item?.sdate).format('YYYY.MM.DD')} ~ {dayjs(item?.edate).format('YYYY.MM.DD')}</Text>
                                </View>
                                <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                    <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>대상</Text>
                                    <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.customersText}</Text>
                                </View>
                                <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                    <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>발송 방식</Text>
                                    <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>문자 전송</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ paddingHorizontal: rootStyle.side, gap: 18 }}>  
                            <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold)}}>이벤트 설명</Text>
                            <View style={[styles.box]}>
                                <TextList style={{...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>혜택 : {numFormat(item?.discount)} {item?.type === 1 ? '원' : '%'} 할인</TextList>
                                {item?.min_amount && <TextList style={{...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>사용조건 : {item?.min_amount}</TextList>}
                                <TextList style={{...rootStyle.font(14, colors.text757575, fonts.medium), lineHeight: 28 }}>유효기간 : {dayjs(item?.sdate).format('YYYY.MM.DD')} ~ {dayjs(item?.edate).format('YYYY.MM.DD')}</TextList>
                            </View>
                        </View>

                        <View style={{ gap: 18 }}>  
                            <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), marginHorizontal: rootStyle.side }}>참여자 리스트</Text>
                            
                            <View style={[rootStyle.flex, { height: 40, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.f4f4f5 }]}>
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>고객명</Text>
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>발송일</Text>
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>사용일</Text>
                            </View>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <Empty msg={'참여자 리스트가 없습니다.'} style={{ height: 150, paddingBottom: 0 }} />
                }
            >
                

            </FlashList>


            {item?.status === 2 && (
                <Button type={'delete'} style={{ flex: 1, }} bottom onPress={onDeleteAlert}>이벤트 취소</Button>
            )}

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        box: {
            paddingVertical: 19,
            paddingHorizontal: 20,
            backgroundColor: colors.fafafa,
            borderRadius: 10,
        },

        rows1: {
            width: '10%',
        },
        rows2: {
            width: '35%',
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
