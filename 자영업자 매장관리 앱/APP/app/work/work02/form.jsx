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
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

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

import Memo from '@/components/Popup/Memo';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useAlert, useLoader, useConfig, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, regDecimal, isValidJSON, unitPriceCalc, formatFloat } from '@/libs/utils';
import { aspectRatio } from '@expo/ui/swift-ui/modifiers';


export default function Page({ }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

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

        setTotal(item?.list?.filter(x => x?.input)?.reduce((acc, x) => acc + (x?.input * x?.calc), 0) || 0);

    }, [item])

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

        if (context?.key === 'list') {
            if (item?.list?.length + context?.data?.length > 30) {
                ToastMessage('최대 30개의 재료만 등록할 수 있습니다.');
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
                idx: idx,
                type: typeParam
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work02/get', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            setItem(data);
            setType(data?.type === '복합' ? 2 : 1);

            setTimeout(() => {
                setInitLoad(false)
            }, consts.apiDelay)


        } else {
            console.log("?????????");
            setItem({
                list: []
            })
        }

    }

    const onSubmit = async () => {

        if (!item?.title) {
            ToastMessage('메뉴명을 입력해주세요.');
            return;
        }
        if (!item?.category) {
            ToastMessage('카테고리를 선택해주세요.');
            return;
        }
        if (!item?.amount) {
            ToastMessage('판매가격을 입력해주세요.');
            return;
        }
        if (item?.list?.length < 1) {
            ToastMessage('원재료를 등록해주세요.');
            return;
        }
        if (item?.list?.filter(x => !x?.target_idx || !x?.input)?.length > 0) {
            ToastMessage('원재료 리스트를 확인해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            title: item?.title,
            category: item?.category,
            amount: item?.amount,
            list: item?.list
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work02/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.원가계산기);

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
        title: '원가계산기',
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
                    <View style={{ paddingHorizontal: 30, gap: 23, }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>메뉴명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.title = ref)}
                                value={item?.title}
                                onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                                placeholder="메뉴명을 입력해주세요"
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>카테고리</Text>
                            <Select
                                ref={(ref) => (inputRefs.current.category = ref)}
                                state={item?.category}
                                setState={(v) => {
                                    handleChange({ key: 'category', value: v })
                                }}
                                list={configOptions?.menuCategory || []}
                                transformOrigin={'top center'}
                                right={'auto'}
                                boxStyle={{ minWidth: '100%' }}
                            // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                            >
                                <SelectLabel title={configOptions?.menuCategory?.find(x => x?.idx === item?.category)?.title} />
                            </Select>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>판매 가격</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.amount = ref)}
                                value={numFormatInput(item?.amount)}
                                onChangeText={(v) => { handleChange({ key: 'amount', value: v }) }}
                                placeholder="판매가격을 입력해주세요"
                                maxLength={10}
                                keyboardType={'number-pad'}
                                valid={'price'}
                            />
                        </View>


                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>원재료</Text>

                            <View style={[rootStyle.flex, { gap: 4 }]}>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    router.push({
                                        pathname: routes.제품검색,
                                        params: {
                                            route: pathname,
                                            all: true
                                        }
                                    })
                                }}>
                                    <Text style={{ ...rootStyle.font(14, colors.text313131, fonts.medium) }}>재료 추가</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>


                    <View style={{ marginTop: 17, gap: 12 }}>
                        <View style={[rootStyle.flex, { height: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.efeff5 }]}>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>제품명</Text>
                            <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>{`투입량\n(g/ml)`}</Text>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>기준단가</Text>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>소계</Text>
                        </View>

                        <View style={{ gap: 7, paddingHorizontal: 12 }}>
                            {item?.list?.map((x, i) => {
                                return (
                                    <Animated.View entering={FadeIn} key={i} style={[rootStyle.flex, { gap: 5 }]}>

                                        <View style={[rootStyle.flex, { gap: 4, ...styles.rows1 }]}>
                                            <View style={styles.inputView2}>
                                                <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium) }}>{x?.title}</Text>
                                            </View>
                                        </View>

                                        <TextInput
                                            iref={(ref) => (quantityRefs.current[i] = ref)}
                                            keyboardType={'number-pad'}
                                            valid={'price'}
                                            value={numFormatInput(x?.input)}
                                            onChangeText={(v) => {
                                                handleChange({
                                                    key: 'list',
                                                    value: item?.list?.map((xx, ii) => {
                                                        if (ii !== i) return xx;
                                                        return { ...xx, input: v }
                                                    })
                                                })
                                            }}
                                            placeholder="입력"
                                            maxLength={6}
                                            containerStyle={{ ...styles.rows2 }}
                                            inputContainerStyle={{ height: 40, paddingHorizontal: 8 }}
                                            style={{ fontSize: 11 }}
                                            isRemove={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => quantityRefs?.current?.[i + 1]?.focus()}
                                        />

                                        <View style={[rootStyle.flex, { gap: 4, ...styles.rows3 }]}>
                                            <View style={styles.inputView2}>
                                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 12, colors.textA6A6A6, fonts.medium) }}>{formatFloat(x?.calc)}원</Text>
                                            </View>
                                        </View>

                                        <View style={[rootStyle.flex, { gap: 4, ...styles.rows4 }]}>
                                            <View style={styles.inputView2}>
                                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 12, colors.textA6A6A6, fonts.medium) }}>{(formatFloat(x?.input * x?.calc, 0) )|| '0'}원</Text>
                                            </View>

                                            <TouchableOpacity style={[styles.addButton, { height: 24, aspectRatio: 1 }]} onPress={() => {
                                                handleChange({
                                                    key: 'list',
                                                    value: item?.list?.filter((xx, ii) => ii !== i)
                                                })
                                            }}>
                                                <Image source={images.minus} style={rootStyle.default12} />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )
                            })}

                            {item?.list?.length < 1 && (
                                <Empty msg={'제품을 등록해주세요.'} style={{ paddingBottom: 0, height: 100 }} />
                            )}
                        </View>
                        

                    </View>


                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>

                        <View style={styles.box}>
                            <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>계산 결과</Text>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium)}}>원가 합계</Text>
                                <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{numFormatInput(total?.toFixed(0)) || 0}원</Text>
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium)}}>판매가격</Text>
                                <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{numFormat(item?.amount)}원</Text>
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{...rootStyle.font(16, colors.text757575, fonts.medium)}}>마진</Text>
                                <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{item?.amount ? numFormat( ( (item?.amount - total) / item?.amount * 100 || 0).toFixed(1) ) : '0'}%</Text>
                            </View>
                        </View>

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
        box: {
            paddingVertical: 28,
            paddingLeft: 26,
            paddingRight: 32,
            borderRadius: 10,
            backgroundColor: colors.fafafa,
            gap: 24
        },
        rows1: {
            width: '28%',
        },
        rows2: {
            width: '17%',
        },
        rows3: {
            width: '25%',
        },
        rows4: {
            width: '30%',
        },

    })

    return { styles }
}
