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
import { ToastMessage, getFullDateFormat, numFormat, regPhone, hpHypen, hpHypenRemove, calculateWage } from '@/libs/utils';
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

    const scRef = useRef();
    const inputRefs = useRef({});

    const titleRefs = useRef([]);
    const quantityRefs = useRef([]);
    const amountRefs = useRef([]);

    const [item, setItem] = useState(null);
    const [rrn, setRrn] = useState(null);
    const [agree, setAgree] = useState(false);

    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
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
                favorite: context?.data?.favorite,
            }));
            
            setRrn(`${context?.data?.rrn_first} - ${context?.data?.rrn_last ? context?.data?.rrn_last?.at(0) + '******' : ''}`);
        }

        setContext(null);

    }, [context])

    useEffect(() => {


    }, [item])


    const dataFunc = async () => {

        setItem({
            sdate: dayjs().format('YYYY-MM-DD'),
        })
        setRrn(null);

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

            ToastMessage('등록 되었습니다.');
            dataFunc();
            scRef.current?.scrollTo({
                y: 0,
                animated: true
            });

        }, consts.apiDelay)

    }


    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };


    const header = {
        title: 'www.ownertalk.com',
        titleStyle: {
            fontSize: 18
        },
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
                ref={scRef}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={styles.banner}>
                    <Image source={images.emoticon_0002} style={rootStyle.work05_device} />
                    <View style={[styles.circle, { width: 123, left: -36 }]} />
                    <View style={[styles.circle, { width: 100, left: '30%' }]} />
                    <View style={[styles.circle, { width: 67, left: '30%', bottom: 30 }]} />
                    <View style={[styles.circle, { width: 186, right: -30 }]} />
                </View>

                <Text style={{ ...rootStyle.font(20, colors.textPrimary, fonts.semiBold), textAlign: 'center', lineHeight: 32 }}>{`오늘도 안전하고 힘찬 하루 되세요!`}</Text>

                <View style={{ paddingTop: 36, paddingBottom: insets?.bottom + 20 }}>
                    <View style={{ paddingHorizontal: 30, gap: 30, }}>
                        <TouchableOpacity style={[rootStyle.flex, { gap: 10, marginBottom: -30, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end'  }]} onPress={() => {
                            Keyboard.dismiss();
                            router.push({
                                pathname: routes.일용노무검색,
                                params: {
                                    route: pathname,
                                    mode: 'select',
                                    find: 'favorite'
                                }
                            })
                        }}>
                            <Text style={{ ...rootStyle.font(16, colors.primaryBright, fonts.semiBold) }}>즐겨찾기 근로자 불러오기</Text>
                            <Image source={images.link2} style={rootStyle.default20} />
                        </TouchableOpacity>
                                        
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
                            {rrn ? (
                                <View style={[rootStyle.flex, { gap: 8 }]}>
                                    <TextInput
                                        displayValue={rrn}
                                        editable={false}
                                        inputContainerDisabledStyle={{ backgroundColor: colors.disabled }}
                                        containerStyle={{ flex: 1, width: 'auto' }}
                                        style={{ color: colors.textSecondary }}
                                    />
                                    <TouchableOpacity hitSlop={10} onPress={() => {
                                        setRrn(null);
                                        handleChange({ key: 'rrn_first', value: '' });
                                        handleChange({ key: 'rrn_last', value: '' });
                                        setTimeout(() => {
                                            inputRefs.current.rrn_first?.focus();
                                        }, 200)
                                    }}>
                                        <Text style={{ ...rootStyle.font(12, colors.primary, fonts.semiBold) }}>직접입력</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={[rootStyle.flex, { gap: 4 }]}>
                                    <TextInput
                                        iref={(ref) => (inputRefs.current.rrn_first = ref)}
                                        value={item?.rrn_first}
                                        onChangeText={(v) => {
                                            handleChange({ key: 'rrn_first', value: v });
                                            if (v?.length === 6) {
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
                            )}
                            
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
                            <Text style={styles.label}>출근일</Text>
                            <SelectLabel disabled icon={images.input_calendar} placeHolder={item?.sdate} />
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
                            <Button load={load} style={{ flex: 1 }} onPress={onSubmit}>등록하기</Button>
                        </View>
                    </View>
                </View>

            </KeyboardAwareScrollView>

            {/* <BottomMultiButton>
                <Button load={load} style={{ flex: 1 }} onPress={onSubmit} >등록하기</Button>
            </BottomMultiButton> */}


        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        banner: {
            paddingTop: 27,
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 20
        },
        circle: {
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.fff7ed,
            position: 'absolute',
            zIndex: -1
        },

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
