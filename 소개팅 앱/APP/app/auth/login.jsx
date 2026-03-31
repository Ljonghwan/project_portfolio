import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, TouchableOpacity, Platform, AppRegistry } from 'react-native';
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

/** SNS로그인 */
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { logout as kakaoLogout, unlink as kakaoUnlink, login as kakaoLogin, getProfile as getKakaoProfile } from '@react-native-seoul/kakao-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { jwtDecode } from 'jwt-decode';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';

import BottomSheetTemplate from '@/components/BottomSheetTemplate';
import Term from '@/components/Term';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, regEmail, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    
    const { styles } = useStyle();
    const { pushToken, login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { type, setSignData, setSignDataStart } = useSignData();
    
    const emailref = useRef(null);
    const pwref = useRef(null);
    const sheetRef = useRef(null);
    const sheetIndexRef = useRef(null);

    const [ sheetIndex, setsheetIndex ] = useState(-1);

    const [ email, setemail ] = useState("");
    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    // useBackHandler(() => {
    //     if(sheetIndexRef?.current >= 0) {
    //         sheetRef?.current?.forceClose();
    //         return true;
    //     }
    //     return false;
    // });

    
    useEffect(() => {
        
        NaverLogin.initialize({
            appName: '사소한 1%',
            consumerKey: 'consumerKey',
            consumerSecret: 'consumerSecret',
            serviceUrlSchemeIOS: 'serviceUrlSchemeIOS',
            disableNaverAppAuthIOS: true,
        });

        GoogleSignin.configure({
            webClientId: 'webClientId'
        });
    }, [])

    useEffect(() => {

        setError({});
        setDisabled(!( email && pw ));

    }, [email, pw])

    const testFunc = () => {
       
        sheetRef?.current?.expand();
        return;
        
        openAlertFunc({
            alertType: 'Sheet',
            component: <Term />
        })
    }

    const loginFunc = async () => {
        
        Keyboard.dismiss();

        if(load) return;

        if(!email || !pw) {
            setError({...error, pw: '이메일과 비밀번호를 입력해 주세요.'});
            return;
        }

        if(!regEmail.test(email)) {
            setError({...error, pw: '이메일 형식이 올바르지 않습니다.'});
            return;
        }

        setLoad(true);

        const sender = {
            type: 'email',
            email: email,
            password: pw,
            deviceToken: pushToken
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/user/login', sender);
        
        if(error) {
            setLoad(false);
            setError({...error, pw: error?.message});
            return;
        }

        login({ token: data });

        setTimeout(() => {
            setLoad(false);
        }, 300)

    }

    const snsLoginFunc = async (sns) => {

        const sender = {
            type: sns?.type,
            socialId: sns?.id,
            deviceToken: pushToken
        }
        console.log('snsLoginFunc', sns);

        const { data, error } = await API.post('/v1/user/login', sender);
       
        if(data) {
            login({ token: data });
            return;
        }

        // SNS 가입 이력이없고 회원가입 가능한경우
        if(error?.code === 1004) {
            setSignDataStart({
                id: sns?.id,
                type: sns?.type,
                typeText: sns?.typeText,
                email: sns?.email
            })
    
            termView();
            return;
        }
        
        ToastMessage(error?.message);
    }


    const snsLogin = (type) => {

        setSignData('init');

        if(type === 'kakao') {
            signInWithKakao();
        } else if(type === 'naver') {
            signInWithNaver();
        } else if(type === 'google') {
            signInWithGoogle()
        } else if(type === 'apple') {
            signInWithApple()
        } else {
            setSignDataStart();
            termView();
            // sheetRef?.current?.expand();
        }
    }

    const signInWithKakao = async () => {

        const token = await kakaoLogin();

        if(!token) {
            return;
        }
        
        try {
            const profile = await getKakaoProfile();

            if(!profile) {
                throw('인증실패');
            }

            // snsLoginFunc({
            //     id: '4322426985',
            //     type: 'kakao',
            //     typeText: '카카오',
            //     email: 'dhwjs31@naver.com'
            // })
            // return;

            snsLoginFunc({
                id: profile?.id,
                type: 'kakao',
                typeText: '카카오',
                email: profile?.email
            })

        } catch (err) {
            ToastMessage("요청에 실패하였습니다.");
        } finally {
            // await kakaoUnlink();
            // await kakaoLogout();
        }
    };

    const signInWithNaver = async () => {

        try {
            console.log('signInWithNaver');
            const { failureResponse, successResponse } = await NaverLogin.login();
            console.log('failureResponse', failureResponse, successResponse);
    
            if(!successResponse) {
                return;
            }
    
            try {
                const { message, response } = await NaverLogin.getProfile(successResponse?.accessToken);
    
                if(!response) {
                    throw('인증실패');
                }
                
                snsLoginFunc({
                    id: response?.id,
                    type: 'naver',
                    typeText: '네이버',
                    email: response?.email
                })
               
        
            } catch (err) {
                ToastMessage("요청에 실패하였습니다.");
            }
        } catch (error) {
            console.log('error', error);
        } finally {
            // await NaverLogin.logout();
            await NaverLogin.deleteToken();
        }
        
    }

    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { data, type } = await GoogleSignin.signIn();

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
            if(err?.type !== 'cancelled') {
                ToastMessage("요청에 실패하였습니다.");
            }
        } finally {
            await GoogleSignin.signOut();
        }
    }

    const signInWithApple = async () => {
        if(Platform.OS === 'ios') {
            return;
        }

        try {
            const { identityToken } = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if(!identityToken ) {
                throw('인증실패');
            }

            const { email, sub } = jwtDecode(identityToken);
            
            if(!email || !sub) {
                throw('인증실패');
            }

            snsLoginFunc({
                id: sub,
                type: 'apple',
                typeText: '애플',
                email: email
            })


        } catch (e) {
            if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_REQUEST_UNKNOWN') {
                ToastMessage("요청에 실패하였습니다.");
            } 
        }
            
            
    }

    
    const termView = () => {
        router.navigate(routes.joinAgree);
        // sheetRef?.current?.expand();
    }

    const joinNext = (marketing) => {
        console.log('marketing', marketing, type);

        sheetRef?.current?.forceClose();

        setSignData({ key: 'marketing', value: marketing });

        setTimeout(() => {
            router.navigate(routes.joinIdentity);
        }, 300)
       
    }

    return (
        <Layout input={true} statusBar={'dark'}>
            <View
                style={styles.root}
            >

                <View style={styles.container}>
                    <View style={styles.top}>
                        <Image source={images.login_logo} style={styles.logo} />
                        {/* <Icon img={images.exit} imgStyle={rootStyle.exit} hitSlop={10} onPress={testFunc}/> */}
                    </View>
                    
                    <View>
                        <View style={{ gap: 12, marginBottom: 20 }}>
                            <Input 
                                inputWrapStyle={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, paddingHorizontal: 20 }}
                                placeholderTextColor={colors.text_sub}
                                name={'email'}
                                valid={'email'}
                                state={email} 
                                setState={setemail} 
                                placeholder={`이메일 입력`} 
                                returnKeyType={"next"}
                                onSubmitEditing={() => pwref.current?.focus() }
                                blurOnSubmit={false}
                                error={error}
                                setError={setError}
                            />
                            <Input
                                inputWrapStyle={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, paddingHorizontal: 20 }}
                                placeholderTextColor={colors.text_sub}
                                iref={pwref}
                                state={pw}
                                setState={setpw}
                                name={'pw'}
                                placeholder={'비밀번호 입력'}
                                password
                                returnKeyType={"done"}
                                onSubmitEditing={loginFunc}
                                error={error}
                                setError={setError}
                            />
                        </View>

                        <Button 
                            // disabled={disabled} 
                            onPress={loginFunc} 
                            load={load}
                        >로그인</Button>

                        <View style={styles.find}>
                            <TouchableOpacity onPress={() => router.navigate(routes.findId)}>
                                <Text style={styles.findText} >아이디 찾기</Text>
                            </TouchableOpacity>
                            <Text style={styles.findText}> | </Text>
                            <TouchableOpacity onPress={() => router.navigate(routes.findPw)}>
                                <Text style={styles.findText}>비밀번호 찾기</Text>
                            </TouchableOpacity>
                            {/* <Text style={styles.findText}> | </Text>
                            <TouchableOpacity onPress={snsLogin}>
                                <Text style={styles.findText}>회원가입</Text>
                            </TouchableOpacity> */}
                        </View>

                        
                    </View>
                    <View style={{ gap: 20 }}>
                        <Text style={styles.socialText}>소셜 간편로그인</Text>

                        <View style={[rootStyle.flex, { gap: 15 }]}>
                            <View style={styles.snsBox}>
                                <Icon img={images.kakao} imgStyle={rootStyle.sns} hitSlop={10} onPress={() => snsLogin('kakao')}/> 
                                {/* <Text style={styles.snsText}>{`카카오로\n시작하기`}</Text> */}
                            </View>

                            <View style={styles.snsBox}>
                                <Icon img={images.naver} imgStyle={rootStyle.sns} hitSlop={10} onPress={() => snsLogin('naver')}/> 
                                {/* <Text style={styles.snsText}>{`네이버로\n시작하기`}</Text> */}
                            </View>
                            
                            {Platform.OS === 'ios' && (
                                <View style={styles.snsBox}>
                                    <Icon img={images.apple} imgStyle={rootStyle.sns} hitSlop={10} onPress={() => snsLogin('apple')}/>
                                    {/* <Text style={styles.snsText}>{`애플로\n시작하기`}</Text> */}
                                </View>
                            )}

                            <View style={styles.snsBox}>
                                <Icon img={images.google} imgStyle={rootStyle.sns} hitSlop={10} onPress={() => snsLogin('google')}/> 
                                {/* <Text style={styles.snsText}>{`구글로\n시작하기`}</Text> */}
                            </View>
                           
                        </View>
                    </View>

                    <View style={{ gap: 12, marginTop: 25 }}>
                        <Text style={{...rootStyle.font(16, colors.black, fonts.light), textAlign: 'center'}}>사소한 회원이 아니신가요?</Text>
                        <Button type={'12'} onPress={() => {

                            // setSignDataStart();

                            // setSignData({ key: 'name', value: '홍길동' });
                            // setSignData({ key: 'hp', value: '01012341234' });
                            // setSignData({ key: 'birth', value: '19900101' });
                            // setSignData({ key: 'gender', value: 1 });

                            // router.navigate(routes.joinSuccess);
                            // return;

                            snsLogin()
                        }}>회원 가입</Button>
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
            paddingTop: insets?.top || 20,
            paddingBottom: (insets?.bottom || 20) + 40,
            paddingHorizontal: 16,
		},
        top: {
            width: '100%',
            flexDirection: 'row',
            alignItems: "center",
            justifyContent: 'center',
            marginBottom: 90
        },
        logo: {
            width: '100%',
            aspectRatio: 380/64.3,
        },
        container: {
            flex: 1,
            justifyContent: 'center',
        },
		title: {
            color: colors.dark,
            fontFamily: fonts.semiBold,
            fontSize: 24,
            lineHeight: 32,
            marginBottom: 12
        },
        subtitle: {
            color: colors.white,
            fontFamily: fonts.semiBold,
            fontSize: 36,
            textAlign: 'center'
        },
        find: {
            flexDirection: 'row', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        findText: {
            paddingVertical: 20,
            color: colors.black,
            fontSize: 16,
            fontFamily: fonts.light
        },
        snsBox: {
            paddingHorizontal: 5,
            gap: 6
        },
        social: {
            gap: 20
        },
        snsText: {
            color: colors.grey9,
            fontSize: 12,
            lineHeight: 13,
            textAlign: 'center',
            letterSpacing: -0.3
        },
        socialText: {
            textAlign: 'center',
            color: colors.dark,
            fontSize: 16
        }
	})

  	return { styles }
}
