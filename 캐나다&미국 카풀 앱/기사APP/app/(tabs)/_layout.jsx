
import React, { useEffect, useCallback } from 'react';
import { View, Platform, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, Tabs, useRouter } from 'expo-router';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import lang from '@/libs/lang';

import { getBadgeCount, numFormat } from '@/libs/utils';

import { useUser, useEtc } from '@/libs/store';

function MyTabBar({ route, state, descriptors, navigation }) {

	// const router = useRouter();
	const { styles } = useStyle();

	const { mbData, badgeCount } = useUser();
	const { goTopFunc } = useEtc();

	useEffect(() => {
		
	}, []);

	return (
		<View
			style={[
				styles.tabbar
			]}
		>
			<View style={styles.tabContainer}>

				{state.routes.map((route, index) => {

					const { options } = descriptors[route.key];
					const isFocused = state.index === index;
					// const profileCheck = (isFocused && route.name === 'my' && mbData?.profile);

					const onPress = () => {

						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

						if (isFocused) {
							goTopFunc();
							return;
						}

						navigation.navigate(route.name);
					};

					return (
						<TouchableOpacity
							onPress={onPress}
							style={[styles.item]}
							key={index}
						>
							<View
								style={styles.itemContainer}
							>
								<Image
									source={images?.[`menu_${index}_${isFocused ? 'on' : 'off'}`]}
									style={rootStyle.tab}
								/>
								<Text style={isFocused ? styles.itemTextOn : styles.itemText}>{options.title}</Text>
								{(route.name === 'chat' && badgeCount > 0) && (
									<View style={styles.count}>
										<Text style={styles.countText}>{numFormat(badgeCount, 100)}</Text>
									</View>
								)}
							</View>

						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}


export default function TabLayout() {

	const { mbData } = useUser();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				animation: Platform.OS === 'ios' ? 'none' : 'none',
				lazy: true,
			}}
			tabBar={props => <MyTabBar {...props} />}
			initialRouteName={'index'}
		>
			<Tabs.Screen
				name={'find'}
				options={{ title: lang({ id: 'post' }) }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'chat'}
				options={{ title: lang({ id: 'chat' }), lazy: false }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'index'}
				options={{ title: lang({ id: 'home' }) }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'activity'}
				options={{ title: lang({ id: 'activity' }) }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'my'}
				options={{ title: lang({ id: 'account', lazy: false, animation: 'none' }) }}
				initialParams={{ tabs: true }}
			/>
		</Tabs>
	);
}

const useStyle = () => {

	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		tabbar: {
			position: 'absolute', // 절대 위치 설정
			bottom: 0, // 하단에서 20px 띄움
			left: 0, // 좌측에서 20px 띄움
			flexDirection: 'row',
			justifyContent: 'space-between',
			backgroundColor: colors.white,
			borderTopLeftRadius: 12,
			borderTopRightRadius: 12,
			paddingHorizontal: rootStyle.side,
			paddingBottom: insets?.bottom,

			elevation: 30, // 안드로이드 그림자
			shadowColor: colors.dark, // iOS 그림자
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 10,
		},
		tabContainer: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			overflow: 'hidden',
			zIndex: 2,
			height: rootStyle.bottomTabs.height,
			paddingTop: 8,
			
		},
		item: {
			alignItems: 'center',
			justifyContent: 'center',
		},
		itemContainer: {
			height: '100%',
			aspectRatio: "1/1",
			alignItems: 'center',
			justifyContent: 'center',
			gap: 2,
		},
		itemText: {
			fontSize: 12,
			color: colors.sub_2,
			textAlign: 'center',
			fontFamily: fonts.medium,
			letterSpacing: -0.24
		},
		itemTextOn: {
			fontSize: 12,
			color: colors.taseta,
			textAlign: 'center',
			fontFamily: fonts.medium,
			letterSpacing: -0.24
		},
		count: {
			minWidth: 16,
			height: 16,
			paddingHorizontal: 4,
			backgroundColor: colors.text_popup,
			borderRadius: 100,
			position: 'absolute',
			top: 2,
			left: '50%',
			alignItems: 'center',
			justifyContent: 'center',
		},
		countText: {
			fontFamily: fonts.medium,
			fontSize: 10,
			lineHeight: 16,
			color: colors.white,
		},

		blur: {
			width: '100%',
			height: '100%',
			position: 'absolute',
			top: -40,
			zIndex: 1,
		},


	})

	return { styles }
}
