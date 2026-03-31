import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import WebView from 'react-native-webview';

import * as WebBrowser from 'expo-web-browser';

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

import { useUser, useLoader } from '@/libs/store';

import { ToastMessage, handleIntentUrl } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { type, idx } = useLocalSearchParams();

    const { reload } = useUser();
    const { openLoader, closeLoader } = useLoader();

    const [starturl, setstarturl] = useState(null);
    const [startparams, setstartparams] = useState(null);
    const [payUrl, setpayUrl] = useState(null);

    const [load, setLoad] = useState(true);

    useEffect(() => {
        dataFunc();
    }, []);

    const dataFunc = async () => {

        try {

            let sender = {
                type: type * 1,
                idx: idx,
                // userAgent: 'WP'
            };

            const { data, error } = await API.post('/pay/makePay', sender);

            setTimeout(() => {
                if (error) {
                    router.back();
                    ToastMessage(error?.message);
                    return;
                }

                setstarturl(data?.starturl);
                setstartparams(data?.startparams);
                setpayUrl(data?.payUrl);

            }, consts.apiDelay);

        } catch (error) {
            console.log('error', error)
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
                handleIntentUrl(url)
            } else {
                Linking.openURL(url).catch(() => {
                    Alert.alert('앱 실행 실패', '해당 앱이 설치되어 있지 않습니다.');
                });
            }
            
            return false;
        } else if (url.includes(consts.apiUrl + '/pay/callback')) {
            // 결제 성공 or 실패 처리
            openLoader();
            // setLoad(true);
            // paymentCheckFunc();
            // return false;
        }

        return true;
    };

    const handleMessage = (event) => {
        const res = JSON.parse(event?.nativeEvent?.data) || {};
        console.log('웹에서 받은 메시지:', res);

        setTimeout(() => {
            // 성공 or 실패
            closeLoader();

            if (res?.error) {
                Alert.alert('구매 실패', res?.message);
            } else {
                // 결제성공
                // 리매치 신청 api 
                // 
                ToastMessage(res?.message);
            }

            // 회원정보 갱신
            reload();
            router.back();

        }, consts.apiDelay);

        // 예: JSON.parse(message) 등으로 구조화 가능
    };


    const header = {
        title: '픽켓 결제',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >

            <View style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}

                {starturl && (
                    <WebView
                        style={styles.webview}
                        originWhitelist={['*']}
                        // onShouldStartLoadWithRequest={event => {
                        //     return onShouldStartLoadWithRequest(event);
                        // }}
                        onShouldStartLoadWithRequest={(request) => handleUrl(request.url)}
                        onMessage={handleMessage}
                        source={{
                            html: `
                            <!DOCTYPE html>
                            <html lang="ko">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=yes">
                                </head>
                                <body>
                                    <form name="form" ACTION="${starturl}" METHOD="POST">
                                        <input TYPE="HIDDEN" NAME="STARTPARAMS" VALUE="${startparams}">
                                    </form>
                                    <script>
                                        document.form.submit();
                                    </script>
                                </body>
                            </html>
                        `
                        }}
                        onLoadEnd={() => {
                            setTimeout(() => {
                                setLoad(false);
                            }, 1000)
                        }}

                    />
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
        }
    })

    return { styles }
}