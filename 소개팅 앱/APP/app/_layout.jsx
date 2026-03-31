import { useRef, useState, useEffect } from 'react';
import { Appearance, StyleSheet, View, Platform, AccessibilityInfo, Alert as RNAlert, TouchableOpacity, AppState, ActivityIndicator, Linking, StatusBar } from 'react-native';

import { withIAPContext, useIAP } from 'react-native-iap';
import * as SystemUI from 'expo-system-ui';

import { Asset } from "expo-asset";
import * as Application from 'expo-application';
import * as SplashScreen from 'expo-splash-screen';
import { useNetworkState } from 'expo-network';
import Animated, { ReducedMotionConfig, ReduceMotion, FadeIn, FadeOut } from 'react-native-reanimated';
import { setStatusBarStyle } from 'expo-status-bar';

import { usePathname, router } from "expo-router";
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';

// import { ToastProvider, Toast } from 'react-native-toast-notifications';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';


import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import { throttle } from 'lodash';
import * as Notifications from 'expo-notifications';


import Router from '@/Router';

import Text from '@/components/Text';
import SplashScreenComponent from '@/components/SplashScreen';

import Alert from '@/store-component/Alert';
import AlertSheet from '@/store-component/AlertSheet';
import Loader from '@/store-component/Loader';
import Photo from '@/store-component/Photo';

import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { useUser, useAlert, useConfig, useCall, useEtc } from '@/libs/store';
import { ToastMessage, forgegroundDisplayNotification, badgeReload } from '@/libs/utils';
import TwilioVoiceService from '@/hooks/TwilioVoiceService';
// import useAppCloseListener from '@/libs/useAppCloseListener';

Appearance.setColorScheme('light');
SystemUI.setBackgroundColorAsync(colors.white);

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true; // 파이어베이스 콘솔 경고성문구 제거

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
// SplashScreen.setOptions({
// 	duration: 300,
// 	fade: true,
// });

// console.log('NativeModules', NativeModules); // NativeModules 객체 출력
// console.log('NativeModules.RCTEventDispatcher', NativeModules.RCTEventDispatcher); // RCTEventDispatcher가 존재하는지 확인

// const { RCTEventDispatcher } = NativeModules;


const toastConfig = {
	success: (props) => (
		<BaseToast
			{...props}
			style={{ borderLeftWidth: 0, borderRadius: 16, height: 46, backgroundColor: '#3C3D40', width: '100%', maxWidth: 300}}
			text1Style={{
				fontFamily: fonts.medium,
				fontSize: 14,
				color: colors.white,
				textAlign: 'center'
			}}
			text1NumberOfLines={2}
			text1Props={{
				allowFontScaling: false
			}}
		/>
	),
	error: (props) => (
		<ErrorToast
			{...props}
			style={{ borderLeftColor: colors.text_popup, width: '100%', maxWidth: 330 }}
			text1Style={{
				fontFamily: fonts.regular,
				fontSize: 14,
			}}
			text1NumberOfLines={2}
			text1Props={{
				allowFontScaling: false
			}}
		/>
	)
};

function RootLayout() {

	const networkState = useNetworkState();
	const { fetchProducts } = useIAP();
	const pathname = usePathname();

	const { styles } = useStyle();
	const { token, mbData, pushToken, voipToken, login, logout, setPushToken, setVoipToken, reload } = useUser();
	const { openAlertFunc } = useAlert();
	const { setConfigOptions } = useConfig();
	const { audio, setAudioStatus, appActiveStatus, setAppActiveStatus, transparencyEnabled, setTransparencyEnabled } = useEtc();

	const [loaded] = useFonts({
		Pretendard_900: require('../assets/fonts/Pretendard-Black.ttf'),
		Pretendard_800: require('../assets/fonts/Pretendard-ExtraBold.ttf'),
		Pretendard_700: require('../assets/fonts/Pretendard-Bold.ttf'),
		Pretendard_600: require('../assets/fonts/Pretendard-SemiBold.ttf'),
		Pretendard_500: require('../assets/fonts/Pretendard-Medium.ttf'),
		Pretendard_400: require('../assets/fonts/Pretendard-Regular.ttf'),
		Pretendard_300: require('../assets/fonts/Pretendard-Light.ttf'),
		Pretendard_200: require('../assets/fonts/Pretendard-ExtraLight.ttf'),
		Pretendard_100: require('../assets/fonts/Pretendard-Thin.ttf'),
	});

	// const player1 = useAudioPlayer(images.dialing);
	// const player2 = useAudioPlayer(images.reconnected);
	// const player3 = useAudioPlayer(images.reconnecting);


	const [initialRouteName, setinitialRouteName] = useState(routes.tabs);
	const [isReady, setisReady] = useState(false);
	const [isConnectedToast, setisConnectedToast] = useState(null);
	const [test, setTest] = useState(false);

	const throttledDataFunc = throttle((data) => {
		badgeReload();
	}, 500);

	
	useEffect(() => {

		// 앱이 백그라운드에서 FCM 알림 클릭으로 열린 경우
		// messaging().onNotificationOpenedApp(pushClickIn);
		// 앱이 종료된 상태에서 FCM 알림 클릭으로 열린 경우
		// messaging().getInitialNotification().then(pushClickIn);

	}, [])


	useEffect(() => {
		const unsubscribe = messaging().onMessage(async remoteMessage => {
			console.log('remoteMessage', remoteMessage);
			throttledDataFunc();

			if(Platform.OS === 'android' && (!remoteMessage?.notification?.title && !remoteMessage?.notification?.body)) {
				return;
			}
		
			forgegroundDisplayNotification({
				title: remoteMessage?.notification?.title || '알림',
				body: remoteMessage?.notification?.body || '내용',
				data: remoteMessage?.data
			});
			

			if (remoteMessage?.data?.topAgree) {
				appActiveReplace('topJoinAgree');
			}
		});


		const reduceTransparencyChangedSubscription = AccessibilityInfo.addEventListener(
			'reduceTransparencyChanged',
			enabled => {
				setTransparencyEnabled(enabled);
			},
		);

		return () => {
			reduceTransparencyChangedSubscription.remove();
			unsubscribe();
		}

	}, []);

	useEffect(() => {
		const appStateListener = AppState.addEventListener('change', appActive);

		return () => {
			appStateListener.remove();
		}

	}, [isReady, pathname]);


	useEffect(() => {

		if (typeof networkState.isConnected !== 'boolean') return;

		setisConnectedToast(!networkState?.isConnected);
		
	}, [networkState])

	useEffect(() => {
		if (token) {
			appActive('active');
			initVoice();
		}
	}, [token])

	useEffect(() => {


	}, [mbData, pushToken, voipToken])


	useEffect(() => {
		if (loaded) {

			// reload();

			getFcmToken();
			getVoipToken();

			getConfigData(async () => {
				console.log('mbData',mbData?.userDetail);
				if (!token) setinitialRouteName(routes.login);
				// else if (!mbData?.userDetail) setinitialRouteName(routes.joinSuccess); // 내 프로필 등록 안된경우
	
				else if (!mbData?.userDetail) setinitialRouteName(routes.joinSuccess); // 내 프로필 등록 안된경우
				else if (mbData?.level === 2 && !mbData?.isVisual) setinitialRouteName(routes.topJoinAgree); // 1% 회원 신청 승인 됬고, 가이드 확인 안한경우
	
				// else if (!mbData?.userMatchingDetail) setinitialRouteName(routes.joinTargetProfile); // 원하시는 이성 프로필 등록 안된경우
				else setinitialRouteName(routes.tabs);

				
				setisReady(true);
				
				// await requestPermission();
				// const getLinking = await Linking.getInitialURL();
				// console.log('getLinking', getLinking);

				// setTimeout(() => {
					
					// SplashScreen.hideAsync();
				// }, 300)
			})

		}
	}, [loaded]);


	const getConfigData = async (callback) => {
		// await Asset.fromURI(consts.s3Url + '/images/splash.json').downloadAsync();

		// 앱 설정 데이터 가져오는 API
		const sender = {
			version: Application.nativeApplicationVersion,
		}
		const { data, error } = await API.post('/config', sender);
		
		if (error) {
			RNAlert.alert(
				error?.data?.url ? '최신 업데이트' : '알림', 
				error?.message, 
				error?.data?.url ? [{ text: '업데이트 하기', onPress: () => { Linking.openURL(error?.data?.url); } }] : []
			);
			await SplashScreen.hideAsync();
			return;
		}

		setConfigOptions(data?.config);
		fetchProducts({ skus: data?.pruductList?.filter(item => item?.appleSku)?.map(item => item?.appleSku) });

		callback();
	}

	const getFcmToken = async () => {
		try {
			await messaging().registerDeviceForRemoteMessages();
			let token = await messaging().getToken();

			console.log('token', token);
			setPushToken(token);

		} catch (error) {
			getFcmToken();
		}
	};

	const getVoipToken = () => {
		if (Platform.OS === 'ios') {
		}
	}

	const appActive = async (state) => {
		console.red('appActive!!!!!!!');

		setStatusBarStyle('dark');
		StatusBar.setBarStyle('dark-content', true);
		setAppActiveStatus(state);

		if (state === 'active') {
			if(isReady) getConfigData();
			badgeReload();

			AccessibilityInfo.isReduceTransparencyEnabled().then(enabled => {
				console.log('reduceTransparency Init1', enabled);
				setTransparencyEnabled(enabled);
			})

		}
		const { data, error } = await API.post('/v1/user/active', { connect: state === 'active' });
		console.log('appActive', state, data);
		if(state === 'active' && data?.route) {
			setTimeout(() => {
				appActiveReplace(data?.route);
			}, 1000)
		}
	}



	const appActiveReplace = (route) => {
		console.log('appActiveReplace', pathname, routes?.[route]);
		if(pathname === "/" + routes?.[route]) return;
		if(route === 'topJoinAgree' && pathname.startsWith('/topAgree')) return;

		router.canDismiss() && router.dismissAll();
		router.replace(routes?.[route]);
	}

	const initVoice = async () => {

		const { data, error } = await API.post('/v1/user/createTwilioToken');
		if(error) return;

		TwilioVoiceService.init(data);
	}


	return (
		<>
			<ReducedMotionConfig mode={ReduceMotion.Never} />
			<SafeAreaProvider>
				<GestureHandlerRootView >
					<KeyboardProvider>
						<BottomSheetModalProvider>
							<SafeAreaInsetsContext.Consumer>
								{insets =>
									<>
										
										{isReady && (
											<SplashScreenComponent>
												<Router initialRouteName={initialRouteName} />
											</SplashScreenComponent>
										)}

										<Alert />
										<AlertSheet />
										<Photo />
										<Loader />

										{isConnectedToast && (
											<View style={{...StyleSheet.absoluteFillObject}}>
												<GestureHandlerRootView style={{ flex: 1 }}>
													<Animated.View
														entering={FadeIn}
														exiting={FadeOut}
														style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rootStyle.side }}
													>
														<View style={[rootStyle.flex, { width: 'auto', gap: 10, backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 }]}>
															<ActivityIndicator size="small" color={colors.white} />
															<Text style={{ ...rootStyle.font(14, colors.white, fonts.medium) }}>{'통신상태를 확인해주세요.'}</Text>
														</View>
													</Animated.View>
												</GestureHandlerRootView>
											</View>
										)}
										

										<Toast
											position='bottom'
											bottomOffset={insets?.bottom + 60}
											visibilityTime={3000}
											config={toastConfig}
											avoidKeyboard={false}
										/>

										{/* <Call /> */}
										{/* {callId && <Call callId={callId}/>} */}

									</>
								}

							</SafeAreaInsetsContext.Consumer>
						</BottomSheetModalProvider>
					</KeyboardProvider>
				</GestureHandlerRootView>
			</SafeAreaProvider>
		</>
	)
}

const useStyle = () => {

	const styles = StyleSheet.create({
		toastBox: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 12,
			paddingHorizontal: 12,
			paddingVertical: 12,
			backgroundColor: 'rgba(0, 0, 0, 0.70)',
			borderRadius: 19
		},
		toastText: {
			fontFamily: fonts.bold,
			fontSize: 14,
			lineHeight: 20,
			color: '#fff',
			textAlign: 'center'
		}
	})

	return { styles }
}

// withIAPContext로 앱 감싸기
export default RootLayout;