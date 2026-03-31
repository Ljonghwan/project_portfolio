import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Keyboard } from 'react-native';

import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';

/******************************* */

import Text from '@/components/Text';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

/******************************* */

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import { ToastMessage, regId, regPassword } from '@/libs/utils';
import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {

	const router = useRouter();

	const { styles } = useStyle();

	const idRef = useRef(null);
	const passwordRef = useRef(null);
	const confirmPasswordRef = useRef(null);

	const { login, pushToken } = useUser();
	const { id, type, name, hp, birth, gender, level, email, nickname,  setSignData } = useSignData();
	
	/******************************* */

	const [userId, setUserId] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		// 아이디: 4~20자
		// 비밀번호: 8자 이상
		// 비밀번호 확인: 비밀번호와 일치
		// const isUserIdValid = regId.test(userId);
		const isPasswordValid = regPassword.test(password);
		const isConfirmPasswordValid = regPassword.test(confirmPassword) && password === confirmPassword;

		setDisabled(!(isPasswordValid && isConfirmPasswordValid));
	}, [password, confirmPassword])

	const handleNext = async () => {

		Keyboard.dismiss();
		
		if (load || disabled) return;

		setLoad(true);

		const sender = {
			socialId: id,
			type: type,
			name: name,
			hp: hp,
			birth: birth,
			gender: gender,
			email: email,
			nickname: nickname,
			pass: password,
			pass2: confirmPassword,
			deviceToken: pushToken,
        }

        const { data, error } = await API.post('/v1/auth/register', sender);


		setTimeout(() => {

			setLoad(false);

			if (error) {
				ToastMessage(error?.message);
				return;
			}

			login({ token: data, callback: () => {
				router.replace(routes.joinSuccess);
			} });

		}, consts.apiDelay)
		
	};

	return (
		<View style={styles.container}>
			<KeyboardAwareScrollView
				decelerationRate={'normal'}
				bottomOffset={200}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps={"handled"}
				disableScrollOnKeyboardHide={Platform.OS === 'ios'}
				style={{ flex: 1 }}
			>
				<View style={styles.root}>

					{/* 타이틀 */}
					<View style={styles.titleContainer}>
						<Text style={styles.title}>
							사장님의 소중한 정보를{'\n'}안전하게 보호해 드릴게요.
						</Text>
						<Text style={styles.subtitle}>
							주변 사장님들과 교류하고,{'\n'}매장 관리를 더 편하게 시작해 보세요.
						</Text>
					</View>

					{/* 입력 필드들 */}
					<View style={styles.formContainer}>

						{/* 아이디 */}
						{/* <View style={styles.fieldContainer}>
							<Text style={styles.label}>아이디</Text>
							<TextInput
								// autoFocus
								iref={idRef}
								value={userId}
								onChangeText={setUserId}
								placeholder="4~20자 이내 영문/숫자"
								maxLength={20}
								returnKeyType="next"
								blurOnSubmit={false}
								onSubmitEditing={() => passwordRef.current?.focus()}
							/>
						</View> */}

						{/* 비밀번호 */}
						<View style={styles.fieldContainer}>
							<Text style={styles.label}>비밀번호</Text>
							<TextInput
								autoFocus
								iref={passwordRef}
								value={password}
								onChangeText={setPassword}
								placeholder="8자 이상 영문/숫자/특수문자 조합"
								secureTextEntry
								returnKeyType="next"
								blurOnSubmit={false}
								onSubmitEditing={() => confirmPasswordRef.current?.focus()}
								maxLength={30}
							/>
						</View>

						{/* 비밀번호 확인 */}
						<View style={styles.fieldContainer}>
							<Text style={styles.label}>비밀번호 확인</Text>
							<TextInput
								iref={confirmPasswordRef}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								placeholder="비밀번호 재입력"
								secureTextEntry
								returnKeyType="done"
								onSubmitEditing={handleNext}
								maxLength={30}
							/>
							
						</View>

					</View>

				</View>



			</KeyboardAwareScrollView>
			<View style={styles.bottomContainer}>
				<Button bottom disabled={disabled} onPress={handleNext}>회원가입</Button>
			</View>
		</View>
	)
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.white,
		},
		contentContainer: {
			flexGrow: 1,
		},

		root: {
			flex: 1,
			paddingHorizontal: rootStyle.side,
			paddingTop: 30,
            paddingBottom: 100 + insets?.bottom,
		},

		titleContainer: {
			marginBottom: 30,
			gap: 8,
		},

		title: {
			fontSize: 24,
			fontFamily: fonts.semiBold,
			color: colors.textPrimary,
			lineHeight: 34,
			letterSpacing: -0.6,
		},

		subtitle: {
			fontSize: 16,
			fontFamily: fonts.regular,
			color: colors.textSecondary,
			lineHeight: 24,
			letterSpacing: -0.4,
		},

		formContainer: {
			gap: 20,
		},

		fieldContainer: {
			gap: 8,
		},

		label: {
			fontSize: 14,
			fontFamily: fonts.medium,
			color: colors.textTertiary,
			lineHeight: 20,
			letterSpacing: -0.35,
		},

		inputWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.white,
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: 8,
			paddingHorizontal: 16,
			paddingVertical: 12,
		},

		input: {
			flex: 1,
			fontSize: 16,
			fontFamily: fonts.regular,
			color: colors.textPrimary,
			lineHeight: 24,
			letterSpacing: -0.4,
			padding: 0,
		},

		eyeButton: {
			marginLeft: 10,
			padding: 4,
		},

		eyeIcon: {
			width: 20,
			height: 20,
		},

		bottomContainer: {

		},
	})

	return { styles }
}
