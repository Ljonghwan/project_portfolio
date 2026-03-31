import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, TouchableOpacity, Platform, AppRegistry, Pressable } from 'react-native';
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

/** SNS로그인 */
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import * as AppleAuthentication from 'expo-apple-authentication';
import appleAuth, { appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { jwtDecode } from 'jwt-decode';


import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import lang from '@/libs/lang';

import { ToastMessage } from '@/libs/utils';

import { useUser, useAlert, useLoader, useSignData, useDriverData } from '@/libs/store';
import consts from '@/libs/consts';

export default function Page() {

    const { styles } = useStyle();

    const { pushToken, login } = useUser();
    const { setSignData, setSignDataStart } = useSignData();
    const { setDriverData } = useDriverData();

    useEffect(() => {

        GoogleSignin.configure({
            webClientId: 'webClientId'
        });

    }, [])

    const joinStart = async (data) => {
        // await checkBackgroundGpsPermission();
        // const result = await TaskManager.getRegisteredTasksAsync()
        // console.log('TaskManager', result);
        // return;

        setSignDataStart(data);
        setDriverData("init");

        router.navigate(routes.joinAgree)
        // router.navigate(routes.joinSuccess);
        // router.navigate(routes.joinFormProfile);

    }

    const snsLoginFunc = async (sns) => {
        const sender = {
            type: sns?.type,
            socialId: sns?.id,
            deviceToken: pushToken
        }
        console.log('snsLoginFunc', sender);

        const { data, error } = await API.post('/v2/driver/user/login', sender);
        console.log('error', data, error);
        if (data) {
            login({ token: data });
            return;
        }

        // SNS 가입 이력이없고 회원가입 가능한경우
        if (error?.code === 1004) {
            joinStart({
                id: sns?.id,
                type: sns?.type,
                typeText: sns?.typeText,
                email: sns?.email
            })
        }
    }

    const snsLogin = (type) => {

        setSignData('init');

        if(type === 'google') {
            signInWithGoogle()
        } else if(type === 'apple') {
            signInWithApple()
        } else {
            router.push(routes.emailLogin)
            // sheetRef?.current?.expand();
        }
    }

    const signInWithGoogle = async () => {
        try {
            console.log(1)
            await GoogleSignin.hasPlayServices();
            console.log(2)
            const { data, type } = await GoogleSignin.signIn();
            console.log('err1', data, type);

            if(!data && type !== "success") {
                throw({ type });
            }

            snsLoginFunc({
                id: data?.user?.id,
                type: 'google',
                typeText: '구글',
                email: data?.user?.email
            })
           

          } catch (err) {
            console.log('err2', err);
            if(err?.type !== 'cancelled') {
                ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
            }
        }
    }

    const signInWithApple = async () => {

        if(Platform.OS === 'ios') {

            try {
                const { identityToken } = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                });
    
                if(!identityToken ) {
                    throw('fail');
                }
    
                const { email, sub } = jwtDecode(identityToken);
                
                if(!email || !sub) {
                    throw('noData');
                }
    
                snsLoginFunc({
                    id: sub,
                    type: 'apple',
                    typeText: '애플',
                    email: email
                })

    
            } catch (e) {
                if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_REQUEST_UNKNOWN') {
                    ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
                } 
            }
            
            
        } else {

            let clientId = 'com.taseta.tasetaweb';
            let redirectURI = consts.apiUrl + "/login";
            
            const rawNonce = uuid();
            const state = uuid();
            
            appleAuthAndroid.configure({
                clientId: clientId,
                redirectUri: redirectURI,
                responseType: appleAuthAndroid.ResponseType.ALL,
                scope: appleAuthAndroid.Scope.ALL,
                nonce: rawNonce,
                state,
            });

            try {
                // Open the browser window for user sign in
                const response = await appleAuthAndroid.signIn();

                // console.log(response?.user?.name?.lastName + response?.user?.name?.firstName);
                
                const { email, email_verified, is_private_email, sub } = jwtDecode(response?.id_token)

                if(!sub) {
                    throw('fail');
                }
    
                snsLoginFunc({
                    id: sub,
                    type: 'apple',
                    typeText: '애플',
                    email: email
                })
                
            } catch ({ message }) {
                if(message === 'E_SIGNIN_CANCELLED_ERROR') return;
                ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
            }
            
        }

    }


    return (
        <Layout>
            <View
                style={styles.root}
            >
                <View style={styles.top}>
                    <Image source={images.logo} style={rootStyle.logo} />
                    {/* <Icon img={images.exit} imgStyle={rootStyle.exit} hitSlop={10} onPress={testFunc}/> */}
                    <Text style={{...rootStyle.font(18, colors.main, fonts.medium)}}>{lang({ id: 'with_driver' })}</Text>
                </View>

                <View style={styles.bottom}>
                    <View style={{ gap: 11 }}>
                        <TouchableOpacity style={styles.sns} activeOpacity={0.7} onPress={() => snsLogin('google')}>
                            <Image source={images.google} style={rootStyle.default} />
                            {/* <Image source={images.google} style={{width: 20, height: 17}} /> */}
                            <Text style={styles.snsText}>{lang({ id: 'sign_google' })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.sns, { backgroundColor: colors.black, borderColor: colors.black }]} activeOpacity={0.7} onPress={() => snsLogin('apple')}>
                            <Image source={images.apple} style={rootStyle.default} />
                            <Text style={[styles.snsText, { color: colors.white }]}>{lang({ id: 'sign_apple' })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.sns]} activeOpacity={0.7} onPress={() => snsLogin()}>
                            <Image source={images.email} style={rootStyle.default} />
                            <Text style={[styles.snsText]}>{lang({ id: 'sign_email' })}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bar} />

                    <View style={{ gap: 11 }}>
                        <Text style={styles.help}>{lang({ id: 'arent_you_member' })}</Text>
                        <Button onPress={() => { joinStart() }}>{lang({ id: 'sign_up' })}</Button>
                    </View>

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
            paddingHorizontal: rootStyle.side
        },
        top: {
            flex: 1,
            alignItems: "center",
            justifyContent: 'center',
            paddingTop: 100,
            gap: 10
        },

        bottom: {
            paddingBottom: 75
        },

        sns: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 26,
            width: "100%",
            height: 50,
            borderRadius: 12,
            borderColor: colors.main,
            borderWidth: 1
        },
        snsText: {
            flex: 1,
            textAlign: 'center',
            fontFamily: fonts.medium,
            fontSize: 17,
            letterSpacing: -0.34
        },
        bar: {
            width: '100%',
            height: 1,
            backgroundColor: colors.sub_1,
            marginTop: 40,
            marginBottom: 70
        },
        help: {
            fontSize: 16,
            color: colors.sub_1,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.64
        }

    })

    return { styles }
}
