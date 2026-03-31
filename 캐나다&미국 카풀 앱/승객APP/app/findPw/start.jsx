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
import InputPhone from '@/components/InputPhone';
import Profile from '@/components/Profile';
import Radio from '@/components/Radio';
import ErrorMessage from '@/components/ErrorMessage';


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

    const { setSignData } = useSignData();

    const emailref = useRef(null);
    const hpref = useRef(null);
    const repwref = useRef(null);

    const [ type, setType ] = useState(2);

    const [ emailInput, setEmailInput ] = useState("");
    const [ country, setCountry ] = useState(consts.countryOptions[0].idx);
    const [ hp, setHp ] = useState("");

    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ pwValid, setPwValid ] = useState(false);

    const [ error, setError ] = useState({});
    const [ success, setSuccess ] = useState("");

    useEffect(() => {
        setError({...error, 'emailInput': ''});
    }, [emailInput])

    useEffect(() => {
        setError({...error, 'hp': ''});
    }, [hp])

    useEffect(() => {
      
        if(type === 1) {
            setDisabled( !(emailInput && hp?.length > 9 ));
        } else {
            setDisabled( !(emailInput));
        }

    }, [type, emailInput, hp])

    const submitFunc = async () => {

        Keyboard.dismiss();
        
        if(disabled || load) return;

        if(!regEmail.test(emailInput)) {
            setError({...error, emailInput: lang({ id: 'email_is_not' })} );
            return;
        }
        if(type === 1 && !regPhone.test(hp)) {
            setError({...error, hp: lang({ id: 'invalid_phone_number' })} );
            return;
        }
        
        setLoad(true);

        const sender = {
            type: type,
            email: emailInput,
            hp: hp,
            country: country
        }
        console.log('sender', sender);

        const { data, error } = await API.post('/v2/passenger/user/sendAuth', sender);
        
        setTimeout(() => {
            setLoad(false);
            console.log(error);
            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error'});
                return;
            }

            setSignData({ key: 'email', value: emailInput });
            setSignData({ key: 'hp', value: hp });
            setSignData({ key: 'country', value: country });
            
            router.replace({
                pathname: routes.findPwIdentity,
                params: { type: type },
            });   

            // router.replace({}routes.findPwIdentity, { token: data });   
            // router.replace(routes.joinFormProfile);   
        }, consts.apiDelay)
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={50}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
            >
                <View style={styles.root}>

                    <View style={{ gap: 11, marginBottom: 21 }}>
                        <Text style={styles.title}>{lang({ id: 'reset_password' })}</Text>
                        <Text style={styles.subTitle}>{lang({ id: 'please_fill_informat' })}</Text>
                    </View>

                    <View style={{ gap: 18 }}>

                        <Radio 
                            state={type}
                            setState={setType}
                            list={[
                                {idx: 2, title: lang({ id: 'phone' })},
                                {idx: 3, title: lang({ id: 'email_1' })}
                            ]}
                        />

                        <View style={{ gap: 13 }}>
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
                                returnKeyType={type === 2 ? "next" : "done"}
                                onSubmitEditing={() => {
                                    if(type === 2) hpref.current?.focus();
                                    else submitFunc()
                                }}
                                blurOnSubmit={false}
                                maxLength={50}
                            />
                            {error?.emailInput && (
                                <ErrorMessage msg={error?.emailInput}/>
                            )}
                        </View>
                        
                        {type === 2 && (
                            <View style={{ gap: 13 }}>
                                <InputPhone 
                                    iref={hpref}
                                    required
                                    inputLabel={lang({ id: 'phone_number' })}
                                    valid={'hp'}
                                    name={'hp'}
                                    state={hp} 
                                    setState={setHp} 
                                    country={country}
                                    setCountry={setCountry}
                                    placeholder={lang({ id: 'phone_number' })} 
                                    returnKeyType={"done"}
                                    onSubmitEditing={submitFunc}
                                    blurOnSubmit={false}
                                    maxLength={10}
                                />
                                
                                {error?.hp && (
                                    <ErrorMessage msg={error?.hp}/>
                                )}
                            </View>
                        )}
                       
                     
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
            letterSpacing: -0.32
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