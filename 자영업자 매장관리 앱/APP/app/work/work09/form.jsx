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
import TextList from '@/components/TextList';
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
import Info from '@/components/Ui/Info';

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

    const [infoOpen, setInfoOpen] = useState(false);

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
            setTotal(
                formatFloat( 
                    unitPriceCalc({ amount: item?.amount, volume: item?.volume, percent: item?.yield }) 
                )
            );
        } else {

            let calc = item?.list?.filter(x => x?.input)?.reduce((acc, x) => acc + ( x?.input * ( unitPriceCalc({ amount: x?.amount, volume: x?.volume, percent: x?.yield, format: false }) )), 0) || 0;
            setTotal(formatFloat(calc, 0));
            setTotalInput(formatFloat(calc / item?.volume) || 0);
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
                idx: idx,
                type: typeParam
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work09/get', sender);

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

        if (!item?.title || !item?.company || !item?.amount) {
            ToastMessage('품목을 선택해주세요.');
            return;
        }
        if(!item?.unit) {
            ToastMessage('단위를 선택해주세요.');
            return;
        }
        if(!item?.volume) {
            ToastMessage('용량을 입력해주세요.');
            return;
        }
        if(!item?.yield) {
            ToastMessage('수율을 입력해주세요.');
            return;
        }
        if(!regDecimal.test(item?.yield)) {
            ToastMessage('수율을 올바르게 입력해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            company: item?.company,
            title: item?.title,
            unit: item?.unit,
            volume: item?.volume,
            yield: item?.yield,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work09/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.제품원가관리);

        }, consts.apiDelay)

    }

    const onSubmitGroup = async () => {

        if (!item?.title) {
            ToastMessage('복합 제품명을 입력해주세요.');
            return;
        }
        if(item?.list?.length < 1) {
            ToastMessage('제품을 등록해주세요.');
            return;
        }
        if(item?.list?.filter(x => !x?.idx || !x?.input )?.length > 0) {
            ToastMessage('제품 리스트를 확인해주세요.');
            return;
        }
        if (!item?.volume) {
            ToastMessage('가공 후 용량을 입력해주세요.');
            return;
        }
        if(!item?.unit) {
            ToastMessage('단위를 선택해주세요.');
            return;
        }
        
        if (load) return;

        setLoad(true);

        const sender = {
            type: type,
            idx: item?.idx,
            company: item?.company,
            title: item?.title,
            unit: item?.unit,
            volume: item?.volume,
            yield: item?.yield,
            list: item?.list
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work09/group_update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.제품원가관리);

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
        title: '제품 원가 관리',
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

                    {!idx && (
                        <View style={{ paddingHorizontal: 30, marginBottom: 23 }}>
                            <View style={[rootStyle.flex, { gap: 40, justifyContent: 'flex-start' }]}>
                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    setType(1);
                                    setItem(null);
                                }}>
                                    <Image source={type === 1 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>일반 제품</Text>
                                </TouchableOpacity>

                                <TouchableOpacity activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                    setType(2);
                                    setItem({
                                        list: []
                                    })
                                }}>
                                    <Image source={type === 2 ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>복합 제품</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {type === 1 ? (
                        <View style={{ paddingHorizontal: 30, gap: 23, }}>
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>품목명</Text>
                                <TouchableOpacity 
                                    activeOpacity={0.7} 
                                    style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
                                    onPress={() => {
                                        router.push({
                                            pathname: routes.매입품목검색,
                                            params: {
                                                route: pathname,
                                                mode: 'select'
                                            }
                                        })
                                    }}
                                >
                                    <Text style={{ ...rootStyle.font(16, item?.title ? colors.textPrimary : colors.textSecondary, fonts.regular) }}>{item?.title || '품목을 검색해주세요'}</Text>
                                    <Image source={images.search} style={rootStyle.default20} transition={100} />
                                </TouchableOpacity>
                                
                                {/* 
                                <TextInput
                                    value={item?.title}
                                    placeholder="품목을 검색해주세요"
                                    rightIcon={images.search}
                                    iconStyle={rootStyle.default20}
                                    editable={false}
                                    onPress={() => {
                                        router.push({
                                            pathname: routes.매입품목검색,
                                            params: {
                                                route: pathname,
                                                mode: 'select'
                                            }
                                        })
                                    }}
                                /> */}
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>단위</Text>
                                <Select
                                    ref={(ref) => (inputRefs.current.unit = ref)}
                                    state={item?.unit}
                                    setState={(v) => {
                                        handleChange({ key: 'unit', value: v })
                                    }}
                                    list={configOptions?.unitType || []}
                                    transformOrigin={'top center'}
                                    right={'auto'}
                                    boxStyle={{ minWidth: '100%' }}

                                // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                                >
                                    <SelectLabel title={configOptions?.unitType?.find(x => x?.idx === item?.unit)?.title} />
                                </Select>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>용량({configOptions?.unitType?.map(x => x?.title).join('/')})</Text>
                                <TextInput
                                    iref={(ref) => (inputRefs.current.volume = ref)}
                                    value={numFormatInput(item?.volume)}
                                    onChangeText={(v) => { handleChange({ key: 'volume', value: v }) }}
                                    placeholder="용량을 입력해주세요"
                                    maxLength={10}
                                    keyboardType={'number-pad'}
                                    valid={'price'}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>수율(%)</Text>
                                <TextInput
                                    iref={(ref) => (inputRefs.current.yield = ref)}
                                    value={item?.yield}
                                    onChangeText={(v) => { handleChange({ key: 'yield', value: v }) }}
                                    placeholder="수율을 입력해주세요"
                                    maxLength={5}
                                    keyboardType={'decimal-pad'}
                                    valid={'percent'}
                                />
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>원가(원)</Text>
                                <View style={styles.inputView}>
                                    <Text style={{ ...rootStyle.font(16, colors.textA6A6A6, fonts.medium) }}>{numFormatInput(item?.amount) || '0'}원</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>기준 단가</Text>
                                <TouchableOpacity 
                                    style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setInfoOpen(!infoOpen);
                                    }}
                                >
                                    <Text style={{ ...rootStyle.font(16, colors.textA6A6A6, fonts.medium) }}>
                                        {total || '0'}원{item?.unit ? `/${item?.unit}` : ""}
                                    </Text>

                                    <Image source={images.select_down2} style={[rootStyle.default, { transform: [{ rotate: infoOpen ? '180deg' : '0deg' }] }]} tintColor={colors.textA6A6A6}/>

                                    {/* <Info 
                                        infoComponent={
                                            <View style={{  gap: 16, borderRadius: 12, borderWidth: 0.5, borderColor: colors.b1b1b1, backgroundColor: colors.white, padding: 12 }}>
                                                <Text style={{...rootStyle.font(14, colors.dark, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>{`서로에게 꼭 보여주고 싶은 사진과 그 이유를 나누며,\n두 사람 사이에 인연의 씨앗이 조심스레 자리 잡는\n특별한 컨텐츠입니다.`}</Text>
                                                <Text style={{ ...rootStyle.font(12, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>• 해당 컨텐츠는 가을(3일차)에 확인 할 수 있습니다.</Text>
                                            </View>
                                        }
                                        boxStyle={{ minWidth: '50%', maxWidth: '70%' }}
                                    >
                                        <Image source={images.info} style={rootStyle.default20} tintColor={colors.textA6A6A6}/>
                                    </Info> */}
                                    
                                </TouchableOpacity>

                                {infoOpen && (
                                    <View style={{ paddingLeft: 5, gap: 10 }}>
                                        <Text style={{...rootStyle.font(12, colors.textLight, fonts.semiBold) }}>기준단가 산출 기준</Text>
                                        <View style={{ gap: 3 }}>
                                            <Text style={{...rootStyle.font(11, colors.textLight, fonts.medium)}}>
                                                {`${total || '0'}원 ${item?.unit ? `/ ${item?.unit}` : ""}`}
                                            </Text>
                                            <Text style={{...rootStyle.font(11, colors.textLight, fonts.medium)}}>
                                                {`${numFormatInput(item?.amount) || 0}원 ÷ (${numFormatInput(item?.volume) || 0}g × 수율 ${item?.yield || 0}%)\n\n※ 화면 표시: 소수점 2자리`}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                
                            </View>

                        </View>
                    ) : (
                        <>
                            <View style={{ paddingHorizontal: 30, gap: 23, }}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>복합 제품명</Text>
                                    <TextInput
                                        iref={(ref) => (inputRefs.current.title = ref)}
                                        value={item?.title}
                                        onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                                        placeholder="복합 제품명을 입력해주세요"
                                        maxLength={20}
                                    />
                                </View>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>제품 리스트</Text>

                                    <View style={[rootStyle.flex, { gap: 4 }]}>
                                        <TouchableOpacity style={styles.addButton} onPress={() => {
                                            router.push({
                                                pathname: routes.제품검색,
                                                params: {
                                                    route: pathname
                                                }
                                            })
                                        }}>
                                            <Text style={{ ...rootStyle.font(14, colors.text313131, fonts.medium) }}>제품 불러오기</Text>
                                        </TouchableOpacity>
                                        {/* <TouchableOpacity style={styles.addButton} onPress={() => {
                                            if (item?.list?.length >= 30) {
                                                ToastMessage('더이상 추가할 수 없습니다.');
                                                return;
                                            }
                                            handleChange({
                                                key: 'list',
                                                value: [...item?.list, {}]
                                            })
                                        }}>
                                            <Image source={images.add_black} style={rootStyle.default16} />
                                        </TouchableOpacity> */}
                                    </View>
                                </View>
                            </View>


                            <View style={{ marginTop: 17, gap: 12 }}>
                                <View style={[rootStyle.flex, { height: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.efeff5 }]}>
                                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>제품명</Text>
                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>{`투입량\n(g/ml)`}</Text>
                                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>기준단가</Text>
                                    <View style={{...styles.rows4}}>
                                        <Info 
                                            infoComponent={
                                                <View style={{ gap: 16, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderGray, backgroundColor: colors.white, padding: 12 }}>
                                                    <Text style={{...rootStyle.font(12, colors.text686B70, fonts.regular ), lineHeight: 20, }}>
                                                        {`① 재료원가 계산 기준 1\n12.3456원 × 120g\n= 1,481.472원\n→ 반올림: 1,482원`}
                                                    </Text>
                                                    <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.regular ), lineHeight: 20, }}>
                                                        {`② 재료원가 계산 기준 2\n0.0292원 × 20g\n= 0.584원\n→ 1원 미만으로 표시 ( < 1원 )`}
                                                    </Text>
                                                </View>
                                            }
                                            boxStyle={{ minWidth: 'auto'}}
                                        >
                                            <View style={[rootStyle.flex, { gap: 4, alignItems: 'center', justifyContent: 'center' }]}>
                                                <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center' }}>재료원가</Text>
                                                <Image source={images.info} style={rootStyle.default16} tintColor={colors.textA6A6A6}/>
                                            </View>
                                        </Info>
                                    </View>
                                    
                                </View>

                                <View style={{ gap: 7, paddingHorizontal: 12 }}>
                                    {item?.list?.map((x, i) => {
                                        let calc = unitPriceCalc({ amount: x?.amount, volume: x?.volume, percent: x?.yield, format: false });
                                        let calcValue = formatFloat(x?.input * calc, 0);
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
                                                        <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 12, colors.textA6A6A6, fonts.medium) }}>{formatFloat(calc)}원</Text>
                                                    </View>
                                                </View>

                                                <View style={[rootStyle.flex, { gap: 4, ...styles.rows4 }]}>
                                                    <View style={styles.inputView2}>
                                                        <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 12, colors.textA6A6A6, fonts.medium) }}>{(calcValue < 1 && x?.input) ? '< 1' : (calcValue || '0')}원</Text>
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


                                <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                                    <View style={{ gap: 7 }}>
                                        <View style={styles.price}>
                                            <Text style={{...rootStyle.font(14, colors.textPrimary, fonts. semiBold)}}>소계</Text>
                                            <Text style={{...rootStyle.font(14, colors.textA6A6A6, fonts. medium)}}>{total || '0'}원</Text>
                                        </View>
                                        <TextList dotStyle={{ width: 10 }} style={{...rootStyle.font(11, colors.textLight, fonts.medium), lineHeight: 16 }}>{`각 재료의 실제 원가를 합산한 후 마지막에 한 번 반올림한 금액입니다`}</TextList>
                                    </View>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>가공 후 용량</Text>
                                        <TextInput
                                            iref={(ref) => (inputRefs.current.volume = ref)}
                                            value={numFormatInput(item?.volume)}
                                            onChangeText={(v) => { handleChange({ key: 'volume', value: v }) }}
                                            placeholder="예: 1회 제공량 350g"
                                            maxLength={10}
                                            keyboardType={'number-pad'}
                                            valid={'price'}
                                        />
                                    </View>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>단위</Text>
                                        <Select
                                            ref={(ref) => (inputRefs.current.unit = ref)}
                                            state={item?.unit}
                                            setState={(v) => {
                                                handleChange({ key: 'unit', value: v })
                                            }}
                                            list={configOptions?.unitType || []}
                                            transformOrigin={'top center'}
                                            right={'auto'}
                                            boxStyle={{ minWidth: '100%' }}
                                        // onSubmitEditing={() => inputRefs.current?.price?.focus()}
                                        >
                                            <SelectLabel title={configOptions?.unitType?.find(x => x?.idx === item?.unit)?.title} />
                                        </Select>
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>기준 단가</Text>
                                        <View style={styles.inputView}>
                                            <Text style={{ ...rootStyle.font(16, colors.textA6A6A6, fonts.medium) }}>
                                                {(totalInput) || '0'}원{item?.unit ? `/${item?.unit}` : ""}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}


                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                            <Button load={load} style={{ flex: 1 }} onPress={() => {
                                type === 1 ? onSubmit() : onSubmitGroup()
                            }} >저장</Button>
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
