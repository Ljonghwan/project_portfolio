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

import { ToastMessage, regPhone } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { name, type, email } = useLocalSearchParams();

    const { styles } = useStyle();
    const { login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ pw, setpw ] = useState("");

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
        title: "회원가입",
        left: {
            icon: 'back',
            onPress: () => router.dismissAll()
        },
    };

    return (
        <Layout header={header} input={true} statusBar={'dark'} >
            <View
                style={styles.root}
            >
                <Text style={styles.label}>{`이미 가입한 계정이 있습니다.`}</Text>

                <View style={{ gap: 18 }}>
                    {/* {type === 'email' ? (
                        <Text style={styles.title}>회원님은 이메일로 가입하셨습니다.</Text>
                    ) : (
                        <Text style={styles.title}>{`회원님은 ${type === 'kakao' ? '카카오' : type === 'naver' ? '네이버' : type === 'google' ? '구글' : type === 'apple' ? '애플' : '소셜'} 간편가입하셨습니다.\n소셜 간편로그인해주세요.`}</Text>
                    )} */}

                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4, paddingHorizontal: 12 }]}>
                        <Text style={styles.label2}>이름</Text>
                        <Text style={styles.email}>{name}</Text>
                    </View>

                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10, paddingHorizontal: 12 }]}>
                        <Text style={styles.label2}>이메일</Text>
                        {type !== 'email' && (
                            <Image source={images?.[type]} style={rootStyle.default} />
                        )}
                        <Text style={[styles.email, { color: colors.primary }]} numberOfLines={1}>{email}</Text>
                    </View>
                   
                    {/* <View style={[rootStyle.flex, { gap: 15 }]}>
                        {type !== 'email' && <Image source={images?.[type]} style={rootStyle.default} /> }
                        <Text style={styles.email} numberOfLines={1}>{email}</Text>
                    </View> */}
                </View>
                
                <Button type={2} onPress={submitFunc}>{type !== 'email' ? '소셜 로그인' : '로그인 하기'}</Button>
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
        label: {
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.semiBold,
            paddingHorizontal: 10,
            color: colors.dark,
        },
        title: {
            textAlign: 'center',
            lineHeight: 20
        },
        label2: {
            fontSize: 16,
            color: colors.text_info,
            width: 56
        },
        email: {
            fontSize: 16,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            flexShrink: 1,
        }
	})

  	return { styles }
}