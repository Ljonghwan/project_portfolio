import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { KeyboardStickyView } from "react-native-keyboard-controller";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import PasswordValid from '@/components/PasswordValid';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';


import { ToastMessage, regPhone } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';
import consts from '@/libs/consts';

export default function Page() {

	const insets = useSafeAreaInsets();

    const router = useRouter();
    const { token } = useLocalSearchParams();

    const { styles } = useStyle();
    const { login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    

    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});


    useEffect(() => {

    }, [])


    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        setLoad(true);

        const sender = {
            pass1: pw,
            pass2: repw,
            token: token
        }

        const { data, error } = await API.post('/v1/user/findPass', sender);

        // openLoader();
        setTimeout(() => {
            setLoad(false);

            // 비밀번호 변경 API
            if(error) {
                setError({...error, repw: error?.message});
                return;
            }

            ToastMessage("비밀번호가 변경되었습니다.");
            router.dismissAll();
            
        }, consts.apiDelay)
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
                <Text style={styles.title}>{`인증되었습니다.`}</Text>
                <View style={{ gap: 18, paddingHorizontal: 5 }}>
                    <View style={{ gap: 8 }}>
                        <Input 
                            autoFocus
                            iref={pwref}
                            inputLabel={'비밀번호를 재설정해 주세요.'}
                            name={'pw'}
                            state={pw} 
                            setState={setpw} 
                            placeholder={`비밀번호 입력`} 
                            returnKeyType={"next"}
                            onSubmitEditing={() => repwref.current?.focus() }
                            blurOnSubmit={false}
                            error={error}
                            setError={setError}
                            password
                        />
                        <Input 
                            iref={repwref}
                            name={'repw'}
                            state={repw} 
                            setState={setrepw} 
                            placeholder={`비밀번호 재입력`} 
                            returnKeyType={"done"}
                            onSubmitEditing={submitFunc}
                            blurOnSubmit={false}
                            error={error}
                            setError={setError}
                            password
                        />
                    </View>

                    <PasswordValid pw={pw} repw={repw} setValid={setDisabled}/>
                </View>

                <Button type={'2'} disabled={disabled} onPress={submitFunc} load={load}>비밀번호 저장</Button>
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
            paddingHorizontal: 5,
            letterSpacing: -0.45,
            color: colors.dark,
        },
	})

  	return { styles }
}