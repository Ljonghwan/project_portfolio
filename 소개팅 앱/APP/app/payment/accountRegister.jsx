import React, { useRef, useState, useEffect } from 'react';
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

import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';
import dayjs from "dayjs";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
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

import { useUser, useConfig, usePhotoPopup, useAlert } from '@/libs/store';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';
// import { maskImageBackDigits } from '@/libs/ocr';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { configOptions } = useConfig();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    
    const nameref = useRef(null);
    const bankref = useRef(null);


    const [filter, setFilter] = useState(null); // 

    const [input, setInput] = useState("0");
    const [inputCalc, setInputCalc] = useState("");


    const [bank, setBank] = useState("");
    const [name, setName] = useState("");
    const [bankNumber, setBankNumber] = useState("");
    const [idCard, setIdCard] = useState("");
    
    const [view, setView] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    const [list, setList] = useState([]); // 

    const [error, setError] = useState(null);

    const [disabled, setDisabled] = useState(false);
    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
       
    }, []);

    useEffect(() => {
        setDisabled( !((bank && name && bankNumber?.length > 7 && idCard )));
    }, [input, bank, bankNumber, idCard])


    const submitFunc = async () => {

        if(load) return;

        setLoad(true);

        let sender = {
            name: name,
            bank: bank,
            bankNumber: bankNumber,
            idCard: idCard
        }
        const { data, error } = await API.post('/v1/assets/bankInfo', sender);

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
                label: '계좌 등록이 완료되었습니다.',
                onPressText: "확인하기",
                onEnd: () => {
                    router.back();
                }
            })
    
            
        }, consts.apiDelay)

    };

    const photoFunc = () => {

        openPhotoFunc({
            setPhoto: async (v) => {
                setIdCard(v?.[0]);
                // setIdCard(await maskImageBackDigits(v?.[0]));
            }
        })
        
    }

    const header = {
        title: '계좌 등록하기',
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

                {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}

                <KeyboardAwareScrollView
                    bottomOffset={150}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: rootStyle.side,
                        paddingBottom: insets?.bottom + 100,
                    }}
                >

                    <View style={{ }}>
                        <View style={{ padding: 10, marginBottom: 6 }}>
                            <Text style={{...rootStyle.font(18, colors.black, fonts.medium)}}>정산 계좌의 정보를 입력해 주세요.</Text>
                        </View>

                        <View style={{ gap: 17, paddingHorizontal: 10 }}>
                            <View style={{ gap: 12 }}>
                                <Text style={{...rootStyle.font(16, colors.dark, fonts.regular)}}>1. 예금주</Text>
                                <Input 
                                    iref={nameref}
                                    style={{ flex: 1 }}
                                    inputWrapStyle={{ paddingHorizontal: Platform.OS === 'ios' ? 18 : 12, borderRadius: 12, backgroundColor: colors.fafafa }}
                                    placeholderTextColor={colors.grey8}
                                    name={'name'}
                                    state={name} 
                                    setState={setName} 
                                    placeholder={`성함을 입력해주세요.`} 
                                    maxLength={10}
                                    returnKeyType={"next"}
                                    onSubmitEditing={() => setView(true) }
                                    blurOnSubmit={false}
                                />
                            </View>

                            <View style={{ gap: 12 }}> 
                                <Text style={{...rootStyle.font(16, colors.dark, fonts.regular)}}>2. 은행</Text>
                                <TouchableOpacity style={[styles.bank ]} onPress={() => setView(!view)} disabled={readOnly}>
                                    <Text style={[styles.bankText, { color: !bank ? colors.grey8 : colors.text_sub }]} numberOfLines={1}>{bank || "은행 선택"}</Text>
                                    <Image source={images.down} style={rootStyle.default} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ gap: 12 }}>
                                <Text style={{...rootStyle.font(16, colors.dark, fonts.regular)}}>3. 계좌번호</Text>
                                <Input 
                                    iref={bankref}
                                    valid={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'email-address'}
                                    style={{ flex: 1 }}
                                    inputWrapStyle={{ paddingHorizontal: Platform.OS === 'ios' ? 18 : 12, borderRadius: 12, backgroundColor: colors.fafafa }}
                                    placeholderTextColor={colors.grey8}
                                    name={'bankNumber'}
                                    state={bankNumber} 
                                    setState={setBankNumber} 
                                    placeholder={`계좌 번호 (-를 포함하여 작성해 주세요.)`} 
                                    maxLength={30}
                                />
                            </View>

                            <View style={{ gap: 12 }}>
                                <Text style={{...rootStyle.font(16, colors.dark, fonts.regular)}}>4. 신분증 사본</Text>
                                <View style={{ gap: 12 }}>
                                    {idCard && (
                                        <Animated.View entering={FadeIn}>
                                            <Image source={idCard?.uri} style={{ width: '100%', aspectRatio: 16/9, borderRadius: 24 }} transition={200} />
                                        </Animated.View>
                                    )}
                                    <TouchableOpacity style={styles.uploadButton} activeOpacity={0.5} onPress={photoFunc}>
                                        <Image source={images.upload} style={{ width: 24, aspectRatio: 1 }} />
                                        <View>
                                            <Text style={{...rootStyle.font(width <= 320 ? 14 : 16, colors.primary, fonts.medium), lineHeight: 26, textAlign: 'center', letterSpacing: -0.63 }}>터치하여 이미지를 업로드</Text>
                                            {/* <Text style={{...rootStyle.font(width <= 320 ? 11 : 14, colors.primary, fonts.light), letterSpacing: -0.49}}>{`* 뒷자리는 마스킹후 업로드 해 주세요.`}</Text> */}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={{ paddingTop: 26, gap: 26 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 7 }]}>
                            <Image source={images.info} style={rootStyle.default} />
                            <Text style={{...rootStyle.font(18, colors.primary, fonts.semiBold)}}>정산 전 확인해 주세요.</Text>
                        </View>
                     
                        <View style={{ gap: 7 }}>
                            <ListText style={styles.help}>본인 확인을 위한 신분증 사본</ListText>
                            <ListText style={styles.help}>정산금 지급을 위한 본인 명의의 계좌 정보</ListText>
                            <ListText style={styles.help}>정산 등록 계좌를 변경하려면 고객센터에 문의해 주세요.</ListText>
                            <ListText style={styles.help}>신분증 사본은 본인인증 · 도용방지 · 소득세(3.3%) 원천징수 처리에 사용됩니다.</ListText>
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
                계좌 등록하기
            </Button>

            <Bank view={view} handleClose={() => setView(false)} value={bank} setValue={(v) => {
                setBank(v);
                bankref.current?.focus();
            }}/>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
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
            height: 48,
            paddingHorizontal: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyC,
            backgroundColor: colors.fafafa,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        bankText: {
            flex: 1,
            fontSize: 16,
            color: colors.text_sub,
            letterSpacing: -0.3
        },
        help: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.text_info,
            letterSpacing: -0.35
        },
        uploadButton: {
            flexDirection: 'row', 
            aspectRatio: 'auto', 
            paddingVertical: 12, 
            gap: width <= 320 ? 12 : 20,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.main2,
            width: '100%',
        },
    })

    return { styles }
}
