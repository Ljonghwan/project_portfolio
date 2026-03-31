import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import GradientButton from '@/components/GradientButton';
import Icon from '@/components/Icon';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

	const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();
    const router = useRouter();

    const { styles } = useStyle();
    const { mbData, token, login, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});


    const submitFunc = () => {
        login({ token });
    }

    return (
        <Layout >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.root}
            >
                <View style={{ gap: 21 }}>
                    <Text style={styles.title}>{`프로필 등록이 완료되었습니다.`}</Text>
                    <Text style={styles.subTitle}>{`원하는 이성을 찾으러 가봐요!`}</Text>
                </View>

                <View style={styles.bottom}>
                    <Image source={images.profile_success} style={[rootStyle.profile_success, { width: '100%', maxHeight: 280 }]} />
                </View>
                <Button style={styles.button} textStyle={{ fontSize: 16 }}onPress={submitFunc}>시작하기</Button>
            </ScrollView>
           
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
            paddingTop: insets?.top + 120,
            paddingHorizontal: rootStyle.side,
            justifyContent: 'space-between',
            gap: 60
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
            textAlign: 'center',
            fontSize: 24,
            lineHeight: 36,
            fontFamily: fonts.bold,
            color: colors.black,
            letterSpacing: -0.7
        },
        subTitle: {
            textAlign: 'center',
            fontSize: 16,
            lineHeight: 22,
            color: colors.grey6,
            letterSpacing: -0.4,
            fontFamily: fonts.medium
        },
        bottom: {
            flex: 1,
            alignItems: 'center',
        },
        button: {
        },
        skipButton: {
            paddingVertical: 20
        },
        skip: {
            fontSize: 16,
            color: colors.grey6,
            fontFamily: fonts.medium,
            textDecorationLine: 'underline',
            textDecorationColor: colors.grey6,
        }
	})

  	return { styles }
}