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
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, hpHypen, hpHypenRemove } from '@/libs/utils';
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

        setContext(null);

    }, [context])

    useEffect(() => {


    }, [item])


    const dataFunc = async () => {

        if (idx) {
            const sender = {
                idx: idx,
            }
            const { data, error } = await API.post('/v1/work05/get', sender);

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
            setItem({
                gender: 1,
            })
        }

    }

    const onSubmit = async () => {

        if (!item?.name) {
            ToastMessage('이름을 입력해주세요.');
            return;
        }
        if (item?.hp?.length < 11) {
            ToastMessage('연락처를 입력해주세요.');
            return;
        }
        if (!item?.gender) {
            ToastMessage('성별을 선택해주세요.');
            return;
        }
        if (!item?.age) {
            ToastMessage('연령대를 선택해주세요.');
            return;
        }
        if (!item?.visit) {
            ToastMessage('방문경로를 선택해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            name: item?.name,
            hp: item?.hp,
            gender: item?.gender,
            age: item?.age,
            visit: item?.visit,
            memo: item?.memo,
            vip: item?.vip,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work05/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.고객관리);

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

        const { data, error } = await API.post('/v1/work05/delete', sender);

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

            <KeyboardAwareScrollView
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ paddingTop: 20, paddingBottom: insets?.bottom + 20 }}>
                    <View style={{ paddingHorizontal: 30, gap: 20, }}>
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
                            <Text style={styles.label}>성별</Text>
                            
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 40 }]}>
                                {configOptions?.genderType?.map((x, i) => {
                                    return (
                                        <TouchableOpacity key={i} activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                            handleChange({ key: 'gender', value: x?.idx });
                                        }}>
                                            <Image source={x?.idx === item?.gender ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                            <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>{x?.title}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>연령대</Text>
                            
                            <Select
                                ref={(ref) => (inputRefs.current.age = ref)}
                                state={item?.age}
                                setState={(v) => {
                                    handleChange({ key: 'age', value: v })
                                }}
                                list={configOptions?.ageType || []}
                                transformOrigin={'top center'}
                                right={'auto'}
                                boxStyle={{ minWidth: '100%' }}
                            // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                            >
                                <SelectLabel title={configOptions?.ageType?.find(x => x?.idx === item?.age)?.title} />
                            </Select>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>방문경로</Text>
                            
                            <Select
                                ref={(ref) => (inputRefs.current.visit = ref)}
                                state={item?.visit}
                                setState={(v) => {
                                    handleChange({ key: 'visit', value: v })
                                }}
                                list={configOptions?.visitType || []}
                                transformOrigin={'top center'}
                                right={'auto'}
                                boxStyle={{ minWidth: '100%' }}
                            // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                            >
                                <SelectLabel title={configOptions?.visitType?.find(x => x?.idx === item?.visit)?.title} />
                            </Select>
                        </View>
                        
                        <View style={[styles.fieldContainer, { marginTop: 20 }]}>
                            <Text style={styles.label}>특이사항 메모</Text>
                            <TextArea
                                iref={(ref) => (inputRefs.current.memo = ref)}
                                value={item?.memo}
                                onChangeText={(v) => { handleChange({ key: 'memo', value: v }) }}
                                maxLength={200}
                                placeholder={'점심 시간대 단체 예약 다수'}
                            />
                        </View>

                        <View style={[styles.fieldContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }]}>
                            <Text style={styles.label}>VIP 설정</Text>
                            <Switch
                                value={item?.vip}
                                togglePress={() => handleChange({ key: 'vip', value: !Boolean(item?.vip) })}
                            />
                        </View>
                    </View>


                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
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
