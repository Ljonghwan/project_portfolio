import { useEffect } from 'react';
import { Text } from 'react-native';

import { Redirect, Stack, router, Slot, usePathname } from "expo-router";

import Layout from '@/components/Layout';

import { useUser, useAlert, useDriverData } from '@/libs/store';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import { useBackHandler } from '@/libs/utils';

export default function RootLayout() {

	const pathname = usePathname();

	const { openAlertFunc } = useAlert();
	const { setDriverData } = useDriverData();
	const { mbData } = useUser();

	const closeFunc = () => {
		if (pathname === routes.joinDriverSuccess) {
			setDriverData('init');
			router.dismissAll();
			router.canGoBack() && router.back();
		} else {
			router.canGoBack() && router.back();
		}
	}

	const header = {
		left: (mbData?.level !== 0) ? {
			icon: 'back',
			onPress: closeFunc
		} : {},
		title: pathname === `/${routes.joinDriverLicenseList}` ? lang({ id: 'driving_license_regu' }) : null,
		longTitle: true
	};

	return (
		<Layout header={header} backgroundColor={colors.white} >
			<Stack initialRouteName="start" screenOptions={{ headerShown: false }} >
				<Stack.Screen name="index" redirect />
			</Stack>
		</Layout>
	)
}
