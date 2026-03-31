import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, regName } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();

	const router = useRouter();
	const { pushToken, login } = useUser();

	const iref = useRef();

	const [input, setInput] = useState('');

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(regName.test(input)));
	}, [input])

	const handleNext = () => {
		router.replace({
			pathname: routes.findSend,
			params: {
				input: input,
				type: 'id'
			}
		})
	}

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: '아이디 찾기'
	};

	return (
		<Layout header={header}>
			<Pressable 
				style={{ flex: 1, paddingTop: 24, paddingHorizontal: 24, gap: 30 }}
				onPress={() => {
					Keyboard.dismiss();
				}}
			>
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>성함을 입력해주세요.</Text>
				<TextInput
					iref={iref}
					autoFocus
					placeholder="이름 입력"
					value={input}
					onChangeText={setInput}
					maxLength={20}
				/>
			</Pressable>
			<Button bottom disabled={disabled} load={load} onPress={handleNext}>다음</Button>
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

