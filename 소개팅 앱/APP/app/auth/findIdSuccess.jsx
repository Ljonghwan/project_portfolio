import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, TouchableOpacity } from 'react-native';

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

import { ToastMessage, regEmail } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { type, email } = useLocalSearchParams();

    const { styles } = useStyle();
    const { login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])
 
    const submitFunc = () => {
        router.dismissAll();
    }

    const header = {
        title: "아이디 찾기",
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} input={false} >
            <View
                style={styles.root}
            >
                <View style={{ gap: 18 }}>
                    {type === 'email' ? (
                        <Text style={styles.title}>회원님은 이메일로 가입하셨습니다.</Text>
                    ) : (
                        <Text style={styles.title}>{`회원님은 ${type === 'kakao' ? '카카오' : type === 'naver' ? '네이버' : type === 'google' ? '구글' : type === 'apple' ? '애플' : '소셜'} 간편 가입하셨습니다.\n소셜 간편 로그인해 주세요.`}</Text>
                    )}
                    <View style={[rootStyle.flex, { gap: 8, paddingHorizontal: 12 }]}>
                        {type !== 'email' && <Image source={images?.[type]} style={rootStyle.default} /> }
                        <Text style={styles.email} numberOfLines={1}>{email}</Text>
                    </View>
                </View>
                
                <Button type={'2'} onPress={submitFunc}>로그인 하기</Button>
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
            textAlign: 'center',
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.45,
            color: colors.dark
        },
        email: {
            fontSize: 16,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            color: colors.main
        }
        
	})

  	return { styles }
}