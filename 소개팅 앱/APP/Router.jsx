import { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, PermissionsAndroid, Alert as RNAlert, TouchableOpacity, AppState, ActivityIndicator } from 'react-native';

import { Stack, router, usePathname } from "expo-router";
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Animated, { ReducedMotionConfig, ReduceMotion, FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { OverKeyboardView } from "react-native-keyboard-controller";

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useCall, useAlert, useEtc } from '@/libs/store';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';


function useNotificationObserver() {
	const pathname = usePathname();

	useEffect(() => {
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

			console.red('pathname', pathname);
			console.red('notification?.route', routes?.[notification?.route]);


			if (routes?.[notification?.route]) {
				Notifications.clearLastNotificationResponse();
				// router.canDismiss() && router.dismissAll();
				setTimeout(() =>{ 
					if(pathname === "/" + routes?.[notification?.route]) {
						router.replace({
							pathname: routes?.[notification?.route],
							params: notification
						});
					} else {
						router.navigate({
							pathname: routes?.[notification?.route],
							params: notification
						});
					}
					
				}, 500)
			}
		}

		const response = Notifications.getLastNotificationResponse();
		if (response?.notification) {
			let result = Platform.select({
				android: response?.notification?.request?.content?.data,
				ios: response.notification?.request?.trigger?.payload || response?.notification?.request?.content?.data
			});

			console.red('result', result);
			redirect(result);
		}

		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			
			let result = Platform.select({
				android: response?.notification?.request?.content?.data,
				ios: response.notification?.request?.trigger?.payload || response?.notification?.request?.content?.data
			});

			console.log('redirect 2222')
			redirect(result);
		});

		return () => {
			subscription.remove();
		};
	}, [pathname]);
}

export default function Router({ initialRouteName }) {

    useNotificationObserver();

	const { isInitialized, isRegistered, audioDevices, selectedDevice, currentCall, callInvite, acceptCall, rejectCall } = useTwilioVoice();

	const pathname = usePathname();
	const { token, mbData, reload } = useUser();
    const { audioId, setAudioId, transparencyEnabled, appActiveStatus } = useEtc();


	const [callInviteData, setCallInviteData] = useState(null);

	/*
	  | 'push'
		| 'modal'
		| 'transparentModal'
		| 'containedModal'
		| 'containedTransparentModal'
		| 'fullScreenModal'
		| 'formSheet';
	 */

	useEffect(() => {

		const getInitialURL = async () => {
			const initialURL = await Linking.getInitialURL();
			console.log('initialURL', initialURL);
			if (initialURL) {
				handleDeepLink(initialURL);
			}
		};

		const handleDeepLink = async (url) => {
			// 딥 링크 URL 처리 로직
			const { queryParams } = Linking.parse(url);
			console.log('queryParams', typeof queryParams?.route, queryParams?.route);
			if(queryParams?.route) {
				setTimeout(() => {
					router.navigate(queryParams?.route)
				}, 500)
			}
		};

		const linkingListener = Linking.addEventListener('url', (event) => {
			console.log('event', event);
			handleDeepLink(event.url);
		});

		getInitialURL();

		return () => {
			linkingListener.remove();
		};

	}, [])

	useEffect(() => {
		console.log(Platform.OS, 'audioDevices', audioDevices);
		console.log(Platform.OS, 'selectedDevice', selectedDevice);
	}, [audioDevices, selectedDevice])

	useEffect(() => {

		// console.log(Platform.OS, 'currentCall', currentCall);
		// console.log(Platform.OS, 'callInvite', callInvite);
		console.log(Platform.OS, 'pathname', pathname, currentCall);
		
		if((isInitialized && currentCall) && !pathname.includes(routes?.call)) {
			router.navigate(routes.call);
		}

	}, [isInitialized, currentCall])

	useEffect(() => {
		console.log(Platform.OS + '=> callInvite', callInvite);
		if(isInitialized && callInvite) {
			setAudioId(null);
			setCallInviteData(callInvite?.getCustomParameters() || null);
		} else {
			setCallInviteData(null);
		}
	}, [isInitialized, callInvite])


	useEffect(() => {
		console.log('pathname', pathname);
		if(audioId) setAudioId(null);

		if (token) {
			reload();
		}
	}, [pathname, token])

	useEffect(() => {
		
		if(token) {
		}

	}, [token])
	

	return (
		<>
			<Stack initialRouteName={initialRouteName} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} >
				<Stack.Screen name="index" redirect />
				{/* <Stack.Screen name={routes.intro} /> */}
				<Stack.Screen name={routes.login} />

				<Stack.Screen name={routes.joinSuccess} />
				<Stack.Screen name={routes.joinProfile} />

				<Stack.Screen name={routes.tabs} />
				
				<Stack.Screen name={routes.viewer} options={{ presentation: 'containedTransparentModal'}} />
				<Stack.Screen name={routes.call} options={{ presentation: 'containedTransparentModal'}} />

				<Stack.Screen name={routes.terms} initialParams={{ presentation: 'modal' }} options={{ presentation: 'modal' }} />
			</Stack>

			{callInviteData && appActiveStatus === 'active' && (
				<View style={{...StyleSheet.absoluteFillObject}}>
					<OverKeyboardView visible={true}>
						<GestureHandlerRootView style={{ flex: 1 }}>
							<Animated.View
								entering={Platform.OS === 'ios' ? FadeIn : undefined}
								exiting={Platform.OS === 'ios' ? FadeOut : undefined}
								style={{ flex: 1 }}
							>
								<View style={{...StyleSheet.absoluteFillObject, backgroundColor: Platform.OS === 'ios' ? colors.dim : colors.dimWhite}}/>
								<BlurView 
									style={{ 
										width: '100%', 
										height: '100%', 
										alignItems: 'center', 
										justifyContent: 'space-between', 
										gap: 20, 
										paddingVertical: 120, 
										paddingHorizontal: 40,
									}} 
									intensity={Platform.OS === 'ios' && transparencyEnabled ? 0 : 40} 
									tint={'extraLight'}
								>
									<View style={{ alignItems: 'center', gap: 20, marginTop: 100 }}>
										<Image source={callInviteData?.callerProfile ? consts.s3Url + callInviteData?.callerProfile : images.profile} style={{ width: 160, aspectRatio: 1, borderRadius: 1000 }}/>
										<Text style={{ ...rootStyle.font(22, Platform.OS === 'ios' ? colors.white :colors.dark, fonts.semiBold) }}>{callInviteData?.callerName}</Text>
									</View>
									<View style={[rootStyle.flex, { width: '100%', justifyContent: 'space-between' }]}>
										<TouchableOpacity onPress={rejectCall}>
											<Image source={images.call_reject} style={{ width: 70, aspectRatio: 1 }}/>
										</TouchableOpacity>
										<TouchableOpacity onPress={acceptCall}>
											<Image source={images.call_accept} style={{ width: 70, aspectRatio: 1 }}/>
										</TouchableOpacity>
									</View>
								</BlurView>
							</Animated.View>
						</GestureHandlerRootView>
					</OverKeyboardView>
				</View>
			)}
			
		</>
        

	)
}


