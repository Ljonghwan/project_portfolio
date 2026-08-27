import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

import Constants from 'expo-constants';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

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

import { useUser, useAlert, useLoader, useSignStoreData } from '@/libs/store';

import { ToastMessage, useBackHandler } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();

    const { reload } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

	const { business_num, open_date, setSignStoreData } = useSignStoreData();

    const controllerRef = useRef(null);

    const [uuids, setUuids] = useState(uuid());

    const [startparams, setstartparams] = useState(null);
    const [payUrl, setpayUrl] = useState(null);

    const [disabled, setDisabled] = useState(true);
    const [load, setLoad] = useState(false);

    useBackHandler(() => {
        closeFunc();
        return true;
    });

    useEffect(() => {
        controllerRef.current = new AbortController(); 
        certFunc();
        
        return async () => {
            controllerRef.current.abort();

            const sender = {
                uuid: uuids
            }
            await API.post('/v1/store/certCancel', sender );
        }
    }, [])

    const certFunc = async () => {

        const sender = {
            business_num: business_num,
            open_date: open_date,
            uuid: uuids
        }

        const { data, error } = await API.post('/v1/store/cert', sender, { signal: controllerRef.current.signal });

        setDisabled(false);
        closeAlertFunc();
        
        if(error) {
            if(!error?.message) return;

            openAlertFunc({
                label: '사업자번호 조회 실패',
                title: error?.message,
                onPressText: '확인',
                onCencle: () => { 
                    router.back();
                },
                onPress: () => {
                    router.back();
                }
            })
            return;
        }
     
        router.replace(routes.storeAddForm);
    }

    const closeFunc = () => {
        openAlertFunc({
            label: '매장 등록 취소',
            title: '매장 등록을 취소하시겠어요?\n지금 화면을 나가면 매장 등록이 중단돼요.',
            onCencleText: '닫기',
            onPressText: '등록 취소',
            onCencle: () => { },
            onPress: async () => {
                router.dismiss(2);
            }
        })
    }


    const header = {
        title: "매장 등록",
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
                <Text style={[styles.title, { marginBottom: 15 }]}>사업장 정보를 확인하고 있어요.</Text>
                <Text style={[styles.subTitle, { marginBottom: 70 }]}>{`지금 서비스를 나가면 등록이 중단돼요.\n조금만 기다려주세요!`}</Text>

                {disabled && <ActivityIndicator size={'small'} color={colors.black} />}

            </View>

            <Button bottom disabled={disabled} load={load} onPress={() => { router.back() }} >{disabled ? "인증 대기중" : "인증 확인"}</Button>


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