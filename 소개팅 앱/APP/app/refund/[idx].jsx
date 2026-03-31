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
    Pressable,
    Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
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
import CheckBox2 from '@/components/CheckBox2';
import PayType from '@/components/PayType';

import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import InputFlirting from '@/components/InputFlirting';

import OrderFlirting from '@/components/list/OrderFlirting';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser } from '@/libs/store';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { idx } = useLocalSearchParams();

    const { token, mbData } = useUser();


    const nameref = useRef(null);
    const bankref = useRef(null);


    const [item, setItem] = useState(null); // 

    const [input, setInput] = useState("");
    const [inputCalc, setInputCalc] = useState("");
    const [info, setInfo] = useState("");

    const [payType, setPayType] = useState("");
    const [bank, setBank] = useState("");
    const [name, setName] = useState(mbData?.name);
    const [bankNumber, setBankNumber] = useState("");
    const [comment, setComment] = useState("");
    const [differentName, setDifferentName] = useState(false);


    const [view, setView] = useState(false);
    const [viewPayType, setViewPayType] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    const [list, setList] = useState([]); // 

    const [error, setError] = useState(null);

    const [disabled, setDisabled] = useState(false);
    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {

        dataFunc();

    }, [idx]);


    useEffect(() => {
        setDisabled(!(bank && bankNumber && comment?.length > 0));
    }, [bank, bankNumber, comment])

    const dataFunc = async () => {

        const sender = {
            idx,
        }

        const { data, error } = await API.post('/v1/refund/info', sender);

        setTimeout(() => {

            if (error) {
                router.back();
                ToastMessage(error?.message);
                return;
            }

            setItem(data);

            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const submitFunc = async () => {

        if (load) return;

        Keyboard.dismiss();

        setLoad(true);

        let sender = {
            idx: idx,
            bank: bank,
            bankNumber: bankNumber,
            comment: comment,
            payType: payType,
        }
        const { data, error } = await API.post('/v1/refund/insert', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage("환불 요청이 완료되었습니다.");

            router.back();

        }, consts.apiDelay)

    };


    const header = {
        title: '환불 신청',
        titleStyle: {
            fontSize: 16,
            color: colors.text_link,
            fontFamily: fonts.medium,
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
                    decelerationRate={'normal'}
                    bottomOffset={150}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 100,
                    }}
                >
                    <View style={{ paddingHorizontal: 20, gap: 20 }}>

                        <View style={styles.top}>

                            <View style={styles.refundBox}>
                                <View style={{ gap: 8 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={styles.refundText}>결제금액</Text>
                                        <Text style={styles.refundText}>{`${numFormat(item?.originAmount)}원`}</Text>
                                    </View>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={[styles.refundText, { fontSize: width <= 360 ? 11 : 12 }]}>ㆍ취소 수수료 ({item?.desc})</Text>
                                        <Text style={[styles.refundText, { fontSize: width <= 360 ? 11 : 12 }]}>{`- ${numFormat(item?.originAmount - item?.amount)}원`}</Text>
                                    </View>
                                </View>
                                <View style={styles.bar} />
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', marginTop: 5 }]}>
                                    <Text style={[styles.refundText, { fontFamily: fonts.medium, fontSize: 14 }]}>환불 금액</Text>
                                    <View style={[rootStyle.flex, { gap: 6 }]}>
                                        <Image source={images.won_gray} style={[rootStyle.default]} />
                                        <Text style={styles.refundTextBlue}>{`${numFormat(item?.amount)}원`}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={{ gap: 12 }}>
                            <Text style={{ fontSize: 16, fontFamily: fonts.semiBold }}>환불 정보를 입력해 주세요.</Text>

                            {/* <View style={{ gap: 8 }}>
                                <Text style={{ ...rootStyle.font(14, colors.dark) }}>1. 결제 유형</Text>
                                <Input
                                    iref={nameref}
                                    style={{ flex: 1 }}
                                    inputWrapStyle={{ borderRadius: 12 }}
                                    inputStyle={{ fontSize: 14 }}
                                    name={'name'}
                                    state={mbData?.name}
                                    // setState={setName} 
                                    placeholder={`예금주`}
                                    maxLength={10}
                                    readOnly={true}
                                    disabled={true}
                                />
                            </View> */}

                            <View style={{ gap: 8 }}>
                                <Text style={{ ...rootStyle.font(14, colors.dark) }}>1. 결제 유형</Text>

                                <TouchableOpacity style={[styles.bank]} onPress={() => setViewPayType(!viewPayType)} >
                                    <Text style={styles.bankText} numberOfLines={1}>{payType || "결제 유형을 선택해 주세요."}</Text>
                                    <Image source={images.down} style={rootStyle.default} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ gap: 8 }}>
                                <Text style={{ ...rootStyle.font(14, colors.dark) }}>2. 계좌 정보</Text>
                                <View style={[rootStyle.flex, { gap: 8 }]}>
                                    <TouchableOpacity style={[styles.bank]} onPress={() => setView(!view)} >
                                        <Text style={styles.bankText} numberOfLines={1}>{bank || "은행"}</Text>
                                        <Image source={images.down} style={rootStyle.default} />
                                    </TouchableOpacity>
                                    <Input
                                        iref={nameref}
                                        style={{ flex: 1 }}
                                        inputWrapStyle={{ borderRadius: 12 }}
                                        inputStyle={{ fontSize: 14 }}
                                        name={'name'}
                                        state={name}
                                        setState={setName}
                                        placeholder={`예금주`}
                                        maxLength={10}
                                        returnKeyType={"next"}
                                        onSubmitEditing={() => {
                                            bankref.current?.focus()
                                        }}
                                    // readOnly={true}
                                    // disabled={true}
                                    />
                                </View>
                                <Input
                                    iref={bankref}
                                    valid={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'email-address'}
                                    style={{ flex: 1 }}
                                    inputWrapStyle={{ borderRadius: 12 }}
                                    inputStyle={{ fontSize: 14 }}
                                    name={'bankNumber'}
                                    state={bankNumber}
                                    setState={setBankNumber}
                                    placeholder={`계좌번호 (-를 포함하여 작성해 주세요.)`}
                                    maxLength={30}
                                    returnKeyType={"done"}
                                    onSubmitEditing={submitFunc}
                                    blurOnSubmit={false}
                                />

                            </View>
                            <View style={{ marginVertical: 4 }}>
                                <CheckBox2
                                    fontStyle={{ fontSize: 12, fontFamily: fonts.regular, color: colors.grey6 }}
                                    label={`환불받을 예금주와 이름이 다를 경우 체크해 주세요.`}
                                    checked={differentName}
                                    onCheckedChange={(v) => {
                                        setDifferentName(v)
                                    }}
                                />
                            </View>

                            <View style={{ gap: 8 }}>
                                <Text style={{ ...rootStyle.font(14, colors.dark) }}>3. 환불 사유</Text>

                                <TextArea
                                    name={'comment'}
                                    inputWrapStyle={{ height: 100 }}
                                    inputStyle={{ fontSize: 14 }}
                                    state={comment}
                                    setState={setComment}
                                    placeholder={`환불 사유를 입력해 주세요.`}
                                    blurOnSubmit={false}
                                    maxLength={255}
                                    multiline
                                />

                            </View>

                            <View style={{ paddingTop: 11, gap: 26 }}>
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 7 }]}>
                                    <Image source={images.info} style={rootStyle.default} />
                                    <Text style={{ ...rootStyle.font(18, colors.primary, fonts.semiBold) }}>환불 신청시 확인해 주세요.</Text>
                                </View>

                                <View style={{ gap: 7 }}>
                                    <ListText style={styles.help}>보냈던 슈퍼 픽켓은 100% 비율로 반환됩니다.</ListText>
                                    <ListText style={styles.help}>환불은 영업일 기준 3일 이내, 오후 18시까지 순차적으로 완료됩니다.</ListText>
                                </View>
                            </View>

                        </View>

                    </View>

                </KeyboardAwareScrollView>
            </View>


            <Button
                type={'2'}
                load={load}
                disabled={disabled}
                bottom
                onPress={submitFunc}
            >
                환불 신청
            </Button>


            <Bank view={view} handleClose={() => setView(false)} value={bank} setValue={(v) => {
                setBank(v);
                nameref.current?.focus()
            }} />

            <PayType view={viewPayType} handleClose={() => setViewPayType(false)} value={payType} onSubmit={(v) => {
                setPayType(v);
                setView(true);
            }} />

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
            position: 'relative',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.primary,
            padding: 24,
            gap: 20
        },

        flirtingBox: {
            width: 32,
            aspectRatio: 1 / 1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        refundText: {
            fontSize: 12,
            color: colors.grey5,
        },
        refundTextBlue: {
            fontSize: 15,
            color: colors.primary,
            fontFamily: fonts.semiBold,
        },
        bar: {
            width: '100%',
            height: 0.5,
            backgroundColor: colors.greyD9,
            marginVertical: 12
        },

        topTitle: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.grey6,
            textAlign: 'center'
        },
        topTitleSpan: {
            fontSize: 12,
            lineHeight: 20,
            letterSpacing: -0.3,
            color: colors.grey6
        },
        topCount: {
            fontSize: 20,
            fontFamily: fonts.medium,
            color: colors.dark
        },
        error: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.red,
            textAlign: 'center',
            marginBottom: -16
        },


        bank: {
            flex: 1,
            height: 48,
            paddingHorizontal: 12,
            borderRadius: 12,
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
    })

    return { styles }
}
