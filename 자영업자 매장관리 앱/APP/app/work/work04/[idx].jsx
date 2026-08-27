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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import { throttle } from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
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


    const dataFunc = async () => {

        const sender = {
            idx: idx,
            type: typeParam
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work04/get', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);

        setWorkDays(countSelectedDaysFast(data?.sdate, data?.edate, data?.work_day));

        setTimeout(() => {
            setInitLoad(false)
        }, consts.apiDelay)

    }


    const onDeleteAlert = () => {
        Keyboard.dismiss();

        openAlertFunc({
            label: '퇴사 처리 하시겠어요?',
            onCencleText: '취소',
            onPressText: '확인',
            onPress: onDelete
        })
    }

    const onDelete = async () => {

        const sender = {
            idx: item?.idx,
            edate: dayjs().format('YYYY-MM-DD')
        }

        const { data, error } = await API.post('/v1/work04/leave', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        router.back();
        ToastMessage('처리 되었습니다.');
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={{ ...header, title: item?.name }} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 10,
                    paddingBottom: insets?.bottom + 100,
                    gap: 30
                }}
            >
                <View style={styles.box}>
                    <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>이름</Text>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.name}</Text>
                    </View>
                    <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>주민등록번호</Text>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.rrn_first} - {item?.rrn_last}</Text>
                    </View>
                    <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>연락처</Text>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{hpHypen(item?.hp)}</Text>
                    </View>
                </View>

                <View style={{ gap: 18 }}>
                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>근무 정보</Text>
                    <View style={styles.box}>
                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>근무 시작일</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{dayjs(item?.sdate).format('YYYY.MM.DD')}</Text>
                        </View>
                        {item?.edate && (
                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>근무 종료일</Text>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{dayjs(item?.edate).format('YYYY.MM.DD')}</Text>
                            </View>
                        )}

                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>고용 형태</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{configOptions?.staffCategory?.find(x => x?.idx === item?.type)?.title}</Text>
                        </View>
                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>근무 형태</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.work_type}</Text>
                        </View>
                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>근무일</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>매주 {item?.work_day?.map(x => consts.week?.find(y => y?.idx === x)?.title)?.join(', ')}</Text>
                        </View>
                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>누적 근무일수</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.work_day_count || 0} 일</Text>
                        </View>
                        {/* <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>이번달 누적 근무일수</Text>
                            <Text style={{...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.work_day_month_count || 0} 일</Text>
                        </View> */}


                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>{item?.pay_type === 1 ? '시급' : '월급'}</Text>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>
                                {numFormat(item?.pay)} 원
                            </Text>
                        </View>
                        {item?.pay_type === 1 && (
                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>{'일급'}</Text>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>
                                    {numFormat(item?.pay_calc)} 원
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ gap: 18 }}>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>근로 계약서</Text>
                        <View style={styles.box}>
                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>작성일</Text>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{dayjs(item?.createdAt).format('YYYY.MM.DD')}</Text>
                            </View>
                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>계약상태</Text>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.cert === 1 ? '미서명' : '서명 완료'}</Text>
                            </View>

                            {item?.cert === 1 && (
                                <Button type={'send'} containerStyle={{ height: 36 }} onPress={() => {
                                    router.push({
                                        pathname: routes.계약서보기,
                                        params: { idx: item?.cert_idx }
                                    });
                                }} >계약서 보기</Button>
                            )}
                        </View>
                    </View>

                </View>

            </ScrollView>

            <BottomMultiButton>
                {(item?.idx && item?.status !== 9) && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >퇴사 처리</Button>}

                <Button load={load} style={{ flex: 1 }} onPress={() => {
                    if (item?.cert === 1) {
                        router.push({
                            pathname: routes.직원등록,
                            params: { idx: item?.idx }
                        });
                    } else {
                        router.push({
                            pathname: routes.계약서보기,
                            params: { idx: item?.cert_idx }
                        });
                    }
                }} >{item?.cert === 1 ? `정보 수정` : `계약서 보기`}</Button>
            </BottomMultiButton>


        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        box: {
            paddingVertical: 28,
            paddingHorizontal: 30,
            backgroundColor: colors.fafafa,
            borderRadius: 10,
            gap: 28
        }

    })

    return { styles }
}
