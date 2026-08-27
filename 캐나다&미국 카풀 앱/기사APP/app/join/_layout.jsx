import { useEffect } from 'react';
import { Text } from 'react-native';

import { Redirect, Stack, router, Slot, usePathname } from "expo-router";

import Layout from '@/components/Layout';

import { useUser, useAlert, useSignData, useDriverData } from '@/libs/store';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import { useBackHandler } from '@/libs/utils';

export default function RootLayout() {

	const pathname = usePathname();

	const { openAlertFunc } = useAlert();
    const { setSignData } = useSignData();
	const { setDriverData } = useDriverData();

	useBackHandler(() => {
		closeFunc();
		return true;
	});

	const closeFunc = () => {
		if(pathname === `/${routes.joinSuccess}`) {
			setSignData('init');
			setDriverData('init');
			router.dismissAll();
			// router.canGoBack() && router.back();
		} else {
			openAlertFunc({
				alertType: 'Sheet',
				title: lang({ id: 'go_back_beginning' }),
				onCencleText: lang({ id: 'cancel' }),
				onPressText: lang({ id: 'yes' }),
				onCencle: () => { },
				onPress: () => {
					setSignData('init');
					setDriverData('init');
					router.dismissAll();
					// router.canGoBack() && router.back();
				}
			})
		}
		
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
