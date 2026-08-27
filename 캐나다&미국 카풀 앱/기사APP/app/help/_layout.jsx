import { useEffect } from 'react';

import { Redirect, Stack, router, Slot } from "expo-router";

import Layout from '@/components/Layout';

import colors from '@/libs/colors';
import lang from '@/libs/lang';

import { useUser, useAlert, useSignData } from '@/libs/store';

export default function RootLayout() {

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: lang({ id: 'help' })
	};

	return (
		<Layout header={header} backgroundColor={colors.white} statusBar={'dark'}  >
			<Stack screenOptions={{ headerShown: false }} />
		</Layout>
	)
}
