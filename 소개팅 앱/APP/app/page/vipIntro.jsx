import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import GradientButton from '@/components/GradientButton';
import Icon from '@/components/Icon';
import Input from '@/components/Input';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { name, hp, type, email } = useLocalSearchParams();

    const { styles } = useStyle();
    const { mbData, login } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useBackHandler(() => {
        submitFunc();
        return true;
    });

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const submitFunc = () => {
        router.canDismiss() && router.dismissAll();
        router.replace(routes.tabs);
    }

    return (
        <Layout statusBar={'dark'} >
            <View
                style={styles.root}
            >
                <View style={styles.top}>
                    <Image source={images.logo} style={styles.logo} />
                </View>

                <View style={{ gap: 40 }}>
                    <View style={{ gap: 12, flexDirection: 'column', }}>
                        <View style={styles.lottie}>
                            <LottieView
                                autoPlay
                                style={{
                                    width: 160,
                                    height: 160,
                                }}
                                source={images.lottie_join}
                            />
                        </View>

                        <Text style={styles.title}>{`1% 회원 가입 인트로 페이지`}</Text>
                        <Text style={styles.subTitle}>{`사소한에서 새로운 만남을\n시작하세요.`}</Text>
                    </View>
                    <GradientButton onPress={submitFunc}>좋아요!</GradientButton>
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
            padding: 40,
            paddingTop: insets?.top + 40,
            justifyContent: 'space-between'
		},
        logo: {
            width: 58,
            aspectRatio: "9/10",
        },
        lottie: {
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 100,
            padding: 40,
            backgroundColor: colors.primaryLight,
            aspectRatio: "1/1",
            alignSelf: 'flex-start'
        },
        title: {
            textAlign: 'right',
            fontSize: 28,
            lineHeight: 33,
            fontFamily: fonts.medium,
            color: colors.dark
        },
        subTitle: {
            textAlign: 'right',
            fontSize: 20,
            lineHeight: 24,
            color: colors.grey6
        },
       
	})

  	return { styles }
}