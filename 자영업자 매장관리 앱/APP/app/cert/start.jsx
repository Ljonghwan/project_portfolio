import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

import Constants from 'expo-constants';
import WebView from 'react-native-webview';

import * as WebBrowser from 'expo-web-browser';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useLoader, useAlert, useSignData } from '@/libs/store';

import { ToastMessage, handleIntentUrl, handleIntentUrlCert } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { type } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const { reload } = useUser();
    const { setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [agent, setAnget] = useState(null);
    const [startparams, setstartparams] = useState(null);
    const [payUrl, setpayUrl] = useState(null);

    const [load, setLoad] = useState(true);

    useEffect(() => {
        dataFunc();
    }, []);

    const dataFunc = async () => {
        try {
            Constants.getWebViewUserAgentAsync().then((data) => {
                console.log('await NativeConstants.getWebViewUserAgentAsync()', data);
                setAnget(data);
            })
        } catch (error) {
            console.log('error', error);
        }
       
    }

    const handleUrl = (url) => {
        console.log('url', url, typeof (url));

        if (!url.startsWith('http') && !url.startsWith('about:blank') && url !== 'null') {
            console.log('url??????', url);

            // Linking.openURL(url).catch(() => {
            //     Alert.alert('앱 실행 실패', '해당 앱이 설치되어 있지 않습니다.');
            // });
            if (Platform.OS === 'android' && url.startsWith("intent:")) {
                handleIntentUrlCert(url)
            } else {
                Linking.openURL(url).catch(() => {
                    Alert.alert('앱 실행 실패', '해당 앱이 설치되어 있지 않습니다.');
                });
            }

            return false;
        } else if (url.includes(consts.apiUrl + '/mok/mok_std_result')) {
            // 결제 성공 or 실패 처리
            // openLoader();
            // setLoad(true);
            // paymentCheckFunc();
            // return false;
        }

        return true;
    };

    const handleMessage = (event) => {
        openLoader();

        console.log('event?.nativeEvent?.data', event?.nativeEvent?.data);
        const res = JSON.parse(event?.nativeEvent?.data) || {};
        console.log('웹에서 받은 메시지:', res);

        /**
        {
            "data": {
                "errorCode": "2000", 
                "name": "김대호", 
                "resultMsg": "성공", 
                "userBirthday": "19890217", 
                "userGender": "1", 
                "userPhone": "01055116166"
            }, 
            "error": false,
            "message": "인증성공"
        }
         */

        setTimeout(() => {
            // 성공 or 실패
            if (res?.error) {
                Alert.alert('인증 실패', res?.message);
                closeLoader();
                return;
            } 
            
            if(type === 'join') joinFunc(res?.data);
            else if(type === 'update') updateFunc(res?.data);
            // 회원정보 갱신
            // reload();
            // router.back();

        }, consts.apiDelayLong);

        // 예: JSON.parse(message) 등으로 구조화 가능
    };


    const joinFunc = async (user) => {

        /** 본인인증후 API로 휴대폰번호 중복검사 */
        const hp = user?.userPhone;
        
        const { data, error } = await API.post('/v1/auth/checkRegiste', { hp });
        console.log('data', data, error);

        if (error) {
            closeLoader();
            ToastMessage(error?.message);
            router.back();
            return;
        }

        if (data) {
            // 가입가능
            setSignData({ key: 'name', value: user?.name });
            setSignData({ key: 'hp', value: hp });
            setSignData({ key: 'birth', value: user?.userBirthday });
            setSignData({ key: 'gender', value: user?.userGender * 1 });

            closeLoader();

            router.replace(routes.joinNick);
            
        } else {
            // 가입불가능
            closeLoader();
            openAlertFunc({
                label: `기존 회원 안내`,
                title: `이미 이용 중이시네요!\n로그인하시겠어요?`,
                onCencleText: "다음에",
                onPressText: "로그인",
                onCencle: () => { 
                    router.dismissAll();
                    router.replace(routes.intro);
                },
                onPress: () => { 
                    router.dismissTo(routes.login)
                }
            })
        }

    }

    const updateFunc = async (user) => {

        openLoader();

        const result = {
            hp: user?.userPhone,
            name: user?.name,
        }

        const sender = {
            type: 'hp',
            ...result
        }

        const { data, error } = await API.post('/v1/my/updateInfo', sender);

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
            } else {
                ToastMessage('휴대폰번호가 변경되었습니다.');
                reload();
            }

            router.back();
        }, consts.apiDelay)

    }

    const header = {
        title: '본인인증',
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header}  >

            <View style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.black} fixed entering={false} />}

                {agent && (
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={'height'}
                        enabled={Platform.OS === 'android'}
                    >
                        <WebView
                            style={styles.webview}
                            originWhitelist={['*']}
                            decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
                            // userAgent={agent}
                            userAgent={
                                Platform.OS === 'ios'
                                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                                : 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.87 Mobile Safari/537.36'
                            }
                            // onShouldStartLoadWithRequest={event => {
                            //     return onShouldStartLoadWithRequest(event);
                            // }}
                            onShouldStartLoadWithRequest={(request) => handleUrl(request.url)}
                            onMessage={handleMessage}
                            source={{ uri: consts.mokUrl + '/web/cert' }}
                            onLoadEnd={() => {
                                setTimeout(() => {
                                    setLoad(false);
                                }, 300)
                            }}
                            bounces={false}
                            containerStyle={{
                            }}
                        />
                    </KeyboardAvoidingView>
                )}
               

            </View>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            padding: 20,
            gap: 12,
        },
        container: {
            flex: 1
        },
        webview: {
            backgroundColor: colors.white,
            flex: 1
        }
    })

    return { styles }
}