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

    const { idx, type: typeParam, route } = useLocalSearchParams();
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
    const [endless, setEndless] = useState(false);
    const [payType, setPayType] = useState(1);

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


    }, [item])


    const dataFunc = async () => {

        if (idx) {
            const sender = {
                idx: idx,
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work07/get', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            setItem(data);
            setEndless(data?.edate ? false : true);

            setTimeout(() => {
                setInitLoad(false)
            }, consts.apiDelay)


        } else {
            console.log("?????????");
            setItem({
                type: 1,
                pay_type: 1,
                work_day: []
            })
        }

    }

    const onSubmit = async () => {

        if (!item?.work_type) {
            ToastMessage('근무형태명을 입력해주세요.');
            return;
        }
        if(item?.work_day?.length < 1) {
            ToastMessage('근무일을 선택해주세요.');
            return;
        }
        if (!item?.work_stime) {
            ToastMessage('근무 시작시간을 선택해주세요.');
            return;
        }
        if (!item?.work_etime) {
            ToastMessage('근무 종료시간을 선택해주세요.');
            return;
        }
        if (!item?.pay) {
            ToastMessage('시급을 입력해주세요.');
            return;
        }
        

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            work_type: item?.work_type,
            work_day: consts.week?.filter(x => item?.work_day?.includes(x?.idx))?.map(x => x?.idx),
            work_stime: item?.work_stime,
            work_etime: item?.work_etime,
            pay: item?.pay,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work07/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(route || routes.근무형태관리);

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
        title: '근무형태 관리',
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
                contentContainerStyle={{
                    paddingTop: 17,
                    paddingBottom: insets?.bottom + 100,
                }}
            >

                <View style={{}}>
                    <View style={{ paddingHorizontal: 30, gap: 30, }}>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>근무형태명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.work_type = ref)}
                                value={item?.work_type}
                                onChangeText={(v) => { handleChange({ key: 'work_type', value: v }) }}
                                placeholder="예 : 주간 홀"
                                maxLength={30}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>근무일 / 시간</Text>
                            
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 16, flexWrap: 'wrap', width: 260 }]}>
                                {consts.week?.map((x, i) => {
                                    return (
                                        <TouchableOpacity key={i} activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 16 }]} onPress={() => {
                                            let v = item?.work_day?.includes(x?.idx) ? item?.work_day?.filter(y => y !== x?.idx) : [...item?.work_day || [] , x?.idx]

                                            handleChange({ key: 'work_day', value: v });
                                        }}>
                                            <Image source={item?.work_day?.includes(x?.idx) ? images.check2_on : images.check2_off} style={rootStyle.default20} transition={100} />
                                            <Text style={{ ...rootStyle.font(16, colors.black, fonts.medium), flexShrink: 1, lineHeight: 36  }}>{x?.title}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            <View style={[rootStyle.flex, { gap: 5 }]}>
                                <InputTime 
                                    state={item?.work_stime} 
                                    setState={(v) => handleChange({ key: 'work_stime', value: v })} 
                                    placeholder={'선택'} 
                                    style={{ flex: 1 }}
                                />
                                <Text style={{ ...rootStyle.font(18, colors.black, fonts.medium) }}>~</Text>
                                <InputTime 
                                    state={item?.work_etime} 
                                    setState={(v) => handleChange({ key: 'work_etime', value: v })} 
                                    placeholder={'선택'} 
                                    style={{ flex: 1 }}
                                />
                            </View>

                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>시급</Text>
                            
                            <TextInput
                                iref={(ref) => (inputRefs.current.pay = ref)}
                                value={numFormatInput(item?.pay)}
                                valid={'price'}
                                onChangeText={(v) => { handleChange({ key: 'pay', value: v }) }}
                                placeholder={`시급을 입력해주세요`}
                                maxLength={10}
                                keyboardType={'number-pad'}
                                containerStyle={{ flex: 1 }}
                            />
                        </View>
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
