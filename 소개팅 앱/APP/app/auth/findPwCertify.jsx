import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

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

import { ToastMessage, hpHypen } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { hp } = useLocalSearchParams();

    const { styles } = useStyle();
    const { login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const iref = useRef(null);

    const [ certify, setCertify ] = useState("");

    const [ timer, setTimer ] = useState(true);

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    useEffect(() => {

        setDisabled(( hp?.length < 11 ));

    }, [hp])

    const testFunc = () => {
       
        openAlertFunc({
            label: `소개팅 종료`,
            title: `채팅방을 나가면 대화내용이\n모두 삭제되고 채팅목록에서도 사라집니다.`,
            onCencleText: "닫기",
            onPressText: "확인",
            onCencle: () => {},
            onPress: () => {}
        })
    }

    const timeOut = () => {

        console.log("타임 아웃입니다");
        setError({...error, certify: '인증시간이 만료되었습니다.'});
        setTimer(false);
    }

    const reSend = async () => {

        setTimer(true);

        const sender = {
            hp: hp
        }

        const { data, error } = await API.post('/v1/user/sendAuth', sender);

        if(error) {
            setError({...error, certify: error.message});
            return;
            
        }

        setCertify("");
        setError({...error, certify: ''});

        setTimeout(() => {
            iref?.current?.focus();
        }, 100)
    }

    const checkFunc = async () => {

        if(!timer) {
            reSend();
            return;
        }

        if(!certify) return;

        // 인증번호 검증 API

        const sender = {
            hp: hp,
            authNumber: certify
        }

        const { data, error } = await API.post('/v1/user/checkAuth', sender);

        if(error) {
            setError({...error, certify: error?.message});
            return;
        }

        // 인증번호 일치시
        router.replace({
            pathname: routes.findPwSuccess,
            params: {
                token: data
            },
        });
    }

   
    const header = {
        title: "비밀번호 찾기",
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} input={true} >
            <View
                style={styles.root}
            >
                <Text style={styles.title}>{`입력하신 휴대폰번호로\n인증번호를 발송했습니다.`}</Text>
                <Text style={styles.subtitle}>{hpHypen(hp)}</Text>
                <Input 
                    autoFocus
                    iref={iref}
                    name={'certify'}
                    valid={'number'}
                    state={certify} 
                    setState={setCertify} 
                    placeholder={`인증번호`} 
                    returnKeyType={"done"}
                    onSubmitEditing={checkFunc}
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    maxLength={6}

                    readOnly={!timer}
                    timer={timer}
                    timerState={timeOut}
                    label={timer ? "확인" : "재전송"}
                    labelPress={checkFunc}
                    labelDisalbed={(!certify && timer)}
                />

                {/* <Button type={'2'} onPress={() => {
                    setTimer(false);
                    reSend();
                }} load={load}>재전송</Button> */}
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
            gap: 30
		},
        title: {
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            paddingHorizontal: 12,
            letterSpacing: -0.45,
            color: colors.dark,
        },
        subtitle: {
            fontSize: 20,
            fontFamily: fonts.medium,

            paddingHorizontal: 12,
        }
	})

  	return { styles }
}