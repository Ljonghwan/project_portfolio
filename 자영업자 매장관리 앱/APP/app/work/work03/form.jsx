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
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, hpHypen, hpHypenRemove, calculateWage } from '@/libs/utils';
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
    const [endless, setEndless] = useState(false);

    const [initLoad, setInitLoad] = useState(Boolean(idx)); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        dataFunc();
    }, [idx])


    useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'select') {
            setItem(prev => ({
                ...prev,
                work_type: context?.data?.work_type,
                work_day: context?.data?.work_day,
                work_stime: context?.data?.work_stime,
                work_etime: context?.data?.work_etime,
                pay_type: 1,
                pay: context?.data?.pay,
            }));
        }
        if (context?.key === 'copy') {
            setItem(prev => ({
                ...prev,
                name: context?.data?.name,
                rrn_first: context?.data?.rrn_first,
                rrn_last: context?.data?.rrn_last,
                hp: context?.data?.hp,
                work_type: context?.data?.work_type,
                work_stime: context?.data?.work_stime,
                work_etime: context?.data?.work_etime,
                pay_type: 1,
                pay: context?.data?.pay,
            }));
        }

        setContext(null);

    }, [context])

    useEffect(() => {


    }, [item])


    const dataFunc = async () => {

        if (idx) {
            const sender = {
                idx: idx,
                type: typeParam
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work03/get', sender);

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
                sdate: dayjs().format('YYYY-MM-DD'),
            })
        }

    }

    const onSubmit = async () => {

        Keyboard.dismiss();

        if (!item?.name) {
            ToastMessage('이름을 입력해주세요.');
            return;
        }
        if (!item?.rrn_first || item?.rrn_first?.length < 6) {
            ToastMessage('주민등록번호 앞자리를 입력해주세요.');
            return;
        }
        if (!item?.rrn_last || item?.rrn_last?.length < 7) {
            ToastMessage('주민등록번호 뒷자리를 입력해주세요.');
            return;
        }
        if (!item?.hp || item?.hp?.length < 11) {
            ToastMessage('연락처를 입력해주세요.');
            return;
        }
        if (!item?.sdate) {
            ToastMessage('근무일자를 선택해주세요.');
            return;
        }
        if(!item?.work_stime || !item?.work_etime || !item?.pay) {
            ToastMessage('근무 형태를 선택해주세요.');
            return;
        }
        

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            name: item?.name,
            rrn_first: item?.rrn_first,
            rrn_last: item?.rrn_last,
            hp: item?.hp,
            sdate: item?.sdate,
            work_type: item?.work_type,
            work_stime: item?.work_stime,
            work_etime: item?.work_etime,
            pay: item?.pay,
            memo: item?.memo,
            favorite: item?.favorite,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work03/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.일용노무대장);

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
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/work02/delete', sender);

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
        title: '일용노무대장',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '근로자 불러오기',
            textStyle: {
                color: colors.primary,
            },
            onPress: () => {
                router.push({
                    pathname: routes.일용노무검색,
                    params: {
                        route: pathname,
                        mode: 'select'
                    }
                });
            }
        }
    };


    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <KeyboardAwareScrollView
                bottomOffset={250}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ paddingTop: 20, paddingBottom: insets?.bottom + 20 }}>
                    <View style={{ paddingHorizontal: 30, gap: 30, }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>근무일자</Text>
                            {/* <DatePicker
                                onDateChange={({ startDate }) => { handleChange({ key: 'sdate', value: startDate }) }}
                                initialStartDate={item?.sdate}
                                initialEndDate={item?.sdate}
                                mode={'pick'}
                            >
                                <SelectLabel title={item?.sdate} icon={images.input_calendar} placeHolder='근무일자' />
                            </DatePicker> */}

                            <InputDate
                                state={item?.sdate} 
                                setState={(v) => handleChange({ key: 'sdate', value: v })} 
                                placeholder={'근무일자'} 
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>이름</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.name = ref)}
                                value={item?.name}
                                onChangeText={(v) => { handleChange({ key: 'name', value: v }) }}
                                placeholder="이름을 입력해주세요"
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>주민등록번호</Text>
                            <View style={[rootStyle.flex, { gap: 4 }]}>
                                <TextInput
                                    iref={(ref) => (inputRefs.current.rrn_first = ref)}
                                    value={item?.rrn_first}
                                    onChangeText={(v) => { 
                                        handleChange({ key: 'rrn_first', value: v });
                                        if(v?.length === 6) {
                                            inputRefs.current.rrn_last?.focus();
                                        }
                                    }}
                                    placeholder="앞자리 입력"
                                    maxLength={6}
                                    containerStyle={{ flex: 1 }}
                                    keyboardType={'number-pad'}
                                    // editable={!item?.idx}
                                    // inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                />
                                <TextInput
                                    iref={(ref) => (inputRefs.current.rrn_last = ref)}
                                    value={item?.rrn_last}
                                    onChangeText={(v) => { handleChange({ key: 'rrn_last', value: v }) }}
                                    placeholder="뒷자리 입력"
                                    maxLength={7}
                                    containerStyle={{ flex: 1 }}
                                    keyboardType={'number-pad'}
                                    // editable={!item?.idx}
                                    // inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>연락처</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.hp = ref)}
                                value={item?.hp}
                                displayValue={hpHypen(hpHypenRemove(item?.hp))}
                                onChangeText={(v) => { handleChange({ key: 'hp', value: v }) }}
                                placeholder="연락처를 입력해주세요"
                                maxLength={13}
                                keyboardType={'number-pad'}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>근무형태</Text>
                            <TouchableOpacity 
                                activeOpacity={0.7} 
                                style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    router.push({
                                        pathname: routes.근무형태검색,
                                        params: {
                                            route: pathname,
                                            mode: 'select'
                                        }
                                    })
                                }}
                            >
                                <Text style={{ ...rootStyle.font(16, item?.work_type ? colors.textPrimary : colors.textSecondary, fonts.regular) }}>{item?.work_type || '근무형태를 검색해주세요'}</Text>
                                <Image source={images.search} style={rootStyle.default20} transition={100} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>일당</Text>
                            <TextInput
                                displayValue={numFormat(calculateWage(item?.work_stime, item?.work_etime, item?.pay)) + '원'}
                                editable={false}
                                inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                style={{ color: colors.textSecondary }}
                            />
                        </View>

                        <View style={[styles.fieldContainer, { marginTop: 10 }]}>
                            <Text style={styles.label}>비고 (선택)</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.memo = ref)}
                                value={item?.memo}
                                onChangeText={(v) => { handleChange({ key: 'memo', value: v }) }}
                                maxLength={100}
                                placeholder={'조기퇴근 / 결근 / 기타 사항 텍스트 입력'}
                            />
                        </View>
                        <CheckBox
                            type={2}
                            label="즐겨찾기로 저장"
                            checked={ item?.favorite }
                            onPress={() => handleChange({ key: 'favorite', value: !item?.favorite })}
                            checkboxStyle={{ width: 24 }}
                            labelStyle={{
                                fontSize: 16
                            }}
                        />
                    </View>


                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {/* {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>} */}
                            <Button load={load} style={{ flex: 1 }} onPress={onSubmit}>저장</Button>
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
            gap: 12,
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
        box: {
            paddingVertical: 28,
            paddingLeft: 26,
            paddingRight: 32,
            borderRadius: 10,
            backgroundColor: colors.fafafa,
            gap: 24
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
