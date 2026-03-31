import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Keyboard,
    Pressable,
    Platform
} from 'react-native';

import { router, useFocusEffect, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image, ImageBackground } from 'expo-image';
import { throttle } from 'lodash';
import { ScrollView } from 'react-native-gesture-handler';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import TextArea from '@/components/TextArea';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import Carousel from '@/components/Carousel';

import BottomMultiButton from '@/components/BottomMultiButton';
import Button from '@/components/Button';

import SelectLabel from '@/components/Ui/SelectLabel';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';
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
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, hpHypen, hpHypenRemove } from '@/libs/utils';


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

    const [templateList, setTemplateList] = useState([]);

    const [item, setItem] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [customersText, setCustomersText] = useState("");

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        getTemplateList();
        dataFunc();
    }, [idx])


    useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'list') {
            setCustomers(context?.data?.list);
            setCustomersText(context?.data?.text);
        }

        setContext(null);

    }, [context])

    useEffect(() => {


    }, [item])

    const getTemplateList = async () => {
        const { data, error } = await API.post('/v1/work06/template');
        setTemplateList(data || []);
    }

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


        } else {
            setItem({
                type: 1,
            })
        }

        setTimeout(() => {
            setInitLoad(false)
        }, consts.apiDelay)

    }

    const onSubmit = async () => {

        if(!item?.title) {
            ToastMessage('이벤트명을 입력해주세요.');
            return;
        }
        if(!item?.comment) {
            ToastMessage('이벤트 설명을 입력해주세요.');
            return;
        }
        if(!item?.sdate) {
            ToastMessage('진행기간을 선택해주세요.');
            return;
        }
        if(!item?.edate) {
            ToastMessage('진행기간을 선택해주세요.');
            return;
        }
        if(!item?.type) {
            ToastMessage('할인 방식을 선택해주세요.');
            return;
        }
        if(!item?.discount) {
            ToastMessage('할인 금액을 입력해주세요.');
            return;
        }
        if(!customers || customers?.length < 1) {
            ToastMessage('대상 고객을 선택해주세요.');
            return;
        }
        if(!item?.template_idx) {
            ToastMessage('템플릿을 선택해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            title: item?.title,
            comment: item?.comment,
            sdate: item?.sdate,
            edate: item?.edate,
            type: item?.type,
            discount: item?.discount,
            min_amount: item?.min_amount,
            template_idx: item?.template_idx,
            customers: customers,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work06/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            router.dismissTo(routes.이벤트관리);

        }, consts.apiDelay)

    }


    const onPreview = () => {
        if(!item?.title) {
            ToastMessage('이벤트명을 입력해주세요.');
            return;
        }
        if(!item?.comment) {
            ToastMessage('이벤트 설명을 입력해주세요.');
            return;
        }
        if(!item?.sdate) {
            ToastMessage('진행기간을 선택해주세요.');
            return;
        }
        if(!item?.edate) {
            ToastMessage('진행기간을 선택해주세요.');
            return;
        }
        if(!item?.type) {
            ToastMessage('할인 방식을 선택해주세요.');
            return;
        }
        if(!item?.discount) {
            ToastMessage('할인 금액을 입력해주세요.');
            return;
        }
        if(!item?.template_idx) {
            ToastMessage('템플릿을 선택해주세요.');
            return;
        }

        router.push({
            pathname: routes.이벤트미리보기,
            params: {
                item: JSON.stringify(item)
            }
        })
    }
    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };


    const renderTemplateItem = ({ item: x, index }) => {
        return (
            <Pressable 
                style={{ 
                    width: 140, 
                    aspectRatio: 9/16, 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: item?.template_idx === x?.idx ? colors.primary : colors.white
                }}
                activeOpacity={0.7} 
                onPress={() => {
                    handleChange({ key: 'template_idx', value: x?.idx }) 
                }}
            >
                <ImageBackground
                    source={consts.s3Url + x?.image}
                    style={{ 
                        width: '100%', 
                        height: '100%',
                        padding: 10, 
                        justifyContent: (x?.layout == 1 ? 'flex-end' : x?.layout == 2 ? 'space-between' : 'flex-start'),
                        gap: 10,
                    }}
                >
                    {item?.template_idx === x?.idx && 
                        <View style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                            <Image source={images.check2_on} style={{ width: '100%', aspectRatio: 1 }} transition={50} />
                        </View>
                    }
                    <View style={{ gap: 4 }}>
                        <Text style={[x?.title_style, { fontSize: 14, fontFamily: fonts.medium }]}>제목 영역</Text>
                        <Text style={[x?.sub_title_style, { fontSize: 12,  }]}>이벤트 설명</Text>
                    </View>

                    <View style={[x?.button_style, { alignItems: 'center', justifyContent: 'center', borderRadius: 3, height: 20 }]}>
                        <Text style={{...rootStyle.font(12, colors.white, fonts.medium)}}>{x?.button}</Text>
                    </View>
                </ImageBackground>
            </Pressable>
        )
    }


    const header = {
        title: '이벤트등록',
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

                <View style={{ paddingTop: 20, paddingBottom: insets?.bottom + 20, gap: 20 }}>
                    <View style={{ paddingHorizontal: 30, gap: 20, }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>이벤트명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.title = ref)}
                                value={item?.title}
                                onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                                placeholder="예: 단골전용 10% 할인쿠폰"
                                maxLength={30}
                            />
                        </View>

                        <View style={[styles.fieldContainer]}>
                            <Text style={styles.label}>이벤트 설명</Text>
                            <TextArea
                                iref={(ref) => (inputRefs.current.comment = ref)}
                                value={item?.comment}
                                onChangeText={(v) => { handleChange({ key: 'comment', value: v }) }}
                                maxLength={200}
                                placeholder={'예: 첫 방문 고객 대상, 결제 시 10% 즉시 할인'}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>진행기간</Text>
                            <View style={[rootStyle.flex, { gap: 10 }]}>
                                <View style={{ flex: 1 }}>
                                    {/* <DatePicker
                                        onDateChange={({ startDate }) => { handleChange({ key: 'sdate', value: startDate }) }}
                                        initialStartDate={item?.sdate}
                                        initialEndDate={item?.sdate}
                                        mode={'pick'}
                                        minDate={dayjs().format('YYYY-MM-DD')}
                                    >
                                        <SelectLabel title={item?.sdate} icon={images.input_calendar} placeHolder='시작일' />
                                    </DatePicker> */}

                                    <InputDate
                                        state={item?.sdate} 
                                        setState={(v) => handleChange({ key: 'sdate', value: v })} 
                                        placeholder={'시작일'} 
                                    />
                                </View>
                                <Text>~</Text>
                                    <View style={{ flex: 1 }}>
                                        {/* <DatePicker
                                            onDateChange={({ startDate }) => { handleChange({ key: 'edate', value: startDate }) }}
                                            initialStartDate={item?.edate}
                                            initialEndDate={item?.edate}
                                            mode={'pick'}
                                            minDate={item?.sdate}
                                        >
                                            <SelectLabel title={item?.edate} icon={images.input_calendar} placeHolder='종료일' />
                                        </DatePicker> */}
                                        <InputDate
                                            state={item?.edate} 
                                            setState={(v) => handleChange({ key: 'edate', value: v })} 
                                            placeholder={'종료일'} 
                                            minDate={item?.sdate}
                                        />
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>할인 방식</Text>
                            
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 40 }]}>
                                {configOptions?.eventType?.map((x, i) => {
                                    return (
                                        <Pressable key={i} activeOpacity={0.7} hitSlop={10} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                                            handleChange({ key: 'type', value: x?.idx });
                                            handleChange({ key: 'discount', value: '' });
                                        }}>
                                            <Image source={x?.idx === item?.type ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                            <Text style={{ ...rootStyle.font(14, colors.black, fonts.medium), flexShrink: 1 }}>{x?.title}</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>


                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>할인 금액</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.discount = ref)}
                                value={item?.type === 1 ? numFormatInput(item?.discount) : item?.discount}
                                valid={'price'}
                                onChangeText={(v) => { handleChange({ key: 'discount', value: v }) }}
                                placeholder={item?.type === 1 ? `예 : 3,000원` : `예 : 10%`}
                                maxLength={item?.type === 1 ? 10 : 3 }
                                keyboardType={'number-pad'}
                                isRemove={false}
                                withText={item?.type === 1 ? `원` : `%`}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>최소 결제 금액 (선택)</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.min_amount = ref)}
                                value={item?.min_amount}
                                onChangeText={(v) => { handleChange({ key: 'min_amount', value: v }) }}
                                placeholder={'예: 10,000원 이상 시 사용 가능'}
                                maxLength={30}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>대상 고객</Text>
                            <Pressable 
                                activeOpacity={0.7} 
                                style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    router.push({
                                        pathname: routes.고객검색,
                                        params: {
                                            route: pathname
                                        }
                                    })
                                }}
                            >
                                <Text style={{ ...rootStyle.font(16, customersText ? colors.textPrimary : colors.textSecondary, fonts.regular) }}>{customersText || '대상 고객 선택'}</Text>
                                <Image source={images.search} style={rootStyle.default20} transition={100} />
                            </Pressable>
                        </View>
                    </View>

                    <View>
                        <View style={[styles.fieldContainer]}>
                            <Text style={[styles.label, { marginHorizontal: 30 }]}>템플릿</Text>
                            <Text style={{...rootStyle.font(12, colors.text757575, fonts.medium), marginHorizontal: 30, lineHeight: 22, marginTop: -10 }}>* 실제 발송될 쿠폰은 미리보기로 확인해주세요.</Text>


                            <Carousel 
                                style={{ flex: 1, width: '100%'}}
                                listStyle={{ backgroundColor: colors.white }}
                                containerStyle={{ gap: 10, paddingHorizontal: 30 }}
                                list={templateList} 
                                renderItem={renderTemplateItem}
                                pagination={false}
                                pagingEnabled={false}
                            /> 

                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            <Button type={2} style={{ flex: 1 }} onPress={onPreview} >쿠폰 미리보기</Button>
                            <Button load={load} style={{ flex: 1 }} onPress={onSubmit}>쿠폰 발행</Button>
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
