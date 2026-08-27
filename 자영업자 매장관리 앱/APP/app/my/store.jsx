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

import Counter from '@/components/Ui/Counter';
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

import { useUser, useStore, useAlert, useLoader, useConfig, usePageContext } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, numFormatInput, hpHypen, hpHypenRemove, businessNumHypen } from '@/libs/utils';
import { aspectRatio } from '@expo/ui/swift-ui/modifiers';


export default function Page({ }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { idx, type: typeParam } = useLocalSearchParams();
    const pathname = usePathname();

    const { reload } = useUser();
    const { reloadStore } = useStore();
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
    const [tables, setTables] = useState([]);
    const [endless, setEndless] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useEffect(() => {
        dataFunc();
    }, [idx])


    useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'addr') {
            handleChange({ key: 'addr', value: context?.data?.addr });
        }
		if (context?.key === 'businessType') {
			setItem(prev => ({
				...prev,
				type: context?.data?.type,
				typeText: {
					depth1: context?.data?.depth1,
					depth2: context?.data?.depth2,
					depth3: context?.data?.depth3,
				},
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
            const { data, error } = await API.post('/v1/store/info', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            setItem(data);
            setTables(data?.tables || []);

            setTimeout(() => {
                setInitLoad(false)
            }, consts.apiDelay)


        } else {
            setItem({
                tables: [],
            })
        }

    }

    const onSubmit = async () => {

        if (!item?.title) {
            ToastMessage('매장명을 입력해주세요.');
            return;
        }
        if(item?.tel?.length < 9) {
            ToastMessage('매장 전화번호를 입력해주세요.');
            return;
        }
        if(!item?.addr || !item?.addr2) {
            ToastMessage('사업장 주소를 입력해주세요.');
            return;
        }
        if(!item?.type) {
            ToastMessage('업종을 선택해주세요.');
            return;
        }

        if (load) return;

        setLoad(true);

        const sender = {
            idx: item?.idx,
            title: item?.title,
            tel: item?.tel,
            addr: item?.addr,
            addr2: item?.addr2,
            type: item?.type,
            capacity: item?.capacity,
            area: item?.area,
            tables: item?.tables,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/store/update', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            reloadStore();

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
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/store/delete', sender);

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
        title: '매장정보',
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
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ paddingTop: 20, paddingBottom: insets?.bottom + 20 }}>
                    <View style={{ paddingHorizontal: 30, gap: 20, }}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>매장명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.title = ref)}
                                value={item?.title}
                                onChangeText={(v) => { handleChange({ key: 'title', value: v }) }}
                                placeholder="매장명을 입력해주세요"
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>매장 전화번호</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.tel = ref)}
                                placeholder="매장 전화번호를 입력해주세요."
                                value={item?.tel}
                                onChangeText={(v) => { handleChange({ key: 'tel', value: v }) }}
                                displayValue={hpHypen(hpHypenRemove(item?.tel))}
                                maxLength={13}
                                keyboardType="number-pad"
                            />
                            
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>사업자등록번호</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.business_num = ref)}
                                value={businessNumHypen(item?.business_num)}
                                editable={false}
                                inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                style={{ color: colors.textSecondary }}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>상호명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.name = ref)}
                                value={item?.name}
                                editable={false}
                                inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                style={{ color: colors.textSecondary }}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>대표자명</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.owner = ref)}
                                value={item?.owner}
                                editable={false}
                                inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                style={{ color: colors.textSecondary }}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>개업일자</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.open_date = ref)}
                                value={dayjs(item?.open_date).format('YYYY.MM.DD')}
                                editable={false}
                                inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
                                style={{ color: colors.textSecondary }}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>사업장 주소</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    router.push({
                                        pathname: routes.addrSearch,
                                        params: {
                                            route: pathname,
                                        }
                                    })
                                }}
                            >
                                <Text style={{ ...rootStyle.font(16, item?.addr ? colors.textPrimary : colors.textSecondary, fonts.regular), flexShrink: 1 }} numberOfLines={1}>{item?.addr || '주소를 검색해주세요'}</Text>
                                <Image source={images.search} style={rootStyle.default20} transition={100} />
                            </TouchableOpacity>

                            <TextInput
                                iref={(ref) => (inputRefs.current.addr2 = ref)}
                                value={item?.addr2}
                                onChangeText={(v) => { handleChange({ key: 'addr2', value: v }) }}
                                maxLength={50}
                                placeholder="상세주소를 입력해주세요."
                            />
                        </View>
                        
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>업종</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    router.push({
                                        pathname: routes.businessTypeSearch,
                                        params: {
                                            route: pathname,
                                        }
                                    })
                                }}
                            >
                                <Text style={{ ...rootStyle.font(!item?.type ? 16 : 14, !item?.type ? colors.textSecondary : colors.textPrimary, fonts.regular), flexShrink: 1 }} numberOfLines={2}>
                                    {!item?.type ? '업종을 선택해주세요' : `${item?.typeText?.depth1} > ${item?.typeText?.depth2} > ${item?.typeText?.depth3}`}
                                </Text>
                                {!item?.type && <Image source={images.search} style={rootStyle.default20} transition={100} />}
                            </TouchableOpacity>
                        </View>

                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), marginTop: 30 }}>운영 정보</Text>


                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>수용 인원</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.capacity = ref)}
                                value={item?.capacity}
                                displayValue={numFormat(item?.capacity)}
                                onChangeText={(v) => { handleChange({ key: 'capacity', value: v }) }}
                                maxLength={5}
                                placeholder="수용 인원을 입력해주세요."
                                keyboardType="number-pad"
                                valid={'price'}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>면적(평)</Text>
                            <TextInput
                                iref={(ref) => (inputRefs.current.area = ref)}
                                value={item?.area}
                                displayValue={numFormat(item?.area)}
                                onChangeText={(v) => { handleChange({ key: 'area', value: v }) }}
                                maxLength={10}
                                placeholder="면적을 입력해주세요."
                                keyboardType="number-pad"
                                valid={'price'}
                            />
                        </View>

                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), marginTop: 30 }}>테이블 상세 정보</Text>

                        <View style={styles.fieldContainer}>
                            <View style={{ gap: 32 }}>
                                {configOptions?.tableType?.map((x, i) => {
                                    return (
                                        <View key={i} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 12 }]}>
                                            <Text style={styles.label}>{x}</Text>
                                            <Counter 
                                                value={item?.tables?.find(y => y?.title === x)?.count || 0} 
                                                setValue={(v) => {
                                                    handleChange({ 
                                                        key: 'tables',
                                                        value: [
                                                            ...item?.tables?.filter(y => y?.title !== x), 
                                                            { title: x, count: v }
                                                        ] 
                                                    });
                                                }} />
                                        </View>
                                    )
                                })}
                            </View>
                        </View>
                    </View>

                    {!initLoad && (
                        <View style={{ paddingHorizontal: 30, gap: 33, marginTop: 45 }}>
                            <View style={[rootStyle.flex, { gap: 5 }]}>
                                {item?.idx && <Button type={'delete'} style={{ flex: 1, }} onPress={onDeleteAlert} >삭제</Button>}
                                <Button load={load} style={{ flex: 1 }} onPress={onSubmit}>저장</Button>
                            </View>
                        </View>
                    )}
                    
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
