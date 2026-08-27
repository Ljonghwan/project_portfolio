import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, AppState, Pressable, Alert as RNAlert, StyleSheet, View, Linking, Platform } from 'react-native';

import { useNetworkState } from 'expo-network';
import * as SplashScreen from 'expo-splash-screen';
import { setStatusBarStyle, setStatusBarHidden } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Application from 'expo-application';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider, OverKeyboardView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut, ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Image, ImageBackground } from 'expo-image';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';

import Router from '@/components/Router';

import Text from '@/components/Text';

import Alert from '@/store-component/Alert';
import AlertSheet from '@/store-component/AlertSheet';
import Loader from '@/store-component/Loader';
import Lottie from '@/store-component/Lottie';
import Photo from '@/store-component/Photo';


import API from '@/libs/api';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import { badgeReload } from '@/libs/utils';
import { useAlert, useConfig, useEtc, useUser } from '@/libs/store';

import rootStyle from '@/libs/rootStyle';

setStatusBarHidden(true);
setStatusBarStyle('dark');
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
	duration: 300,
	fade: true,
});

const toastConfig = {
	success: (props) => (
		<BaseToast
			{...props}
			style={{ borderLeftWidth: 0, borderRadius: 12, height: 46, backgroundColor: '#3C3D40', width: '100%', maxWidth: 300}}
			text1Style={{
				fontFamily: fonts.semiBold,
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

const firebase = getApp();
const messaging = getMessaging(firebase);
const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);


export default function RootLayout() {

	const networkState = useNetworkState();

	const { styles } = useStyle();
	const { token, mbData, reload, setPushToken } = useUser();
	const { openAlert } = useAlert();
	const { intro, setConfigOptions, setBadges } = useConfig();
	const { appActiveStatus, setAppActiveStatus, setTransparencyEnabled } = useEtc();

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

	const [initialRouteName, setinitialRouteName] = useState(routes.intro);
	const [isReady, setisReady] = useState(false); // 설정값 불러왔을경우 체크
	const [isConnectedToast, setisConnectedToast] = useState(false);
	const [test, setTest] = useState(false);

	useEffect(() => {

		badgeReload();

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
			reduceTransparencyChangedSubscription.remove();
		}

	}, [])

	useEffect(() => {

		const appStateListener = AppState.addEventListener('change', appActive);

		return () => {
			appStateListener.remove();
		}

	}, [isReady])

	useEffect(() => {

	}, [token]);


	useEffect(() => {


	}, [appActiveStatus]);


	useEffect(() => {

		if (typeof networkState.isConnected !== 'boolean') return;

		setisConnectedToast(!networkState?.isConnected);
		
	}, [networkState])

	useEffect(() => {
		if (loaded) {
			
			if (!intro) setinitialRouteName(routes.intro);
			else if (!token) setinitialRouteName(routes.login);
			else setinitialRouteName(routes.tabs);
			
			getFcmToken();
			loadFunc();
		}
	}, [loaded]);

	const loadFunc = async () => {
		// await requestPermissionGps();

		await getConfigData(async () => {
			
			setTimeout(() => {
				setisReady(true);
				setStatusBarHidden(false);
				
				SplashScreen.hideAsync();
			}, 300)

		})
	}

	const appActive = async (state) => {
		
		setAppActiveStatus(state);
		setStatusBarStyle('dark');
		badgeReload();
		console.log('appActive', state, isReady);
		if (state === 'active' && isReady) getConfigData();
	}

	const getConfigData = async (callback) => {
		// 앱 설정 데이터 가져오는 API
		try {
			const sender = {
				os: Platform.OS,
				version: Application.nativeApplicationVersion,
				releaseType: process.env.EXPO_PUBLIC_APP_ENV,
			}

			const { data, error } = await API.post('/config', sender);
			
			if (error) {
				RNAlert.alert(
					error?.url ? '최신 업데이트' : '알림', 
					error?.message, 
					error?.url ? [{ text: '업데이트 하기', onPress: () => { Linking.openURL(error?.url); } }] : []
				);
				await SplashScreen.hideAsync();
				return;
			}

			setConfigOptions(data?.config);
			setBadges(data?.badgeList);

			callback();
		} catch (error) {
			
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
											<Router initialRouteName={initialRouteName} />
										)}

										<Alert />
										<AlertSheet />
										<Photo />
										<Loader />
										<Lottie />

										{isConnectedToast && (
											<View style={{...StyleSheet.absoluteFillObject}}>
												<GestureHandlerRootView style={{ flex: 1 }}>
													<AnimatedTouchable
														entering={FadeIn}
														exiting={FadeOut}
														style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rootStyle.side }}
													>
														<View style={[rootStyle.flex, { width: 'auto', gap: 10, backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 }]}>
															<ActivityIndicator size="small" color={colors.white} />
															<Text style={{ ...rootStyle.font(16, colors.white, fonts.medium) }}>{'통신상태를 확인해주세요.'}</Text>
														</View>
													</AnimatedTouchable>
												</GestureHandlerRootView>
											</View>
										)}
										
										<Toast
											position='bottom'
											bottomOffset={insets?.bottom + 40}
											visibilityTime={3000}
											config={toastConfig}
											avoidKeyboard={false}
										/>

										
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

	})

	return { styles }
}

