import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
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

import { ToastMessage, hpHypenRemove, hpHypen } from '@/libs/utils';
import consts from '@/libs/consts';
import dayjs from 'dayjs';

export default function Login() {

	const { styles } = useStyle();

	const insets = useSafeAreaInsets();

	const { type, name, account, createdAt } = useLocalSearchParams();

	const router = useRouter();
	const { pushToken, login } = useUser();


	const header = {
		right: {
			icon: 'exit',
			onPress: () => router.back()
		},
		title: '비밀번호 재설정'
	};

	return (
		<Layout header={header}>
			<View style={{ flex: 1, paddingBottom: insets?.bottom + 100, paddingHorizontal: 24, gap: 20, justifyContent: 'center', alignItems: 'center' }}>
				<Image source={images.success} style={rootStyle.default48} />
				<View style={{ gap: 4 }}> 
					<Text style={{ ...rootStyle.font(18, colors.black, fonts.semiBold), lineHeight: 25, textAlign: 'center' }}>비밀번호가 새롭게 변경되었어요</Text>
					<Text style={{ ...rootStyle.font(14, colors.text7F8287), lineHeight: 20, textAlign: 'center' }}>{`안전한 정보보호를 위해 주기적으로\n비밀번호를 변경해 주세요.`}</Text>
				</View>
			</View>
			<Button bottom onPress={() => router.back()}>로그인</Button>
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

