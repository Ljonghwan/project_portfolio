import { useEffect } from 'react';
import { Text } from 'react-native';

import { Redirect, Stack, router, Slot } from "expo-router";

import Layout from '@/components/Layout';

import { useUser, useAlert, useSignData } from '@/libs/store';

import colors from '@/libs/colors';
import { useBackHandler } from '@/libs/utils';
import lang from '@/libs/lang';

export default function RootLayout() {

	const { openAlertFunc } = useAlert();
    const { setSignData } = useSignData();

	useBackHandler(() => {
		closeFunc();
		return true;
	});

	const closeFunc = () => {
		openAlertFunc({
			alertType: 'Sheet',
			title: 'Go back to the beginning?',
			onCencleText: lang({ id: 'cancel' }),
			onPressText: lang({ id: 'yes' }),
			onCencle: () => { },
			onPress: () => {
				setSignData('init');
				router.dismissAll();
				// router.canGoBack() && router.back();
			}
		})
	}

	const header = {
		left: {
			icon: 'back',
			onPress: closeFunc
		},
	};

	return (
		<Layout header={header} backgroundColor={colors.white} statusBar={'dark'}  >
			<Stack screenOptions={{ headerShown: false }} />
		</Layout>
	)
}
