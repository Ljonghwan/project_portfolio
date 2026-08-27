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
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp, FadeIn } from 'react-native-reanimated';
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
import PhotoSelectSingle from '@/components/Ui/PhotoSelectSingle';
import InputDate from '@/components/Ui/InputDate';

import Memo from '@/components/Popup/Memo';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useAlert, useLoader, useConfig, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, regDecimal, isValidJSON, unitPriceCalc } from '@/libs/utils';
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
    const [type, setType] = useState(1);

    const [image, setImage] = useState(null);

    const [total, setTotal] = useState(0);
    const [totalInput, setTotalInput] = useState(0);

    const [initLoad, setInitLoad] = useState(Boolean(idx)); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        dataFunc();
    }, [idx])


    useEffect(() => {

        if (type === 1) {
            setTotal(unitPriceCalc({ amount: item?.amount, volume: item?.volume, percent: item?.yield }));
        } else {

            let calc = item?.list?.filter(x => x?.input)?.reduce((acc, x) => acc + ( x?.input * ( unitPriceCalc({ amount: x?.amount, volume: x?.volume, percent: x?.yield }) )), 0) || 0;
            setTotal(calc);
            setTotalInput(Math.round(calc / item?.volume || 0, 0));
        }


    }, [item, type])

    useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'select') {
            setItem(prev => ({
                ...prev,
                company: context?.data?.company,
                title: context?.data?.title,
                amount: context?.data?.amount,
            }));
        }

        if(context?.key === 'list') {
            if(item?.list?.length + context?.data?.length > 30) {
                ToastMessage('최대 30개의 제품만 등록할 수 있습니다.');
            }

            handleChange({
                key: 'list',
                value: [...item?.list, ...context?.data?.filter((x, i) => i < (30 - item?.list?.length))]
            })
        }

        setContext(null);

    }, [context])

    const dataFunc = async () => {

        if (idx) {
            const sender = {
                idx: idx
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work10/get', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            setItem(data);

            setTimeout(() => {
                setInitLoad(false)
            }, consts.apiDelay)


        } else {
            console.log("?????????");
            setItem({
                type: 1,
                date: dayjs().format('YYYY-MM-DD'),
                pay_type: 1
            })
        }

    }

    const onSubmit = async () => {

        if (!item?.title) {
            ToastMessage('거래명을 입력해주세요.');
            return;
        }
        if(!item?.amount) {
            ToastMessage('금액을 입력해주세요.');
            return;
        }
        if(!item?.date) {
            ToastMessage('거래일자를 선택해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            title: item?.title,
            type: item?.type,
            amount: item?.amount,
            date: item?.date,
            pay_type: item?.pay_type,
            comment: item?.comment,
            image: item?.image,
        }

        const { data, error } = await API.post('/v1/work10/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.현금거래);

        }, consts.apiDelay)

    }


    const onDeleteAlert = () => {
        Keyboard.dismiss();

        openAlertFunc({
            label: '삭제하시겠어요?',
            title: `삭제한 정보는 복구할 수 없습니다.\n정말 삭제하시겠어요?`,
            onCencleText: '취소',
            onPressText: '삭제',
            onPress: onDelete
        })
    }

    const onDelete = async () => {

        const sender = {
            idx: item?.idx,
            type: item?.type
        }

        const { data, error } = await API.post('/v1/work09/delete', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        router.back();
        ToastMessage('삭제 되었습니다.');
    }

    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };


    const header = {
        title: '현금 거래',
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

            <KeyboardAwareScrollView
                bottomOffset={100}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ paddingTop: 20, paddingBottom: insets?.bottom + 20 }}>
                        
                    <View style={{ paddingHorizontal: 30, gap: 30 }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.title = ref)}
                                value={item?.title}
                                onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                                placeholder="예: 매장 현금 매출, 고객 환불, 공과금 환급"
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래 구분</Text>
                            <View style={[rootStyle.flex, { gap: 40, justifyContent: 'flex-start' }]}>
                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    handleChange({ key: 'type', value: 1 })
                                }}>
                                    <Image source={item?.type === 1 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>입금(매출)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    handleChange({ key: 'type', value: 2 })
                                }}>
                                    <Image source={item?.type === 2 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>출금(환불/지급)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>금액(원)</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.amount = ref)}
                                value={numFormatInput(item?.amount)}
                                onChangeText={(v) => { handleChange({ key: 'amount', value: v }) }}
                                placeholder="금액을 입력해주세요"
                                maxLength={10}
                                keyboardType={'number-pad'}
                                valid={'price'}
                            />
                        </View>


                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래일자</Text>
                            {/* <DatePicker
                                onDateChange={({ startDate }) => { handleChange({ key: 'date', value: startDate }) }}
                                initialStartDate={item?.date}
                                initialEndDate={item?.date}
                                mode={'pick'}
                            >
                                <SelectLabel title={item?.date} icon={images.input_calendar} placeHolder='거래 일자' />
                            </DatePicker> */}

                            <InputDate
                                state={item?.date} 
                                setState={(v) => handleChange({ key: 'date', value: v })} 
                                placeholder={'거래 일자'} 
                            />

                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래 출처</Text>
                            <View style={[rootStyle.flex, { gap: 40, justifyContent: 'flex-start' }]}>
                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    handleChange({ key: 'pay_type', value: 1 })
                                }}>
                                    <Image source={item?.pay_type === 1 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>현금</Text>
                                </TouchableOpacity>

                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    handleChange({ key: 'pay_type', value: 2 })
                                }}>
                                    <Image source={item?.pay_type === 2 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>계좌입금</Text>
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래 메모 (선택)</Text>
                            <TextArea
                                iref={(ref) => (inputRefs.current.comment = ref)}
                                value={item?.comment}
                                onChangeText={(v) => { handleChange({ key: 'comment', value: v }) }}
                                maxLength={200}
                                placeholder={'특이사항 및 메모를 남겨주세요.'}
                            />
                        </View>

                        <View style={[styles.fieldContainer, { gap: 20 }]}>
                            <Text style={styles.label}>영수증 첨부 (선택)</Text>
                            <PhotoSelectSingle photo={item?.image} setPhoto={(v) => { handleChange({ key: 'image', value: v }) }} />
                        </View>

                    </View>


                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                            <Button load={load} style={{ flex: 1 }} onPress={onSubmit} >저장</Button>
                        </View>
                    </View>
                </View>

            </KeyboardAwareScrollView>

            {/* <BottomMultiButton>
                {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                <Button load={load} style={{ flex: 1 }} onPress={onSubmit} >저장</Button>
            </BottomMultiButton> */}


        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        fieldContainer: {
            gap: 8,
        },
        label: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.textTertiary,
            lineHeight: 20,
            letterSpacing: -0.35,
        },

        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            alignSelf: 'center',
            paddingHorizontal: 12,
            gap: 6,
            borderWidth: 1,
            borderColor: colors.e9e9e9,
            borderRadius: 4,
        },
        price: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            height: 48,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 20
        },
        inputView: {
            height: 48,
            justifyContent: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.fafafa,
            paddingHorizontal: 16,
            flex: 1
        },
        inputView2: {
            height: 40,
            justifyContent: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.fafafa,
            paddingHorizontal: 8,
            flex: 1
        },
        rows1: {
            width: '30%',
        },
        rows2: {
            width: '20%',
        },
        rows3: {
            width: '20%',
        },
        rows4: {
            width: '30%',
        },

    })

    return { styles }
}
