import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter } from "expo-router";
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

import { ToastMessage, regPhone } from '@/libs/utils';

import { useUser, useSignData, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { styles } = useStyle();
    const { login } = useUser();
    const { setSignData } = useSignData();
    
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ hp, sethp ] = useState("");
    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    useEffect(() => {

        setDisabled(( hp?.length < 11 ));

    }, [hp])


    const submitFunc = async (result) => {

        if(!result) {

            router.replace({
                pathname: routes.joinFail,
                params: {
                    name: '홍길동',
                    hp: "01011112222",
                    type: 'kakao',
                    email: 'test123@test.com',
                },
            });

        } else {
            // 본인인증 결과 이름과 휴대폰번호 저장
            const { data, error } = await API.post('/asdasd', { hp: hp } );

            if(error) {
                ToastMessage({ message: error.message, type: 'error' });
                return;
            }

            if(data?.result) {
                // 가입가능
            } else {
                // 가입불가능
                // type, email
            }

            setSignData({ key: 'name', value: '홍길동' });
            setSignData({ key: 'hp', value: '01011112222' });

            router.replace(routes.joinForm);
        }
    }

    const header = {
        title: "휴대폰 인증",
        right: {
            text: '취소',
            onPress: () => router.dismissAll()
        }
    };

    return (
        <Layout header={header} input={true} statusBar={'dark'} >
            <View
                style={styles.root}
            >
                <Text style={styles.title}>{`본인인증 화면입니다`}</Text>
                <Button type={'2'} onPress={() => submitFunc(0)} load={load}>기존 유저일시</Button>
                <Button type={'2'} onPress={() => submitFunc(1)} load={load}>신규 가입일시</Button>
            </View>
           
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            padding: 40,
            gap: 20
		},
        title: {
            fontSize: 24,
            lineHeight: 32,
            fontFamily: fonts.semiBold
        },
	})

  	return { styles }
}