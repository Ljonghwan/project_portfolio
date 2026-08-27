import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';	
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();

	const router = useRouter();
	const { pushToken, login } = useUser();
	const { setSignDataStart } = useSignData();

	const passwordInputRef = useRef(null);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

    const [ load, setLoad ] = useState(false);
	const [ disabled, setDisabled ] = useState(true);

	useEffect(() => {
		setDisabled(!(email?.length >= 4 && password?.length >= 8));
	}, [email, password])

	const handleLogin = async () => {
		// router.push(routes.certHometax);
		Keyboard.dismiss();
		setLoad(true);

		const sender = {
			type: 'account',
			account: email,
			pass: password,
			deviceToken: pushToken,
			deviceInfo: Platform.OS === 'ios' ? `${Device.modelName} ${Device.osName} ${Device.osVersion}` : `${Device.deviceName} Android ${Device.osVersion}`
		}

		const { data, error } = await API.post('/v1/auth/login', sender);

		setTimeout(() => {
			setLoad(false);
			if (error) {
				ToastMessage(error?.message);
				return;
			}

			login({ token: data });
		}, consts.apiDelay)
	};

	const handleFindId = () => {
		console.log('아이디 찾기');
		router.push(routes.findId);
	};

	const handleResetPassword = () => {
		console.log('비밀번호 재설정');
		router.push(routes.findPw);
	};

	const handleSignUp = () => {

		console.log('회원가입');
		setSignDataStart();

		router.push(routes.agree);
	};

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: '로그인'
	};

	return (
		<Layout header={header}>
			<View style={{ flex: 1 }}>
				<KeyboardAwareScrollView
					decelerationRate={'normal'}
					bottomOffset={200}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps={"handled"}
					disableScrollOnKeyboardHide={Platform.OS === 'ios'}
					style={{ flex: 1 }}
				>
					<View style={styles.container}>
						{/* 로고 및 타이틀 영역 */}
						{/* <View style={styles.headerSection}>
							<Image source={images.logo} style={styles.logo} contentFit="contain" />
							<View style={styles.titleContainer}>
								<Text style={styles.title}>
									어서오세요, 사장님!{'\n'}지금 바로 매장 관리 시작해볼까요?
								</Text>
								<Text style={styles.subtitle}>
									오늘도 오너톡이 사장님의 하루를 도와드릴게요.
								</Text>
							</View>
						</View> */}

						{/* 입력 영역 */}
						<View style={styles.formSection}>
							<TextInput
								placeholder="아이디"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								returnKeyType="next"
								onSubmitEditing={() => passwordInputRef.current?.focus()}
								blurOnSubmit={false}
								inputContainerStyle={{ height: 56 }}
							/>

							<TextInput
								iref={passwordInputRef}
								placeholder="비밀번호"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								returnKeyType="done"
								onSubmitEditing={handleLogin}
								inputContainerStyle={{ height: 56 }}
							/>

							{/* 링크 영역 */}
							<View style={styles.linkContainer}>
								<TouchableOpacity onPress={handleFindId} style={styles.linkButton}>
									<Text style={styles.linkText}>아이디 찾기</Text>
								</TouchableOpacity>

								<View style={styles.divider} />

								<TouchableOpacity onPress={handleResetPassword} style={styles.linkButton}>
									<Text style={styles.linkText}>비밀번호 재설정</Text>
								</TouchableOpacity>

								{/* <View style={styles.divider} />

								<TouchableOpacity onPress={handleSignUp} style={styles.linkButton}>
									<Text style={styles.linkText}>회원가입</Text>
								</TouchableOpacity> */}
							</View>
						</View>

						{/* 로그인 버튼 */}
						<View style={styles.buttonContainer}>
							<Button
								load={load}
								onPress={handleLogin}
								containerStyle={styles.loginButton}
								disabled={disabled}
							>
								로그인
							</Button>
							<Button
								type={8}
								onPress={handleSignUp}
								containerStyle={styles.loginButton}
								textStyle={{ fontSize: 16 }}
							>
								회원가입
							</Button>
						</View>
					</View>
				</KeyboardAwareScrollView>
			</View>
		</Layout>
	);
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		container: {
			flex: 1,
			backgroundColor: colors.white,
			paddingHorizontal: rootStyle.side,
			justifyContent: 'flex-start',
			paddingTop: 20,
			paddingBottom: 20
		},
		scrollContent: {
			flexGrow: 1,
			paddingHorizontal: 30,
			paddingTop: 70,
			paddingBottom: 30,
		},
		headerSection: {
			gap: 20,
			marginBottom: 32,
		},
		logo: {
			width: 88,
			height: 77,
		},
		titleContainer: {
			gap: 14,
		},
		title: {
			fontFamily: fonts.semiBold,
			fontSize: 24,
			lineHeight: 34,
			letterSpacing: -0.6,
			color: colors.textPrimary,
		},
		subtitle: {
			fontFamily: fonts.regular,
			fontSize: 16,
			lineHeight: 24,
			letterSpacing: -0.4,
			color: colors.textSecondary,
		},
		formSection: {
			width: '100%',
			gap: 10,
			marginBottom: 32,
		},
		linkContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: 0,
		},
		linkButton: {
			paddingHorizontal: 10,
			paddingVertical: 10,
		},
		linkText: {
			fontFamily: fonts.regular,
			fontSize: 14,
			lineHeight: 20,
			letterSpacing: -0.35,
			color: colors.textSecondary,
		},
		divider: {
			width: 1,
			height: 12,
			backgroundColor: colors.border,
		},
		buttonContainer: {
			gap: 10
		},
		loginButton: {
			height: 56,
			borderRadius: 8,
		},

	});

	return { styles }
}

