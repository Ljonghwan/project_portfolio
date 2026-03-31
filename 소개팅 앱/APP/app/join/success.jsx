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
    const { mbData, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useBackHandler(() => {
        skipFunc();
        return true;
    });

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const skipFunc = () => {
        openAlertFunc({
            icon: images.warning,
            iconStyle: {
                width: 36,
                height: 36,
            },
            label: '프로필 등록을 취소하시겠어요?',
            title: `서비스 이용을 위해 프로필 등록이 필요합니다.\n다음에 다시 등록하시겠습니까?`,
            onCencleText: "계속 할게요",
            onPressText: "로그아웃",
            onCencle: () => {},
            onPress: () => {
                logout();
            }
        })
    }
    const submitFunc = () => {
        router.canDismiss() && router.dismissAll();
        router.replace(routes.joinProfile);
    }

    return (
        <Layout statusBar={'dark'} >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.root}
            >
                <View style={{ gap: 21 }}>
                    <Text style={styles.title}>{`${mbData?.name} 님,\n가입을 축하합니다.`}</Text>
                    <Text style={styles.subTitle}>{`프로필을 작성하고\n원하는 이성을 찾으러 가봐요!`}</Text>
                </View>

                <View style={styles.bottom}>
                    <Image source={images.join_success} style={[rootStyle.join_success, { width: '100%', maxHeight: 300 }]} />
                </View>
                <View style={{ paddingHorizontal: 35, alignItems: 'center' }}>
                    <Button type={3} style={styles.button} onPress={submitFunc}>프로필 등록하러 가기</Button>

                    <TouchableOpacity style={styles.skipButton} onPress={skipFunc}>
                        <Text style={styles.skip}>나중에 할게요</Text>
                    </TouchableOpacity>
                </View>

                {/* <View style={{ gap: 40 }}>
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

                        <Text style={styles.title}>{`${mbData?.name} 님,\n가입을 축하합니다1!`}</Text>
                        <Text style={styles.subTitle}>{`사소한에서 새로운 만남을\n시작하세요.`}</Text>
                    </View>
                    <GradientButton onPress={submitFunc}>좋아요!</GradientButton>
                </View> */}
            </ScrollView>
           
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
            paddingTop: insets?.top + 60,
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
            fontSize: 28,
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