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
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, getMonthList, isValidJSON, photoShot } from '@/libs/utils';
import { aspectRatio } from '@expo/ui/swift-ui/modifiers';


export default function Page({ }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { idx, route } = useLocalSearchParams();
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
    const [image, setImage] = useState(null);

    const [total, setTotal] = useState(0);

    const [initLoad, setInitLoad] = useState(Boolean(idx)); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        dataFunc();
    }, [idx])


    useEffect(() => {
        setTotal( item?.list?.filter(x => x?.quantity && x?.amount)?.reduce((acc, x) => acc + (x?.quantity * x?.amount), 0) || 0 );
    }, [item])

    useEffect(() => {
        if(!context?.key) return;

        if(context?.key === 'list') {
            if(item?.list?.length + context?.data?.length > 30) {
                ToastMessage('최대 30개의 품목만 등록할 수 있습니다.');
            }

            handleChange({
                key: 'list',
                value: [...item?.list?.filter(x => x?.title || x?.quantity || x?.amount), ...context?.data?.filter((x, i) => i < (30 - item?.list?.length))]
            })
        }
        if(context?.key === 'ocr') {
            setImage(context?.data?.image);
            setItem( context?.data?.ocrData );

            console.log('ocrData', context?.data?.ocrData);
        }

        setContext(null);

    }, [context])

    const dataFunc = async () => {

        if(idx) {
            const sender = {
                idx: idx
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/work01/get', sender);

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
                date: dayjs().format('YYYY-MM-DD'),
                list: [{}]
            })
        }

    }
    const onSubmit = async () => {

        if(!item?.date) {
            ToastMessage('거래일자를 입력해주세요.');
            return;
        }
        if(!item?.company) {
            ToastMessage('거래처명을 입력해주세요.');
            return;
        }
        if(item?.list?.filter((x, i) => !x?.title || !x?.quantity || !x?.amount)?.length > 0 ) {
            ToastMessage('품목 리스트를 확인해주세요.')
            return;
        }
        if(item?.list?.filter((x, i) => item?.list?.filter(xx => xx?.title === x?.title)?.length > 1 )?.length > 0 ) {
            ToastMessage('품목 리스트에 동일한 품목명이 존재합니다.')
            return;
        }
       

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx, 
            type: item?.type || 1, 
            date: item?.date, 
            company: item?.company, 
            comment: item?.comment, 
            list: item?.list
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work01/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');

            router.dismissTo(route || routes.매입비관리);

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

        const { data, error } = await API.post('/v1/work01/delete', sender);

        if(error) {
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
        title: '매입 등록',
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

                    <View style={{ paddingHorizontal: 30, gap: 33, }}>

                        {image && (
                            <View style={{ gap: 20 }}>
                                <Text style={{...rootStyle.font(20, colors.black, fonts.semiBold)}}>거래명세표 정보를 확인해주세요.</Text>
                                <View style={{ paddingHorizontal: 14, gap: 12 }}>
                                    <Image source={image?.uri} style={{ width: "100%", aspectRatio: 1/1, backgroundColor: colors.placeholder, borderRadius: 12 }} />
                                    <Button type={2} onPress={async () => {
                                        const status = await photoShot();
                                        if(!status) {
                                            return;
                                        }

                                        router.back();
                                    }}>재촬영 하기</Button>
                                </View>
                            </View>
                        )}

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래일자</Text>
                            {/* <DatePicker
                                onDateChange={({ startDate }) => { handleChange({ key: 'date', value: startDate }) }}
                                initialStartDate={item?.date}
                                initialEndDate={item?.date}
                                mode={'pick'}
                            >
                                <SelectLabel title={item?.date} icon={images.input_calendar} placeHolder='출금 예정일' />
                            </DatePicker> */}

                            <InputDate
                                state={item?.date} 
                                setState={(v) => handleChange({ key: 'date', value: v })} 
                                placeholder={'출금 예정일'} 
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>거래처명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.company = ref)}
                                value={item?.company}
                                onChangeText={(v) => { handleChange({ key: 'company', value: v }) }}
                                placeholder="거래처명을 입력해주세요"
                                maxLength={20}
                            />
                        </View>

                        <View style={{ gap: 12 }}>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>품목 리스트</Text>

                                <View style={[rootStyle.flex, { gap: 4 }]}>
                                    <TouchableOpacity style={styles.addButton} onPress={() => {
                                        router.push({
                                            pathname: routes.매입품목검색,
                                            params: {
                                                company: item?.company,
                                                route: pathname
                                            }
                                        })
                                    }}>
                                        <Text style={{ ...rootStyle.font(14, colors.text313131, fonts.medium) }}>품목 불러오기</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.addButton} onPress={() => {
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
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium) }}>단위, 규격 등 상세 정보는 제품 원가 관리 메뉴에서 설정합니다.</Text>
                        </View>
                    </View>


                    <View style={{ marginTop: 17, gap: 12 }}>
                        <View style={[rootStyle.flex, { height: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: colors.efeff5 }]}>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows1 }}>품목명</Text>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows2 }}>수량</Text>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows3 }}>단가</Text>
                            <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.semiBold), textAlign: 'center', ...styles.rows4 }}>공급가액</Text>
                        </View>

                        <View style={{ gap: 7, paddingHorizontal: 12 }}>
                            {item?.list?.map((x, i) => {
                                return (
                                    <Animated.View entering={FadeIn} key={i} style={[rootStyle.flex, { gap: 5 }]}>
                                        <TextInput
                                            iref={(ref) => (titleRefs.current[i] = ref)}
                                            value={x?.title}
                                            onChangeText={(v) => {
                                                handleChange({
                                                    key: 'list',
                                                    value: item?.list?.map((xx, ii) => {
                                                        if (ii !== i) return xx;
                                                        return { ...xx, title: v }
                                                    })
                                                })
                                            }}
                                            placeholder="입력"
                                            maxLength={20}
                                            containerStyle={{ ...styles.rows1 }}
                                            inputContainerStyle={{ height: 40, paddingHorizontal: 8 }}
                                            style={{ fontSize: 11 }}
                                            isRemove={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => quantityRefs.current?.[i]?.focus()}
                                            blurOnSubmit={false}
                                        />

                                        <TextInput
                                            iref={(ref) => (quantityRefs.current[i] = ref)}
                                            keyboardType={'number-pad'}
                                            valid={'price'}
                                            value={numFormatInput(x?.quantity)}
                                            onChangeText={(v) => {
                                                handleChange({
                                                    key: 'list',
                                                    value: item?.list?.map((xx, ii) => {
                                                        if (ii !== i) return xx;
                                                        return { ...xx, quantity: v }
                                                    })
                                                })
                                            }}
                                            placeholder="입력"
                                            maxLength={10}
                                            containerStyle={{ ...styles.rows2 }}
                                            inputContainerStyle={{ height: 40, paddingHorizontal: 8 }}
                                            style={{ fontSize: 11 }}
                                            isRemove={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => amountRefs.current?.[i]?.focus()}
                                        />

                                        <TextInput
                                            iref={(ref) => (amountRefs.current[i] = ref)}
                                            keyboardType={'number-pad'}
                                            valid={'price'}
                                            value={numFormatInput(x?.amount)}
                                            onChangeText={(v) => {
                                                handleChange({
                                                    key: 'list',
                                                    value: item?.list?.map((xx, ii) => {
                                                        if (ii !== i) return xx;
                                                        return { ...xx, amount: v }
                                                    })
                                                })
                                            }}
                                            placeholder="입력"
                                            maxLength={10}
                                            containerStyle={{ ...styles.rows3 }}
                                            inputContainerStyle={{ height: 40, paddingHorizontal: 8 }}
                                            style={{ fontSize: 11 }}
                                            isRemove={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => titleRefs?.current?.[i + 1]?.focus()}
                                        />

                                        <View style={[rootStyle.flex, { gap: 4, ...styles.rows4 }]}>
                                            <View style={{
                                                height: 40,
                                                justifyContent: 'center',
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                backgroundColor: colors.fafafa,
                                                paddingHorizontal: 8,
                                                flex: 1
                                            }}>
                                                <Text style={{ ...rootStyle.font(12, colors.textA6A6A6, fonts.medium) }}>{numFormatInput(x?.quantity * x?.amount) || '0'}원</Text>
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
                                <Empty msg={'품목을 등록해주세요.'} style={{ paddingBottom: 0, height: 100 }} />
                            )}
                        </View>





                    </View>

                    <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>메모 (선택)</Text>
                            <TextArea
                                iref={(ref) => (inputRefs.current.comment = ref)}
                                value={item?.comment}
                                onChangeText={(v) => { handleChange({ key: 'comment', value: v }) }}
                                maxLength={200}
                                placeholder={'예: 오늘 새벽 도착분 포함'}
                            />
                        </View>

                        <View style={{ gap: 7 }}>
                            {/* <View style={styles.price}>
                                <Text style={{...rootStyle.font(14, colors.textPrimary, fonts. semiBold)}}>공급가액</Text>
                                <Text style={{...rootStyle.font(14, colors.textA6A6A6, fonts. medium)}}>{numFormat(total) || '0'}원</Text>
                            </View>
                            <View style={styles.price}>
                                <Text style={{...rootStyle.font(14, colors.textPrimary, fonts. semiBold)}}>부가세</Text>
                                <Text style={{...rootStyle.font(14, colors.textA6A6A6, fonts. medium)}}>{numFormat(Math.round( total * 0.1 )) }원</Text>
                            </View> */}
                            <View style={styles.price}>
                                <Text style={{...rootStyle.font(14, colors.textPrimary, fonts. semiBold)}}>합계 금액</Text>
                                <Text style={{...rootStyle.font(14, colors.textA6A6A6, fonts. medium)}}>{numFormat(total)}원</Text>
                            </View>
                        </View>

                        {!initLoad && (
                            <View style={[rootStyle.flex, { gap: 5 }]}>
                                {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                                <Button load={load} style={{ flex: 1 }} onPress={onSubmit} >저장</Button>
                            </View>
                        )}
                        
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

        rows1: {
            width: '25%',
        },
        rows2: {
            width: '20%',
        },
        rows3: {
            width: '20%',
        },
        rows4: {
            width: '35%',
        },
       
    })

    return { styles }
}
