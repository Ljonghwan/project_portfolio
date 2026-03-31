import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, hpHypen, hpHypenRemove, regEmail } from '@/libs/utils';

export default function Login() {

    const { styles } = useStyle();

    const router = useRouter();
    const { pushToken, login } = useUser();
    const { openLoader, closeLoader } = useLoader();
	const { setSignData } = useSignData();

    const emailRef = useRef();
    const iref = useRef();

    const [certToken, setCertToken] = useState(null);

    const [account, setAccount] = useState('');

    const [code, setCode] = useState('');

    const [timer, setTimer] = useState(true);


    const [load, setLoad] = useState(false);
    const [sendLoad, setSendLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setDisabled(!(code?.length > 5 && timer));
    }, [code, timer])

    const handleNext = async () => {

        Keyboard.dismiss();
        setLoad(true);

        const sender = {
            token: certToken,
            code: code
        }

        const { data, error } = await API.post('/v1/auth/findVerification', sender);
        console.log('data, error', data, error);
        setLoad(false);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        setSignData(
            {
                key: 'email',
                value: account,
            }
        );
        router.replace(routes.joinForm);

    }

    const timeOut = () => {

        console.log("타임 아웃입니다");
        ToastMessage("인증시간이 초과되었습니다");
        setTimer(false);
    }

    const reSend = async () => {

        if (sendLoad) return;

        openLoader();

        Keyboard.dismiss();

        console.log("재전송 입니다.");
        setSendLoad(true);
        setTimer(false);

        const sender = {
            account: account,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/auth/checkAccount', sender);
        console.log('load Test!!!!!!!!', data, error);

        setTimeout(() => {
            setSendLoad(false);
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            setCertToken(data);
            setTimer(true);
            setCode("");

            setTimeout(() => {
                iref?.current?.focus();
            }, 200)


        }, consts.apiDelay)

    }


    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, paddingTop: 24, paddingHorizontal: 24, gap: 30 }}>

                    {!certToken ? (
                        <View>
                            <Text style={{ ...rootStyle.font(24, colors.black, fonts.semiBold) }}>이메일을 입력해주세요.</Text>
                            {/* <Text style={{ ...rootStyle.font(16, colors.textSecondary), lineHeight: 24 }}>{`@company.com 과 같이 회사에서\n발급받은 이메일만 입력할 수 있습니다.`}</Text> */}
                        </View>
                    ) : (
                        <View>
                            <Text style={{ ...rootStyle.font(24, colors.black, fonts.bold) }}>인증코드를 입력해주세요.</Text>
                            <Text style={{ ...rootStyle.font(16, colors.textSecondary), lineHeight: 24 }}>{`입력하신 이메일로 발송된\n6자리 코드를 입력해주세요.`}</Text>
                        </View>
                    )}
                    

                    <View style={{ gap: 15 }}>
                        <TextInput
                            autoFocus
                            iref={emailRef}
                            placeholder="이메일 입력"
                            value={account}
                            onChangeText={setAccount}
                            maxLength={50}
                            returnKeyType="done"
                            onSubmitEditing={reSend}
                            editable={!certToken}
                        />

                        {certToken && (
                            <>
                                <TextInput
                                    autoFocus
                                    iref={iref}
                                    placeholder="인증코드 입력"
                                    keyboardType={'number-pad'}
                                    value={code}
                                    onChangeText={setCode}
                                    maxLength={6}
                                    timer={timer}
                                    timerState={timeOut}
                                    editable={timer}
                                />
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={{ ...rootStyle.font(12, colors.text757575) }}>인증문자가 오지 않나요?</Text>

                                    <TouchableOpacity onPress={reSend} style={{ height: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 1000, backgroundColor: colors.f2f2f2 }}>
                                        <Text style={{ ...rootStyle.font(12, colors.text2B2B2B) }}>인증코드 재전송</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        
                    </View>
                </View>
            </KeyboardAwareScrollView>
            {!certToken ? (
                <Button bottom disabled={!regEmail.test(account)} load={sendLoad} onPress={reSend}>인증 코드 받기</Button>
            ) : (
                <Button bottom disabled={disabled} load={load} onPress={handleNext}>확인</Button>
            )}
        </View>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.white,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 30,
            paddingTop: 70,
            paddingBottom: 30,
        },
        headerSection: {
            gap: 20,
            marginBottom: 32,
        },
        logo: {
            width: 88,
            height: 77,
        },
        titleContainer: {
            gap: 14,
        },
        title: {
            fontFamily: fonts.semiBold,
            fontSize: 24,
            lineHeight: 34,
            letterSpacing: -0.6,
            color: colors.textPrimary,
        },
        subtitle: {
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.textSecondary,
        },
        formSection: {
            width: '100%',
            gap: 10,
            marginBottom: 32,
        },
        linkContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 0,
        },
        linkButton: {
            paddingHorizontal: 10,
            paddingVertical: 10,
        },
        linkText: {
            fontFamily: fonts.regular,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.textSecondary,
        },
        divider: {
            width: 1,
            height: 12,
            backgroundColor: colors.border,
        },
        buttonContainer: {
        },
        loginButton: {
            height: 56,
            borderRadius: 8,
        },

    });

    return { styles }
}

