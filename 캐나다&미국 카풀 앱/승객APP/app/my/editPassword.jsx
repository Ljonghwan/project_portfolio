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

    const { token } = useLocalSearchParams();

    const { styles } = useStyle();
    const { setSignData } = useSignData();
    const { openAlertFunc } = useAlert();

    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ pwValid, setPwValid ] = useState(false);

    
    useEffect(() => {
      
        setDisabled( !(!pwValid ));

    }, [ pwValid])

   
    const submitFunc = async () => {

        Keyboard.dismiss();
        
        if(disabled || load) return;

        setLoad(true);

        const sender = {
            pass1: pw,
            pass2: repw
        }

        const { data, error } = await API.post('/v2/my/updatePass', sender);
        
        console.log(error)
        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error'});
                return;
            }
            
            router.back();
            ToastMessage(lang({ id: 'password_has_been' }));

        }, consts.apiDelay)
    }

    const header = {
		left: {
			icon: 'back',
			onPress: () => {
                router.back();
            }
		},
	};

    return (
        <Layout header={header}>
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
                            <Text style={styles.title}>{lang({ id: 'reset_password' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'start_new_password' })}</Text>
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
                            />
                            <Input
                                iref={repwref}
                                state={repw}
                                setState={setrepw}
                                name={'pw'}
                                placeholder={lang({ id: 'confirm_password' })}
                                password
                            />

                            <PasswordValid pw={pw} repw={repw} setValid={setPwValid}/>
                        </View>
                    
                        
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.bottom} >
                    <Button disabled={disabled} style={{ width: 120 }} onPress={submitFunc} load={load}>{lang({ id: 'continue' })}</Button>
                </View>
            
            </View>
        </Layout>
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