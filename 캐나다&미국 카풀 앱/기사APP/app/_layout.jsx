import { useEffect, useState } from 'react';
import { Appearance, ActivityIndicator, AppState, AccessibilityInfo, View, Platform, Alert as RNAlert, StyleSheet, Text as RNText, TextInput, Pressable } from 'react-native';

import * as Location from 'expo-location';
import * as SplashScreen from 'expo-splash-screen';
import { useNetworkState, addNetworkStateListener } from 'expo-network';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, registerDeviceForRemoteMessages, getToken, getAPNSToken, onMessage } from '@react-native-firebase/messaging';

import Animated, { ReducedMotionConfig, ReduceMotion, FadeIn, FadeOut } from 'react-native-reanimated';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider, OverKeyboardView } from 'react-native-keyboard-controller';
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-toast-notifications';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { throttle } from 'lodash';

import Router from '@/Router';
// import SplashVideo from '@/SplashVideo';
import SplashScreenComponent from '@/SplashScreen';

import Text from '@/components/Text';

import Alert from '@/store-component/Alert';
import AlertSheet from '@/store-component/AlertSheet';
import Loader from '@/store-component/Loader';
import Photo from '@/store-component/Photo';
import Lottie from '@/store-component/Lottie';

import API from '@/libs/api';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import SocketService from '@/libs/ws';

import { useAlert, useCall, useConfig, useLang, useEtc, useUser, useGps } from '@/libs/store';
import { badgeReload, checkBackgroundGpsPermission, startBackgroundGps, ToastMessage, onMessageReceived, forgegroundDisplayNotification } from '@/libs/utils';

import rootStyle from '@/libs/rootStyle';

Appearance.setColorScheme('light');

RNText.defaultProps = RNText.defaultProps || {};
RNText.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

// dayjs.locale
// Keep the splash screen visible while we fetch resources

// Set the animation options. This is optional.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
	duration: 300,
	fade: true,
});

const toastConfig = {
	success: (props) => (
		<BaseToast
			{...props}
			style={{ borderLeftColor: colors.success, width: '100%', maxWidth: 330 }}
			text1Style={{
				fontFamily: fonts.regular,
				fontSize: 14,
			}}
			text1NumberOfLines={2}
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
		/>
	)
};

const firebase = getApp();
const messaging = getMessaging(firebase);
const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function RootLayout() {

	const networkState = useNetworkState();

	const { styles } = useStyle();
	const { token, mbData, reload, setPushToken } = useUser();
	const { openAlert } = useAlert();
	const { setLang } = useLang();
	const { setConfigOptions, setIntroComment, setBadges } = useConfig();
	const { appActiveStatus, setAppActiveStatus, setTransparencyEnabled } = useEtc();
	const { lat, lng, gpsStatus, setGpsStatus, setCurrentGpsStatus } = useGps();

	const [loaded] = useFonts({
		Goudy: require('../assets/fonts/Goudy.ttf'),
		Goudy_700: require('../assets/fonts/Goudy-Bold.otf'),
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

	const [initialRouteName, setinitialRouteName] = useState(routes.intro);
	const [isReady, setisReady] = useState(false); // 설정값 불러왔을경우 체크
	const [isSplashEnd, setisSplashEnd] = useState(false); // 스플래쉬 영상 종료
	const [isConnectedToast, setisConnectedToast] = useState(null);
	const [test, setTest] = useState(false);

	useEffect(() => {

		const appStateListener = AppState.addEventListener('change', state => {
			setAppActiveStatus(state);
		});

		AccessibilityInfo.isReduceTransparencyEnabled().then(enabled => {
			console.log('reduceTransparency Init', enabled);
			setTransparencyEnabled(enabled);
		})

		const reduceTransparencyChangedSubscription = AccessibilityInfo.addEventListener(
			'reduceTransparencyChanged',
			enabled => {
				console.log('reduceTransparencyChanged', enabled);
				setTransparencyEnabled(enabled);
			},
		);

		return () => {
			appStateListener.remove();
			reduceTransparencyChangedSubscription.remove();
		}

	}, [])

	useEffect(() => {

		if (token) {
			const socket = SocketService.getInstance();
			socket.connect(consts.chatSocketUrl, {
				transports: ["websocket"],
				auth: {
					token: token
				}
			}); // 실제 서버 주소로 변경

			return () => {
				socket.disconnect();
			}
		}

	}, [token]);


	useEffect(() => {

		(async () => {
			const foregroundStatus = await Location.getForegroundPermissionsAsync();
			const backgroundStatus = await Location.getBackgroundPermissionsAsync();

			console.log("foregroundStatus backgroundStatus", Platform.OS, foregroundStatus, backgroundStatus);
			// if (Platform.OS === 'ios') setGpsStatus(foregroundStatus?.granted);
			setGpsStatus((foregroundStatus?.granted && backgroundStatus?.granted));
			setCurrentGpsStatus(foregroundStatus?.granted);

		})();

	}, [appActiveStatus]);


	useEffect(() => {

		if (gpsStatus) {
			(async () => {
				console.log('gpsStatus Start', Platform.OS, gpsStatus);
				// await startBackgroundGps();
			})();
		} else {
			(async () => {
				console.log('gpsStatus Stop', Platform.OS, gpsStatus);
				// await Location.stopLocationUpdatesAsync('location');
			})();
		}

	}, [appActiveStatus, gpsStatus])

	useEffect(() => {

		if (typeof networkState.isConnected !== 'boolean') return;

		// setisConnectedToast(!networkState?.isConnected);

	}, [networkState])

	useEffect(() => {
		if (loaded) {
			if (!token) setinitialRouteName(routes.login);
			else if (!mbData?.userStyle) setinitialRouteName(routes.carpoolStyle); // 카풀 프로필 등록 안된경우
			else {
				setinitialRouteName(routes.tabs);
			}

			getFcmToken();
			loadFunc();
		}
	}, [loaded]);

	const loadFunc = async () => {
		// await requestPermissionGps();

		await getConfigData(async () => {

			setTimeout(() => {
				setisReady(true);
				// SplashScreen.hideAsync();
			}, 300)

		})
	}

	const getConfigData = async (callback) => {

		// 앱 설정 데이터 가져오는 API
		try {
			const { data, error } = await API.post('/config');

			if (error) {
				if (error?.message) RNAlert.alert('Alert', lang({ id: error?.message }));
				return;
			}

			setConfigOptions(data?.config);
			setIntroComment(data?.introComment);
			setBadges(data?.badgeList);
			setLang(data?.lang);

			callback();
		} catch (error) {
			console.log("<error", error)
		}

	}

	const getFcmToken = async () => {
		try {

			await registerDeviceForRemoteMessages(messaging);

			let token = await getToken(messaging);

			console.log('token', token);
			setPushToken(token);

		} catch (error) {
			console.log('error', error);
			getFcmToken();
		}
	};

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
										{/* <Text>{lat}</Text>
										<Text>{lng}</Text> */}

										{isReady && (
											<SplashScreenComponent onStart={() => { SplashScreen.hideAsync() }}>
												<Router initialRouteName={initialRouteName} />
											</SplashScreenComponent>
										)}

										<Alert />
										<AlertSheet />
										<Photo />
										<Loader />
										<Lottie />

										{isConnectedToast && (
											<View style={{ ...StyleSheet.absoluteFillObject }}>
												<GestureHandlerRootView style={{ flex: 1 }}>
													<AnimatedTouchable
														entering={FadeIn}
														exiting={FadeOut}
														style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rootStyle.side }}
													>
														<View style={[rootStyle.flex, { width: 'auto', gap: 10, backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 }]}>
															<ActivityIndicator size="small" color={colors.white} />
															<Text style={{ ...rootStyle.font(16, colors.white, fonts.medium) }}>{lang({ id: 'reconnecting_network' })}</Text>
														</View>
													</AnimatedTouchable>
												</GestureHandlerRootView>
											</View>
										)}

										<Toast
											position='bottom'
											bottomOffset={insets?.bottom + 20}
											visibilityTime={3000}
											config={toastConfig}
										/>

										{/* {!isSplashEnd && <SplashVideo onStart={() => { SplashScreen.hideAsync() }} onEnd={() => setisSplashEnd(true)} />} */}

									</>
								}
							</SafeAreaInsetsContext.Consumer>
							{/* {!isConnected && (
								<OverKeyboardView visible={true}>
									<View style={{ flex: 1, backgroundColor: 'red' }}>
										<Text>통신 에러</Text>
									</View>
								</OverKeyboardView>
							)} */}
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

