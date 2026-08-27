import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';

import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

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
import { ToastMessage, regNick } from '@/libs/utils';
import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {

	const router = useRouter();

	const { styles } = useStyle();

	const inputRef = useRef(null);

	const { login, pushToken } = useUser();
	const { id, type, name, hp, birth, gender, level, email,  setSignData } = useSignData();

	/******************************* */

	const [nickname, setNickname] = useState('');

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		// 닉네임이 1자 이상 10자 이하일 때 버튼 활성화
		const isValid = regNick.test(nickname);
		console.log('isValid', isValid);
		setDisabled(!isValid);
	}, [nickname])


	const handleNext = async () => {
		Keyboard.dismiss();

		if (load || disabled) return;

		setLoad(true);

		const sender = {
			nickname: nickname,
		}

		const { data, error } = await API.post('/v1/auth/checkNickname', sender);
		console.log('data', data, error);

		if (error) {
			ToastMessage(error?.message);
			setLoad(false);
			return;
		}

		setSignData({ key: 'nickname', value: nickname });

		// 다음 페이지로 이동
		if(type === 'account') {
			setLoad(false);
			router.replace(routes.joinEmail);
		} else {

			const sender = {
				socialId: id,
				type: type,
				name: name,
				hp: hp,
				birth: birth,
				gender: gender,
				email: email,
				nickname: nickname,
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
		}

		
	};

	return (
		<View style={ styles.container }>
			<KeyboardAwareScrollView
				contentContainerStyle={{ flex: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.root}>

					{/* 타이틀 */}
					<View style={styles.titleContainer}>
						<Text style={styles.title}>
							오너톡에서 사용할{'\n'}닉네임을 입력해 주세요.
						</Text>
					</View>

					{/* 입력 필드 */}
					<View style={styles.inputContainer}>
						<TextInput
							iref={inputRef}
							autoFocus
							value={nickname}
							onChangeText={setNickname}
							placeholder="닉네임을 입력해주세요."
							maxLength={10}
							// autoFocus={true}
							returnKeyType="next"
							onSubmitEditing={handleNext}
						/>

						<Text style={styles.counter}>
							<Text style={styles.counterCurrent}>{nickname.length}</Text>/10
						</Text>
					</View>

				</View>
			</KeyboardAwareScrollView>

			{/* 하단 버튼 */}
			<View style={styles.bottomContainer}>
				<Button bottom disabled={disabled} load={load} onPress={handleNext}>다음</Button>
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
		},

		titleContainer: {
			marginBottom: 30,
		},

		title: {
			fontSize: 24,
			fontFamily: fonts.semiBold,
			color: colors.textPrimary,
			lineHeight: 34,
			letterSpacing: -0.6,
		},

		inputContainer: {
			gap: 8,
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

		clearButton: {
			marginLeft: 10,
		},

		clearIcon: {
			width: 20,
			height: 20,
			borderRadius: 10,
			backgroundColor: colors.textSecondary,
			alignItems: 'center',
			justifyContent: 'center',
		},

		clearIconText: {
			color: colors.white,
			fontSize: 16,
			fontFamily: fonts.regular,
			lineHeight: 16,
		},

		counter: {
			fontSize: 14,
			fontFamily: fonts.regular,
			color: colors.textSecondary,
			lineHeight: 20,
			letterSpacing: -0.35,
			textAlign: 'right',
		},

		counterCurrent: {
			color: colors.primaryBright,
		},

		bottomContainer: {
		},
	})

	return { styles }
}
