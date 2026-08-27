import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import PasswordValid from '@/components/PasswordValid';
import ErrorMessage from '@/components/ErrorMessage';
import Radio from '@/components/Radio';
import SelectCountry from '@/components/SelectCountry';


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

    const { styles } = useStyle();
    const { id, type, typeText, email, setSignData } = useSignData();

    const emailref = useRef(null);
    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ emailInput, setEmailInput ] = useState("");
    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ pwValid, setPwValid ] = useState(false);

    const [ error, setError ] = useState({});
    const [ success, setSuccess ] = useState("");

    useEffect(() => {
        setError({...error, 'emailInput': ''});
        setSuccess("");
    }, [emailInput])
    
    useEffect(() => {
      
        setDisabled( !(emailInput && !pwValid ));

    }, [emailInput, pwValid])

    const validFunc = async () => {

        Keyboard.dismiss();

        if(success) return;

        if(!regEmail.test(emailInput)) {
            setError({...error, emailInput: lang({ id: 'email_is_not' })} );
            return;
        }

        const sender = {
            email: emailInput
        }

        const { data, error } = await API.post('/v2/driver/user/checkEmail', sender);

        if(error) {
            console.log('error', error);
            setError({...error, emailInput: lang({ id: error?.message })} );
            setSuccess("");
            return;
        }
        
        setError({...error, emailInput: "" });
        setSuccess(lang({ id: 'this_email_is' }));
    }

    const submitFunc = async () => {

        Keyboard.dismiss();
        
        if(disabled || load) return;

        if(!success) {
            setError({...error, emailInput: lang({ id: 'duplicate_email_conf' })} );
            return;
        }

        if(!regEmail.test(emailInput)) {
            setError({...error, emailInput: lang({ id: 'email_is_not' })} );
            return;
        }
       
        setLoad(true);

        const sender = {
            email: emailInput
        }

        const { data, error } = await API.post('/v2/driver/user/checkEmail', sender);
        
        setTimeout(() => {
            setLoad(false);

            if(error) {
                setError({...error, emailInput: lang({ id: error?.message })} );
                setSuccess("");
                return;
            }

            // 가입가능
            setSignData({ key: 'email', value: emailInput });
            setSignData({ key: 'pw', value: pw });
            
            router.replace(routes.joinDriverChoice);   
        }, consts.apiDelay)
        
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={250}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
            >
                <View style={styles.root}>
                    <View style={{ gap: 11 }}>
                        <Text style={styles.title}>{lang({ id: 'sign_up' })}</Text>
                        <Text style={styles.subTitle}>{lang({ id: 'last_step_for' })}</Text>
                    </View>

                    <View style={{ gap: 20 }}>

                        <View style={{ gap: 6 }}>
                            <Input 
                                style={{ flex: 1 }}
                                iref={emailref}
                                autoFocus
                                required
                                inputLabel={lang({ id: 'email_1' })}
                                name={'emailInput'}
                                state={emailInput} 
                                setState={setEmailInput} 
                                placeholder={lang({ id: 'enter_your_email' })} 
                                returnKeyType={"done"}
                                onSubmitEditing={validFunc}
                                blurOnSubmit={false}
                                maxLength={50}
                                label={lang({ id: 'check' })}
                                labelPress={validFunc}
                            />
                            
                            <View style={[ rootStyle.flex, { gap: 3, justifyContent: 'flex-start', alignItems: 'flex-start' }]}>
                                <Image source={images.exclamation} style={rootStyle.default} />
                                <Text style={styles.help}>{lang({ id: 'please_provide_an' })}</Text>
                            </View>
                        </View>
                            
                        <View>
                            {error?.emailInput && (
                                <ErrorMessage msg={error?.emailInput} />
                            )}
                            {success && (
                                <Text style={styles.success}>{success}</Text>
                            )}
                        </View>

                        <View style={{ gap: 15 }}>
                            <Input
                                iref={pwref}
                                inputLabel={lang({ id: 'password_1' })}
                                required 
                                state={pw}
                                setState={setpw}
                                name={'pw'}
                                placeholder={lang({ id: 'password' })}
                                password
                                returnKeyType={"next"}
                                onSubmitEditing={() => {
                                    repwref.current?.focus() 
                                }}
                                maxLength={30}
                            />
                            <Input
                                iref={repwref}
                                state={repw}
                                setState={setrepw}
                                name={'pw'}
                                placeholder={lang({ id: 'confirm_password' })}
                                password
                                maxLength={30}
                            />

                            <PasswordValid pw={pw} repw={repw} setValid={setPwValid}/>
                        </View>
                        

                    </View>
                    
                </View>
            </KeyboardAwareScrollView>

            <View style={styles.bottom} >
                <Button disabled={disabled} style={{ width: 120 }} onPress={submitFunc} load={load}>{lang({ id: 'continue' })}</Button>
            </View>
           
        </View>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            gap: 30,
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
            alignItems: 'flex-end'
        },
        error: {
            fontSize: 16,
            color: colors.text_popup,
            letterSpacing: -0.32
        },
        success: {
            fontSize: 14,
            color: colors.taseta,
            letterSpacing: -0.32,
            marginTop: -4,
        },
        help: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.sub_1,
            letterSpacing: -0.32
        }
	})

  	return { styles }
}