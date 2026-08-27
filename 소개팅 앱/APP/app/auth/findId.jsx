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
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, regPhone } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';
import consts from '@/libs/consts';

export default function Page() {

    const router = useRouter();
    const { styles } = useStyle();
    const { login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const iref = useRef(null);

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

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        if(!regPhone.test(hp)) {
            setError({...error, hp: '올바른 형식의 휴대폰번호를 입력해주세요'});
            return;
        }

        setLoad(true);
        // openLoader();

        const sender = {
            hp: hp
        }

        const { data, error } = await API.post('/v1/user/findAccount', sender);

        console.log('data', data);
        
        setLoad(false);

        setTimeout(() => {
            // 아이디찾기 API
            if(error) {
                setError({...error, hp: error?.message});
                return;
            }

            router.navigate({
                pathname: routes.findIdSuccess,
                params: {
                    type: data?.type,
                    email: data?.email,
                },
            });
            
        }, consts.apiDelay)
    }

    const header = {
        title: "아이디 찾기",
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
                <Text style={styles.title}>{`휴대전화 번호를 입력하여\n아이디를 찾을 수 있습니다.`}</Text>

                <View style={{ gap: 18 }}>
                    <Input 
                        iref={iref}
                        autoFocus
                        name={'hp'}
                        valid={'hp'}
                        state={hp} 
                        setState={sethp} 
                        placeholder={`‘-’없이 입력하세요.`} 
                        returnKeyType={"done"}
                        onSubmitEditing={submitFunc}
                        blurOnSubmit={false}
                        error={error}
                        setError={setError}
                        maxLength={11}
                    />

                    <Button type={'2'} disabled={disabled} onPress={submitFunc} load={load}>확인</Button>
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
            gap: 30
		},
        title: {
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            paddingHorizontal: 12,
            letterSpacing: -0.45,
            color: colors.dark,
        }
	})

  	return { styles }
}