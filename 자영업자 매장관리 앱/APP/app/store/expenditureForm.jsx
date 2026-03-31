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

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import BottomMultiButton from '@/components/BottomMultiButton';
import Button from '@/components/Button';

import SelectLabel from '@/components/Ui/SelectLabel';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import Memo from '@/components/Popup/Memo';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useAlert, useLoader, useConfig } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, getMonthList, isValidJSON } from '@/libs/utils';


export default function Page({ }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { idx } = useLocalSearchParams();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const sheetRef = useRef();
    const inputRefs = useRef({});

    const [item, setItem] = useState(null);

    const [initLoad, setInitLoad] = useState(Boolean(idx)); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

   
    useEffect(() => {
        dataFunc();
    }, [idx])


    const dataFunc = async () => {

        if (idx) {
            const sender = {
                idx: idx,
            }
            const { data, error } = await API.post('/v1/expense/get', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            setItem({
                ...data,
                loop: Boolean(data?.loop),
                loopType: data?.loop || null,
            });

            setTimeout(() => {
                setInitLoad(false)
            }, consts.apiDelay)


        } else {
            setItem({
                date: dayjs().add(1, 'days').format('YYYY-MM-DD')
            })
        }

    }


    const onSubmit = async () => {

        if (load) return;

        Keyboard.dismiss();

        if(!item?.title) {
            ToastMessage('항목명을 입력해주세요.');
            return;
        }
        if(!item?.type) {
            ToastMessage('지출 분류를 선택해주세요.');
            return;
        }
        if(!item?.amount) {
            ToastMessage('금액을 입력해주세요.');
            return;
        }
        if(!item?.date) {
            ToastMessage('출금 예정일을 선택해주세요.');
            return;
        }
        if(item?.loop && item?.loop_end_date && dayjs(item?.loop_end_date).isBefore(dayjs(item?.date))) {
            ToastMessage('반복 종료일은 출금일 이후로 설정해주세요.');
            return;
        }

        setLoad(true);

        const sender = {
            idx: item?.idx,
            title: item?.title,
            type: item?.type,
            amount: item?.amount,
            date: item?.date,
            loop: item?.loop ? item?.loopType : 0,
            loop_end_date: item?.loop ? item?.loop_end_date : null,
            memo: item?.memo,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/expense/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.back();

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
        }

        const { data, error } = await API.post('/v1/expense/delete', sender);

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
        title: '지출 항목',
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
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ gap: 20, paddingHorizontal: rootStyle.side, paddingTop: 20, paddingBottom: insets?.bottom + 100 }}>
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>항목명</Text>
                        <TextInput
                            iref={(ref) => (inputRefs.current.title = ref)}
                            value={item?.title}
                            onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                            placeholder="예: 배달앱 정산, 카드대금, 전기세."
                            maxLength={20}
                        // returnKeyType="next"
                        // blurOnSubmit={false}
                        // onSubmitEditing={() => inputRefs.current?.cate?.onPress()}
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>지출 분류</Text>

                        <Select
                            ref={(ref) => (inputRefs.current.type = ref)}
                            state={item?.type}
                            setState={(v) => {
                                handleChange({ key: 'type', value: v })
                            }}
                            list={configOptions?.expenseType || []}
                            transformOrigin={'top center'}
                            right={'auto'}
                            boxStyle={{ minWidth: '100%' }}
                        // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                        >
                            <SelectLabel title={configOptions?.expenseType?.find(x => x?.idx === item?.type)?.title} />
                        </Select>

                        <TextInput
                            value={configOptions?.expenseCategory?.find(cate => cate?.idx === configOptions?.expenseType?.find(x => x?.idx === item?.type)?.category)?.title}
                            placeholder="비용 유형 자동 출력"
                            maxLength={20}
                            editable={false}
                        // returnKeyType="next"
                        // blurOnSubmit={false}
                        // onSubmitEditing={() => bRef.current?.focus()}
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>금액</Text>
                        <TextInput
                            iref={(ref) => (inputRefs.current.amount = ref)}
                            value={item?.amount}
                            displayValue={numFormat(item?.amount)}
                            onChangeText={(v) => { handleChange({ key: 'amount', value: v }) }}
                            placeholder="금액을 입력하세요"
                            keyboardType="number-pad"
                            maxLength={14}
                            valid={'price'}
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>출금 예정일</Text>
                        <DatePicker
                            onDateChange={({ startDate }) => { handleChange({ key: 'date', value: startDate }) }}
                            initialStartDate={item?.date}
                            initialEndDate={item?.date}
                            mode={'pick'}
                        >
                            <SelectLabel title={item?.date} icon={images.input_calendar} placeHolder='출금 예정일' />
                        </DatePicker>
                    </View>

                    <View style={[styles.fieldContainer, { gap: 20 }]}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={styles.label}>반복 설정</Text>
                            <Switch
                                value={item?.loop}
                                togglePress={() => {
                                    handleChange({ key: 'loop', value: !item?.loop })
                                    handleChange({ key: 'loopType', value: configOptions?.loopType?.[0]?.idx });
                                    // handleChange({ key: 'date', value: null });
                                }}
                            />
                        </View>

                        {item?.loop ? (
                            <Animated.View key={'loop_on'} entering={FadeIn} style={{ gap: 4 }}>
                                <Select
                                    ref={(ref) => (inputRefs.current.loopType = ref)}
                                    state={item?.loopType}
                                    setState={(v) => {
                                        handleChange({ key: 'loopType', value: v })
                                    }}
                                    list={configOptions?.loopType || []}
                                    transformOrigin={'top center'}
                                    right={'auto'}
                                    boxStyle={{ minWidth: '100%' }}
                                // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                                >
                                    <SelectLabel title={configOptions?.loopType?.find(x => x?.idx === item?.loopType)?.title} placeHolder={'주기 선택'} />
                                </Select>

                                <View style={styles.fieldContainer}>
                                    <DatePicker
                                        onDateChange={({ startDate }) => { handleChange({ key: 'loop_end_date', value: startDate }) }}
                                        initialStartDate={item?.loop_end_date}
                                        initialEndDate={item?.loop_end_date}
                                        mode={'pick'}
                                        minDate={item?.date}
                                    >
                                        <SelectLabel title={item?.loop_end_date} icon={images.input_calendar} placeHolder='반복 종료일' />
                                    </DatePicker>

                                    <Text style={{...rootStyle.font(12, colors.textSecondary)}}>* 미 입력시 종료일 없이 계속 반복됩니다.</Text>
                                </View>
                            </Animated.View>
                        ) : (
                            <></>
                            // <Animated.View key={'loop_off'} entering={FadeIn} style={styles.fieldContainer}>
                            //     <DatePicker
                            //         onDateChange={({ startDate }) => { handleChange({ key: 'date', value: startDate }) }}
                            //         initialStartDate={item?.date}
                            //         initialEndDate={item?.date}
                            //         mode={'pick'}
                            //     >
                            //         <SelectLabel title={item?.date} icon={images.input_calendar} placeHolder='출금 예정일' />
                            //     </DatePicker>
                            // </Animated.View>
                        )}
                    </View>
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>메모</Text>
                        <TextArea
                            iref={(ref) => (inputRefs.current.memo = ref)}
                            value={item?.memo}
                            onChangeText={(v) => { handleChange({ key: 'memo', value: v }) }}
                            maxLength={200}
                        />
                    </View>
                </View>

            </KeyboardAwareScrollView>

            <BottomMultiButton>
                {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                <Button load={load} style={{ flex: 1 }} onPress={onSubmit} >저장</Button>
            </BottomMultiButton>


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

    })

    return { styles }
}
