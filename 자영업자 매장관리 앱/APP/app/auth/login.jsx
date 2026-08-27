import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { ImageBackground } from 'expo-image';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { login as loginKakao, me, unlink, isLogined } from '@react-native-kakao/user';
import { jwtDecode } from 'jwt-decode';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';

import TooltipBubble from '@/components/Ui/TooltipBubble';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData, useConfig } from '@/libs/store';

import { ToastMessage, hpContryCodeRemove } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const router = useRouter();
	const { pushToken, login } = useUser();
	const { setSignData, setSignDataStart } = useSignData();
	const { configOptions } = useConfig();
	const { openLoader, closeLoader } = useLoader();

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		GoogleSignin.configure();
	}, []);

	const snsLogin = (type) => {

        setSignData('init');

        if(type === 'kakao') {
            signInWithKakao();
        } else if(type === 'google') {
            signInWithGoogle()
        } else if(type === 'apple') {
            signInWithApple()
        } else {
            
        }
    }



    const snsLoginFunc = async (sns) => {

        const sender = {
            type: sns?.type,
            socialId: sns?.id,
            deviceToken: pushToken
        }
        console.log('snsLoginFunc', sender);

        const { data, error } = await API.post('/v1/auth/login', sender);
		console.red('data1', data, error);

        if(data) {
            login({ token: data });
            return;
        }

        // SNS 가입 이력이없고 회원가입 가능한경우
        if(error?.code === 1004) {
			if(sns?.type === 'kakao') {
				registerWithKakao(sns);
			} else {
				setSignDataStart({
					id: sns?.id,
					type: sns?.type,
					typeText: sns?.typeText,
					email: sns?.email
				})
	
				router.push(routes.agree);
			}
			return;
		}
		
		ToastMessage(error?.message);
    }


	const registerWithKakao = async (sns) => {
		console.red('registerWithKakao', sns);

		openLoader();

		const sender = {
			socialId: sns?.id,
			type: sns?.type,
			name: sns?.name,
			hp: hpContryCodeRemove(sns?.phoneNumber),
			birth: sns?.birthyear + sns?.birthday,
			gender: sns?.gender === 'male' ? 1 : 2,
			email: sns?.email,
			deviceToken: pushToken,
        }

		console.red('sender', sender);

        const { data, error } = await API.post('/v1/auth/register', sender);

		console.red('data', data, error);
		
		setTimeout(() => {
			closeLoader();

			setTimeout(() => {
				if (error) {
					ToastMessage(error?.message);
					return;
				}
	
				login({ token: data });
			}, consts.apiDelay)

		}, consts.apiDelay)

		

	}



    const signInWithKakao = async () => {

		try {
			const data = await loginKakao();

			if(!data) {
				throw new Error('인증실패');
			}
			
			const user = await me();
			
			if(!user) {
                throw new Error('인증실패');
            }

			snsLoginFunc({
				...user,
				type: 'kakao',
				typeText: '카카오',
			})

		} catch (error) {
			console.log('error', error);
			ToastMessage("요청에 실패하였습니다.");
		}

		

    };

	const signInWithApple = async () => {

		if(Platform.OS !== 'ios') return;

		try {
			const { identityToken } = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.EMAIL
				],
			});

			if(!identityToken ) {
				throw('인증실패');
			}

			const { email, sub } = jwtDecode(identityToken);
			
			if(!email || !sub) {
				throw('인증실패');
			}

			snsLoginFunc({
				id: sub,
				type: 'apple',
				typeText: '애플',
				email: email
			})


		} catch (e) {
			if (e?.code !== 'ERR_REQUEST_CANCELED' && e?.code !== 'ERR_REQUEST_UNKNOWN') {
				ToastMessage("요청에 실패하였습니다.");
			} 
		}

    }

	const signInWithGoogle = async () => {

		if(Platform.OS !== 'android') return;

        try {
            await GoogleSignin.hasPlayServices();
            const { data, type } = await GoogleSignin.signIn();

            if(!data && type !== "success") {
                throw({ type });
            }

            snsLoginFunc({
                id: data?.user?.id,
                type: 'google',
                typeText: '구글',
                email: data?.user?.email
            })

        } catch (err) {
            if(err?.type !== 'cancelled') {
                ToastMessage("요청에 실패하였습니다.");
            }
        } finally {
            await GoogleSignin.signOut();
        }
    }


	return (
		<Layout >
			<ImageBackground source={images.login_bg} style={{ flex: 1, paddingTop: insets?.top + 90, backgroundColor: colors.white }} contentFit='cover'>
				
				{/* <TouchableOpacity style={styles.back} hitSlop={20} onPress={() => {
					router.back();
				}}>
					<Image source={images.back_white} style={rootStyle.default} />
				</TouchableOpacity> */}

				<View style={styles.container}>
					{/* 로고 및 타이틀 영역 */}
					<View style={styles.headerSection}>
						<Image source={images.logo_white} style={styles.logo} contentFit="contain" />

						<View style={styles.titleContainer}>
							<Text style={styles.title}>
								어서오세요, 사장님!{'\n'}지금 바로 매장 관리 시작해볼까요?
							</Text>
							<Text style={styles.subtitle}>
								오늘도 오너톡이 사장님의 하루를 도와드릴게요.
							</Text>
						</View>
					</View>

					<View style={[rootStyle.flex, { gap: 20, }]}>

						<TouchableOpacity style={styles.loginButton} onPress={() => {
							// Alert.alert('준비중입니다.');
							snsLogin('kakao');
						}}>
							<Image source={images.login_kakao} style={styles.loginButtonIcon} />
							<TooltipBubble text="3초만에 시작하기" style={{ position: 'absolute', top: -60, width: 200, alignSelf: 'center' }} />
						</TouchableOpacity>

						{Platform.OS === 'ios' && (
							<TouchableOpacity style={styles.loginButton} onPress={() => {
								// Alert.alert('준비중입니다.');
								snsLogin('apple');
							}}>
								<Image source={images.login_apple} style={styles.loginButtonIcon} />
							</TouchableOpacity>
						)}

						{Platform.OS === 'android' && (
							<TouchableOpacity style={styles.loginButton} onPress={() => {
								// Alert.alert('준비중입니다.');
								snsLogin('google');
							}}>
								<Image source={images.login_google} style={styles.loginButtonIcon} />
							</TouchableOpacity>
						)}

						<TouchableOpacity style={styles.loginButton} onPress={() => {
							router.push(routes.loginEmail);
						}}>
							<Image source={images.login_email} style={styles.loginButtonIcon} />
						</TouchableOpacity>
					</View>

				</View>
			</ImageBackground>
		</Layout>
	);
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		back: {
			paddingLeft: rootStyle.side,
			marginBottom: 40,
			height: rootStyle?.header?.height,
			justifyContent: 'center',
			alignSelf: 'flex-start',
		},
		container: {
			flex: 1,
			paddingHorizontal: rootStyle.side,
			gap: 185
		},

		logo: {
			width: 60,
			aspectRatio: 1
		},
		titleContainer: {
			gap: 14,
		},
		title: {
			fontFamily: fonts.semiBold,
			fontSize: 24,
			lineHeight: 34,
			letterSpacing: -0.6,
			color: colors.white,
		},
		subtitle: {
			fontFamily: fonts.regular,
			fontSize: 16,
			lineHeight: 24,
			letterSpacing: -0.4,
			color: colors.textD5D5D5,
		},

		loginButton: {
			width: 65,
			aspectRatio: 1,
			borderRadius: 1000
		},
		loginButtonIcon: {
			width: '100%',
			height: '100%'
		}

	});

	return { styles }
}

