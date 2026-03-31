import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Platform,
    Pressable
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import dayjs from "dayjs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Bank from '@/components/Bank';
import ListText from '@/components/ListText';

import Input from '@/components/Input';
import InputFlirting from '@/components/InputFlirting';

import OrderFlirting from '@/components/list/OrderFlirting';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useConfig, useAlert } from '@/libs/store';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    
    const nameref = useRef(null);
    const bankref = useRef(null);


    const [filter, setFilter] = useState(null); // 

    const [input, setInput] = useState("0");
    const [inputCalc, setInputCalc] = useState("");
    const [info, setInfo] = useState("");


    const [bank, setBank] = useState("");
    const [name, setName] = useState("");
    const [bankNumber, setBankNumber] = useState("");
    
    const [view, setView] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    const [list, setList] = useState([]); // 

    const [error, setError] = useState(null);

    const [disabled, setDisabled] = useState(false);
    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );

    useEffect(() => {

        setError( (input*1) > info?.applyFlirting ? '보유 개수가 부족합니다.' : "");
        setInputCalc(input * (info?.calcPrice || 0));

    }, [input])

    useEffect(() => {
        setDisabled( !((input*1 > 0) && info?.bank) );
    }, [input, info])

    const dataFunc = async () => {

        const { data, error } = await API.post('/v1/assets/flirting');

        setTimeout(() => {

            if(error) {
                router.back();
                ToastMessage(error?.message);
                return;
            }

            console.log('data', JSON.stringify(data, null, 2));
            setInfo(data);
            
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const submitFunc = async () => {

        if(load) return;

        if((input*1) > info?.applyFlirting) {
            ToastMessage("보유 개수가 부족합니다");
            return;
        }
        
        setLoad(true);

        let sender = {
            count: input
        }
        const { data, error } = await API.post('/v1/assets/apply', sender);

        setTimeout(() => {
            
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            openAlertFunc({
                icon: images.settlement2,
                iconStyle: {
                    width: 32,
                    height: 32,
                },
                label: '정산 신청이 완료되었습니다.',
                onPressText: "확인하기",
            })
            
            setInput("0");
            dataFunc();

            
        }, consts.apiDelay)

    };


    const header = {
        title: '픽켓 정산',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'settlement2',
            style: {
                width: 24
            }
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header}>
            <View style={{ flex: 1 }}>

                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <KeyboardAwareScrollView
                    bottomOffset={150}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 100,
                    }}
                >
                    {info?.bank ? (
                        <View style={{ paddingVertical: 12, paddingHorizontal: rootStyle.side }}>
                            <View style={{ gap: 8 }}>
                                <View style={{ paddingVertical: 10 }}>
                                    <Text style={{...rootStyle.font(16, colors.black, fonts.medium)}}>정산 받을 계좌</Text>
                                </View>
                                <View style={{ paddingVertical: 12, gap: 12 }}>
                                    {configOptions?.bankOptions?.find(x => x?.title === info?.bank)?.icon && <Image source={consts.s3Url + (configOptions?.bankOptions?.find(x => x?.title === info?.bank)?.icon)} style={rootStyle.default36} />}
                                    <View style={{  }}>
                                        <Text style={{...rootStyle.font(18, colors.black, fonts.regular), marginBottom: 10}}>{`${info?.name}`}</Text>
                                        <Text style={{...rootStyle.font(16, colors.grey5, fonts.medium), marginBottom: 5}}>{`${info?.bank}`}</Text>
                                        <Text style={{...rootStyle.font(16, colors.grey4, fonts.medium)}}>{`${info?.bankNumber}`}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[rootStyle.flex, { gap: 10 }]}>
                                <View style={styles.top}>
                                    <Text style={styles.topTitle}>{mbData?.level === 2 ? '정산 가능한 픽켓' : '보유한 픽켓'}</Text>
                                    <View style={[rootStyle.flex, { alignSelf: 'flex-end', height: 24, gap: 8 }]}>
                                        <Image source={images.picket} style={[rootStyle.picket, { width: 20 }]} />
                                        <Text style={styles.topCount}>
                                            {numFormat(mbData?.level === 2 ? info?.applyFlirting : mbData?.flirting)}장
                                        </Text>
                                    </View>
                                </View>
                                {mbData?.level === 2 && (
                                    <View style={[styles.top, { borderColor: colors.primary4, backgroundColor: colors.primary4 }]}>
                                        <Text style={[styles.topTitle, { color: colors.white }]}>정산 중인 픽켓</Text>
                                        <View style={[rootStyle.flex, { alignSelf: 'flex-end', height: 24, gap: 8 }]}>
                                            <Image source={images.picket} style={[rootStyle.picket, { width: 20 }]} tintColor={colors.white}/>
                                            <Text style={[styles.topCount, { color: colors.white }]}>{numFormat(info?.flirting - info?.applyFlirting)}장</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View>
                            <View style={{ paddingHorizontal: rootStyle.side, paddingVertical: 10 }}>
                                <Text style={{...rootStyle.font(16, colors.black, fonts.medium)}}>정산 받을 계좌</Text>
                            </View>
                            <View style={{ paddingVertical: 12, paddingHorizontal: rootStyle.side, gap: 12, alignItems: 'center' }}>
                                <Image source={images.dot} style={[rootStyle.default48]} />
                                <Text style={{...rootStyle.font(18, colors.grey3, fonts.semiBold)}}>아직 등록된 정산 계좌가 없어요.</Text>
                                <Button type={'2'} onPress={() => {
                                    router.navigate(routes.paymentAccountRegister);
                                }}>계좌 등록하기</Button>
                            </View>
                        </View>
                    )}





                    <View style={styles.bar} />
                        
                    <View style={{ paddingVertical: 12, paddingHorizontal: rootStyle.side, gap: 22 }}>
                        <View style={{ paddingVertical: 10 }}>
                            <Text style={{...rootStyle.font(16, colors.black, fonts.medium)}}>정산 할 픽켓 갯수를 입력해 주세요.</Text>
                        </View>
                        
                        <View>
                            <InputFlirting 
                                valid={'number'}
                                name={'input'}
                                state={input} 
                                setState={setInput} 
                                placeholder={`0`} 
                                max={info?.applyFlirting || 0}
                            />
                            {error ? (
                                <Text style={[styles.error]}>{error}</Text>
                            ) : (
                                <Text style={[styles.error, { color: colors.grey6 }]}>{inputCalc ? `정산 금액 : ${numFormat(inputCalc)}원` : ''}</Text>
                            )}
                        </View>
                    </View>

                    <View style={{ paddingTop: 26, paddingHorizontal: rootStyle.side, gap: 26 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 7 }]}>
                            <Image source={images.info} style={rootStyle.default} />
                            <Text style={{...rootStyle.font(18, colors.primary, fonts.semiBold)}}>정산 전 확인해 주세요.</Text>
                        </View>
                     
                        <View style={{ gap: 7 }}>
                            <ListText style={styles.help}>픽켓 1장은 1만원의 가치를 가지고 있습니다.</ListText>
                            <ListText style={styles.help}>정산 등록 계좌를 변경하려면 고객센터에 문의해 주세요.</ListText>
                            <ListText style={styles.help}>배분을 제외한 금액이 입금됩니다.</ListText>
                            <ListText style={styles.help}>3.3%를 제외한 금액이 입금됩니다.</ListText>
                             
                        </View>
                    </View>
                </KeyboardAwareScrollView>
            </View>

            <Button 
                bottom 
                disabled={disabled} 
                onPress={submitFunc} 
                load={load}
                containerStyle={[rootStyle.flex, { gap: 2 }]}
                textStyle={{ fontSize: 16 }}
                frontIcon={'picket'}
                frontIconStyle={rootStyle.default}
                frontIconTintColor={colors.white}
            >
                픽켓 정산하기
            </Button>

            <Bank view={view} handleClose={() => setView(false)} value={bank} setValue={(v) => {
                setBank(v);
                nameref.current?.focus()
            }}/>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: colors.main
        },
        top: {
            flex: 1,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: colors.primary,
            padding: 12,
            gap: 23
        },

        flirtingBox: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.main,
            width: 32,
            aspectRatio: 1/1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        topTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            fontFamily: fonts.medium,
            color: colors.primary
        },
        topCount: {
            fontSize: 16,
            fontFamily: fonts.bold,
            color: colors.primary
        },
        error: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.red,
            textAlign: 'center',
            marginTop: 10
        },
        bar: {
            width: '100%',
            height: 14,
            backgroundColor: colors.greyD9,
            marginTop: 12
        },

        bank: {
            flex: 1,
            height: 44,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.greyC,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        bankText: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.3
        },
        help: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.text_info,
            letterSpacing: -0.35
        },
        counter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 7,
        }
    })

    return { styles }
}
