import { useEffect } from 'react';
import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';
import { Stack, router, usePathname } from "expo-router";

import routes from '@/libs/routes';
import API from '@/libs/api';

import { useUser, useGps, useEtc } from '@/libs/store';

function useNotificationObserver() {
	useEffect(() => {
		let isMounted = true;

		function redirect(notification) {
			
			// 안드로이드 푸시 내용
			/** 
			 * 앱 종료 일시 (notification 2)
			 * notification?.route 
			 * Background 일시 (notification 1)
			 * notification?.notification?.data?.route 
			 * Foreground 일시 (notification 1)
			 * notification?.notification?.data?.route 
			 * 
			 * 전화 올때 관련
			 * 앱 종료 일시 안들어옴
			 * 
			 * Background 일시 (notification 1)
			 * notification?.notifee_event_type
			 * notification?.notification?.data?.callId
			 * 
			 * Foreground 일시 (notification 1)
			 * notification?.notifee_event_type
			 * notification?.notification?.data?.callId
			 * 
			 * 전화중 관련
			 * 앱 종료 일시 안들어옴
			 * 
			 * Background 일시 (notification 1)
			 * notification?.notifee_event_type
			 * notification?.notification?.data?.callId
			 * 
			 * Foreground 일시 (notification 1)
			 * notification?.notifee_event_type
			 * notification?.notification?.data?.callId
			 * */ 

			if (routes?.[notification?.route]) {
				console.log('expo notification 페이지 이동 ! ', routes?.[notification?.route]);
                Notifications.clearLastNotificationResponseAsync();
				router.canDismiss() && router.dismissAll();
                
				router.navigate({
					pathname: routes?.[notification?.route],
					params: notification
				});
			}
		}

		Notifications.getLastNotificationResponseAsync()
			.then(response => {
				if (!isMounted || !response?.notification) {
					return;
				}
				redirect(response?.notification?.request?.content?.data);
			});

		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			
			let result = Platform.select({
				android: response?.notification?.request?.content?.data,
				ios: response.notification?.request?.trigger?.payload || response?.notification?.request?.content?.data
			});

			redirect(result);
		});

		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);
}

export default function Router({ initialRouteName }) {

    useNotificationObserver();

	const pathname = usePathname();
	const { token, mbData, reload } = useUser();
	const { lat, lng, accuracy } = useGps();
	const { appActiveStatus } = useEtc();

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
		}
	}, [pathname, token, appActiveStatus])

	useEffect(() => {
		
		if (token && lat && lng) {
			sendGps();
		}

	}, [token, lat, lng])

	const sendGps = async () => {
	
		// GPS 전송
		let sender = { lat, lng, accuracy };
		const { data, error } = await API.post('/v1/user/sendGps', sender);
	}
	
	return (
        <Stack initialRouteName={initialRouteName} screenOptions={{ headerShown: false }} >
            <Stack.Screen name="index" redirect />
			
			<Stack.Screen name={routes.tabs} />
			{/* <Stack.Screen name={routes.joinDriverStart} /> */}

			{/* <Stack.Screen name={routes.joinDriver} options={{ presentation: 'containedTransparentModal' }} /> */}
			<Stack.Screen name={routes.viewer} options={{ presentation: 'containedTransparentModal'}} />

			{/* <Stack.Screen name={routes.emergencyView} initialParams={{ presentation: 'modal' }} options={{ presentation: 'modal' }} /> */}
			<Stack.Screen name={routes.terms} initialParams={{ presentation: 'modal' }} options={{ presentation: 'modal' }} />
        </Stack>

	)
}


