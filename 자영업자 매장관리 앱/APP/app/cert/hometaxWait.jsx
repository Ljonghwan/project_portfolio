import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

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
import TextList from '@/components/TextList';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, useBackHandler } from '@/libs/utils';

export default function Page() {

    const controller = new AbortController();

    const { styles } = useStyle();

    const router = useRouter();
    const { type, userId, password, businessNumber } = useLocalSearchParams();

    const { reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [startparams, setstartparams] = useState(null);
    const [payUrl, setpayUrl] = useState(null);

    const [disabled, setDisabled] = useState(true);
    const [load, setLoad] = useState(false);

    useBackHandler(() => {
        closeFunc();
        return true;
    });

    useEffect(() => {
        certFunc();

        return () => {
            controller.abort();
        }
    }, [])

    const certFunc = async () => {
        const { data, error } = await API.post('/storeAdd', {}, { signal: controller.signal });
        console.log('load Test!!!!!!!!', data, error);


        if (data || error?.message) {
            // 성공했거나, 에러발생 
            setDisabled(false);
        }
    }

    const closeFunc = () => {
        openAlertFunc({
            label: '매장등록 취소',
            title: '매장등록을 취소하시겠어요?\n지금 서비스를 나가면 매장 등록이 중단돼요.',
            onCencleText: '닫기',
            onPressText: '등록 취소',
            onCencle: () => { },
            onPress: () => {
                router.back();
            }
        })
    }


    const header = {
        title: "홈택스 연동하기",
        left: {
            icon: 'back',
            onPress: closeFunc
        },
    };


    return (
        <Layout header={header} statusBar={'dark'} >

            <View
                style={styles.root}
            >
                <Text style={[styles.title, { marginBottom: 15 }]}>홈택스 계정 정보를 확인하고 있어요.</Text>
                <Text style={[styles.subTitle, { marginBottom: 70 }]}>{`지금 서비스를 나가면 매장 등록이 중단돼요.\n조금만 기다려주세요!`}</Text>

                {disabled && <ActivityIndicator size={'small'} color={colors.black} />}


                {/* <View style={{ ...rootStyle.flex, justifyContent: 'space-around', marginBottom: 32 }}>
                    <Pressable style={styles.item} onPress={() => setOrgType('kakao')}>
                        <Image source={images.kakao} style={[styles.itemImage, orgType === 'kakao' && { borderColor: colors.primary }]} />
                        <Text style={styles.itemText}>카카오톡</Text>
                    </Pressable>
                    <Pressable style={styles.item} onPress={() => setOrgType('pass')}>
                        <Image source={images.pass} style={[styles.itemImage, orgType === 'pass' && { borderColor: colors.primary }]} />
                        <Text style={styles.itemText}>통신사패스</Text>
                    </Pressable>
                    <Pressable style={styles.item} onPress={() => setOrgType('naver')}>
                        <Image source={images.naver} style={[styles.itemImage, orgType === 'naver' && { borderColor: colors.primary }]} />
                        <Text style={styles.itemText}>네이버</Text>
                    </Pressable>
                </View> */}

            </View>

            <Button bottom disabled={disabled} load={load} onPress={() => { router.back() }} >{disabled ? "인증 대기중" : "인증 확인"}</Button>

            {/* <View style={{ flex: 1 }}>
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
                            userAgent={agent}
                            // userAgent={
                            //     Platform.OS === 'ios'
                            //     ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                            //     : 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.87 Mobile Safari/537.36'
                            // }
                            // onShouldStartLoadWithRequest={event => {
                            //     return onShouldStartLoadWithRequest(event);
                            // }}
                            onShouldStartLoadWithRequest={(request) => handleUrl(request.url)}
                            onMessage={handleMessage}
                            source={{ uri: consts.apiUrl + '/web/cert' }}
                            onLoadEnd={() => {
                                setTimeout(() => {
                                    setLoad(false);
                                }, 300)
                            }}
        
                        />
                    </KeyboardAvoidingView>
                )}

            </View> */}

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingTop: 40,
            paddingHorizontal: rootStyle.side
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.black,
            letterSpacing: -0.28,
            textAlign: 'center',
        },
        subTitle: {
            fontSize: 16,
            color: colors.text2B2B2B,
            lineHeight: 24,
            letterSpacing: -0.4,
            textAlign: 'center',
        },
        phoneApp: {
            position: 'absolute',
            top: -40,
            right: -20,
            padding: 10,
            borderRadius: 8,
            backgroundColor: colors.header
        }

    })

    return { styles }
}