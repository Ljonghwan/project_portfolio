import { useEffect } from 'react';
import { Stack, router, usePathname } from "expo-router";

import EarnBadge from '@/components/Popup/EarnBadge';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';

import { useActiveUserTracking, useNotificationObserver } from '@/libs/hooks';

import { useEtc, useUser, useStore, useConfig, useAlert } from '@/libs/store';
import { getDateStatus } from '@/libs/utils';

import API from '@/libs/api';


export default function Router({ initialRouteName }) {

	const pathname = usePathname();
	const { token, pushToken, mbData, reload } = useUser();
	const { reloadStore } = useStore();
	const { appActiveStatus } = useEtc();
	const { openAlertFunc } = useAlert();
	const { configOptions } = useConfig();

	useActiveUserTracking();
	useNotificationObserver();

	useEffect(() => {
		// if (initialRouteName === routes.tabs && mbData?.passenger && mbData?.level === 0) {
		// 	setTimeout(() => {
		// 		router.navigate(routes.joinDriver);
		// 	}, 500)
		// } // 유형선택 안한경우
	},[])

	useEffect(() => {
		if (token && appActiveStatus === 'active') {
			reload();
			reloadStore();
		}
	}, [pathname, token, appActiveStatus])

	

	return (
        <Stack initialRouteName={initialRouteName} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} >
            <Stack.Screen name="index" redirect />
			
			<Stack.Screen name={routes.tabs} />
			{/* <Stack.Screen name={routes.joinDriverStart} /> */}

			{/* <Stack.Screen name={routes.joinDriver} options={{ presentation: 'containedTransparentModal' }} /> */}
			<Stack.Screen name={routes.viewer} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.myClassInfo} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.myBadgeInfo} options={{ presentation: 'containedTransparentModal'}} />
			
			<Stack.Screen name={routes.매입품목검색} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.제품검색} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.근무형태검색} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.일용노무검색} options={{ presentation: 'containedTransparentModal'}} />
			<Stack.Screen name={routes.계약서보기} options={{ presentation: 'containedTransparentModal'}} />
			
			{/* <Stack.Screen name={routes.login} options={{ presentation: 'containedTransparentModal'}} /> */}

			{/* <Stack.Screen name={routes.emergencyView} initialParams={{ presentation: 'modal' }} options={{ presentation: 'modal' }} /> */}
			<Stack.Screen name={routes.terms} initialParams={{ presentation: 'modal' }} options={{ presentation: 'modal' }} />
        </Stack>

	)
}


