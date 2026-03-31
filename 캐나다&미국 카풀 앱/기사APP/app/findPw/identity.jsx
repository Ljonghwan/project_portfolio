import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Platform, Pressable } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import Input from '@/components/Input';
import Timer from '@/components/Timer';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, regEmail, regNick, regName } from '@/libs/utils';

import { useUser, useSignData, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

	const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { type } = useLocalSearchParams();

    const { styles } = useStyle();
    const { login, pushToken } = useUser();
    const { email, hp, country, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();

    const coderef = useRef(null);

    const [ timer, setTimer ] = useState(true);
    const [ code, setCode ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    const [ error, setError ] = useState({});

  
    useEffect(() => {
        setError({...error, 'code': ''});
    }, [code])

    useEffect(() => {
      
        setDisabled( !(code?.length > 5 ));

    }, [code])

    const timeOut = () => {

        console.log("타임 아웃입니다");
        setError({...error, certify: '인증시간이 만료되었습니다.'});
        setTimer(false);
    }

    const reSend = async () => {

        const sender = {
            type: type*1,
            email: email,
            country: country,
            hp: hp
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v2/driver/user/sendAuth', sender);

        if(error) {
            setError({...error, code: lang({ id: error?.message })} );
            return;
        }

        setTimer(true);

        setCode("");
        setError({...error, code: ''});

        setTimeout(() => {
            coderef?.current?.focus();
        }, 100)
        
    }

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        setLoad(true);
        
        // 인증번호 검증 API
        const sender = {
            type: type*1,
            country: country,
            hp: hp,
            email: email,
            authNumber: code
        }

        const { data, error } = await API.post('/v2/driver/user/checkAuth', sender);

        setLoad(false);

        if(error) {
            setError({...error, code: lang({ id: error?.message })} );
            return;
        }
        
        router.replace({
            pathname: routes.findPwForm,
            params: { token: data },
        });   
    
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={50}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"never"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
            >
                <View style={styles.root}>
                    <View style={{ gap: 70 }}>
                        <View style={{ gap: 11 }}>
                            <Text style={styles.title}>{lang({ id: 'please_enter_6' })}</Text>
                        </View>

                        <Input 
                            style={{ position: 'absolute', opacity: 0 }}
                            autoFocus
                            iref={coderef}
                            valid={'number'}
                            name={'code'}
                            state={code} 
                            setState={setCode} 
                            // returnKeyType={"done"}
                            // onSubmitEditing={submitFunc}
                            // blurOnSubmit={false}
                            maxLength={6}

                            // readOnly={!timer}
                        />
                        
                        <Pressable style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]} onPress={() => {
                            coderef?.current?.focus()
                        }}>
                            {[...Array(6)].map((x, i) => {
                                return (
                                    <View key={i} style={styles.codeBox}>
                                        <Text style={styles.codeText}>{code.charAt(i)}</Text>
                                    </View>
                                )
                            })}
                        </Pressable>
                    </View>
                    {error?.code && (
                        <ErrorMessage msg={error?.code} />
                    )}
                </View>


            </KeyboardAwareScrollView>

            <KeyboardStickyView offset={{ closed: 0, opened: insets?.bottom }} style={styles.bottom}>
                <Button disabled={timer} style={{ flex: 1 }} onPress={reSend}>
                    {timer ? (
                        <Timer timeOut={timeOut}/>
                    ) : lang({ id: 'resend_code' })}
                </Button>
                <Button disabled={(disabled || !timer)} style={{ width: 120 }} onPress={submitFunc} load={load}>{lang({ id: 'continue' })}</Button>
            </KeyboardStickyView>
        </View>
    )
}



const useStyle = () => {

	const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            gap: 18,
		},
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold,
            letterSpacing: -0.64,
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 30
        },
        error: {
            fontSize: 16,
            color: colors.text_popup,
            letterSpacing: -0.32
        },
        codeBox: {
            flex: 1,
            aspectRatio: 1/1,
            backgroundColor: colors.sub_3,
            borderWidth: 1,
            borderColor: colors.sub_1,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
        },
        codeText: {
            fontSize: width / 15,
            color: colors.main,
            fontFamily: fonts.extraBold
        }
	})

  	return { styles }
}