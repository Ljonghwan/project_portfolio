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
    const { login, pushToken } = useUser();
    const { id, type, typeText, email, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const name1ref = useRef(null);
    const name2ref = useRef(null);
    const hpref = useRef(null);

    const emailref = useRef(null);
    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ firstName, setFirstName ] = useState("");
    const [ lastName, setLastName ] = useState("");
    const [ gender, setGender ] = useState(consts.genderOptions[0].idx);
    const [ country, setCountry ] = useState(consts.countryOptions[0].idx);
    const [ hp, setHp ] = useState("");

    const [ nickname, setNickname ] = useState("");
    const [ emailInput, setEmailInput ] = useState("");
    const [ pw, setpw ] = useState("");

    const [ profile, setProfile ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ pwValid, setPwValid ] = useState(false);

    const [ error, setError ] = useState({});

    useEffect(() => {
        setError({...error, 'firstName': ''});
    }, [firstName, lastName])
    
    useEffect(() => {
        setError({...error, 'hp': ''});
    }, [hp])

    useEffect(() => {
      
        setDisabled( !(firstName && lastName && gender && hp?.length > 9 ));

    }, [firstName, lastName, gender, hp])


    const submitFunc = async () => {

        Keyboard.dismiss();
        
        
        if(disabled || load) return;

        if(!regName.test(firstName)) {
            setError({...error, firstName: `${lang({ id: 'please_use_letters_only' })}\n(e.g., 'Jane' not 'Jane 324')` });
            return;
        }
        if(!regName.test(lastName)) {
            setError({...error, firstName: `${lang({ id: 'please_use_letters_only' })}\n(e.g., 'Jane' not 'Jane 324')` });
            return;
        }
        if(!regPhone.test(hp)) {
            setError({...error, hp: lang({ id: 'invalid_phone_number' })} );
            return;
        }

        setLoad(true);
        
        const sender = {
            type: 1,
            country: country,
            hp: hp
        }

        const { data, error } = await API.post('/v2/passenger/user/sendAuth', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                setError({...error, hp: lang({ id: error?.message })} );
                return;
            }
        
            // 가입가능 - 인증번호 전송
            setSignData({ key: 'firstName', value: firstName });
            setSignData({ key: 'lastName', value: lastName });
            setSignData({ key: 'hp', value: hp });
            setSignData({ key: 'gender', value: gender });
            setSignData({ key: 'country', value: country });
            
            router.replace(routes.joinIdentity);   
        }, consts.apiDelay)
        
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={50}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"never"}
                keyboardDismissMode={'on-drag'}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
            >
                <View style={styles.root}>
                    <View style={{ gap: 11 }}>
                        <Text style={styles.title}>{lang({ id: 'please_check_your' })}</Text>
                        <Text style={styles.subTitle}>{lang({ id: 'certification_is_reg' })}</Text>
                    </View>

                    <View style={{ gap: 19 }}>

                        <View style={[rootStyle.flex, { gap: 15, alignItems: 'flex-end' }]}>
                            <Input 
                                style={{ flex: 1 }}
                                iref={name1ref}
                                required
                                inputLabel={lang({ id: 'name' })}
                                name={'firstName'}
                                state={firstName} 
                                setState={setFirstName} 
                                placeholder={lang({ id: 'first_name' })} 
                                returnKeyType={"next"}
                                onSubmitEditing={() => {
                                    name2ref.current?.focus() 
                                }}
                                blurOnSubmit={false}
                                maxLength={20}
                            />
                            <Input 
                                style={{ flex: 1 }}
                                iref={name2ref}
                                name={'lastName'}
                                state={lastName} 
                                setState={setLastName} 
                                placeholder={lang({ id: 'last_name' })} 
                                maxLength={20}
                                // onSubmitEditing={submitFunc}
                                // blurOnSubmit={false}
                            />
                        </View>

                        {error?.firstName && (
                            <ErrorMessage msg={error?.firstName} />
                        )}

                        <Radio 
                            required
                            inputLabel={lang({ id: 'gender' })}
                            state={gender}
                            setState={setGender}
                            list={
                                consts.genderOptions.map(x => { 
                                    return { ...x, title: lang({ id: x.title }) } 
                                })
                            }
                        />

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
                            <ErrorMessage msg={error?.hp} />
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
            alignItems: 'flex-end',
        },
        error: {
            fontSize: 16,
            color: colors.text_popup,
            letterSpacing: -0.32
        }
	})

  	return { styles }
}