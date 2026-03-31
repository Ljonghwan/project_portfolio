import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, hpHypen, hpHypenRemove } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();

	const { input, hp, type, token } = useLocalSearchParams();

	const router = useRouter();
	const { pushToken, login } = useUser();

	const iref = useRef();

	const [certToken, setCertToken] = useState(token);

	const [code, setCode] = useState('');

	const [timer, setTimer] = useState(true);


	const [load, setLoad] = useState(false);
	const [sendLoad, setSendLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(code?.length > 5 && timer));
	}, [code, timer])

	const handleNext = async () => {

		Keyboard.dismiss();
		setLoad(true);

		const sender = {
			input: input,
			token: certToken,
			// token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZHgiOjQyLCJpYXQiOjE3NjM2MjE4MDcsImV4cCI6MTc2MzYyMTgxMn0.vtFJBqBiWxiv8s6wmToFVQspnSDQBBHpaf6vGgiLcNw',
			code: code
		}

		const { data, error } = await API.post('/v1/auth/findVerification', sender);
		console.log('data, error', data, error);
		setLoad(false);

		if (error) {
			ToastMessage(error?.message);
			return;
		}

		if (!data) {
			router.replace({
				pathname: routes.findNotFound,
				params: {
					type: type
				}
			});
		} else if(data?.findType === 'id'){
			router.replace({
				pathname: routes.findIdResult,
				params: {
					type: data?.type,
					name: data?.name,
					account: data?.account,
					createdAt: data?.createdAt
				}
			})
			
		} else if(data?.findType === 'password'){
			
			router.replace({
				pathname: routes.findResetPw,
				params: {
					token: data?.token,
				}
			})
		}

	}

	const timeOut = () => {

		console.log("타임 아웃입니다");
		ToastMessage("인증시간이 초과되었습니다");
		setTimer(false);
	}

	const reSend = async () => {

		if (sendLoad) return;

		console.log("재전송 입니다.");
		setSendLoad(true);
		setTimer(false);

		const sender = {
			type: type,
			name: input,
			account: input,
			hp: hpHypenRemove(hp)
		}

		console.log('sender', sender);
		const { data, error } = await API.post('/v1/auth/find', sender);
		console.log('load Test!!!!!!!!', data, error);

		setTimeout(() => {
			setSendLoad(false);

			if (error) {
				ToastMessage(error?.message);
				return;
			}

			setCertToken(data);
			setTimer(true);
			setCode("");

			setTimeout(() => {
				iref?.current?.focus();
			}, 200)


		}, consts.apiDelay)

	}

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: '휴대폰 인증'
	};

	return (
		<Layout header={header}>
			<Pressable style={{ flex: 1, paddingTop: 24, paddingHorizontal: 24, gap: 30 }} onPress={() => {
				Keyboard.dismiss();
			}}>
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>인증코드를 입력해주세요.</Text>

				<View style={{ gap: 15 }}>
					<TextInput
						placeholder="휴대폰번호 입력"
						displayValue={hpHypen(hpHypenRemove(hp))}
						maxLength={13}
						editable={false}
					/>
					<TextInput
						autoFocus
						iref={iref}
						placeholder="인증코드 입력"
						keyboardType={'number-pad'}
						value={code}
						onChangeText={setCode}
						maxLength={6}
						timer={timer}
						timerState={timeOut}
						editable={timer}
					/>
					<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
						<Text style={{ ...rootStyle.font(12, colors.text757575) }}>인증문자가 오지 않나요?</Text>

						<TouchableOpacity onPress={reSend} style={{ height: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 1000, backgroundColor: colors.f2f2f2 }}>
							<Text style={{ ...rootStyle.font(12, colors.text2B2B2B) }}>인증코드 재전송</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Pressable>
			<Button bottom disabled={disabled} load={load} onPress={handleNext}>확인</Button>
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
			paddingTop: insets?.top,
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
		},
		loginButton: {
			height: 56,
			borderRadius: 8,
		},

	});

	return { styles }
}

