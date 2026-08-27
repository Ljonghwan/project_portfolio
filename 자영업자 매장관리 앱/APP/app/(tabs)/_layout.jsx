
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

import protectedRouter from '@/libs/protectedRouter';

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
						
						if(['my', 'work'].includes(route.name)) {
							protectedRouter.push(route.name)
						} else {
							navigation.navigate(route.name);
						}
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
									style={rootStyle?.[`menu_${index}`] || rootStyle.default}
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
				animation: 'none',
				lazy: true,
			}}
			tabBar={props => <MyTabBar {...props} />}
		>
			<Tabs.Screen
				name={'index'}
				options={{ title: '홈' }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'work'}
				options={{ title: '업무' }}
				initialParams={{ tabs: true, lazy: false }}
			/>
			<Tabs.Screen
				name={'talk'}
				options={{ title: '오너톡' }}
				initialParams={{ tabs: true }}
			/>
			<Tabs.Screen
				name={'my'}
				options={{ title: '사장실', lazy: false }}
				initialParams={{ tabs: true }}
			/>
		</Tabs>
	);
}

const useStyle = () => {
	
	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		tabbar: {
			position: 'absolute', // 절대 위치 설정
			bottom: 0, // 하단에서 20px 띄움
			left: 0, // 좌측에서 20px 띄움
			flexDirection: 'row',
			backgroundColor: colors.white,
			// borderTopLeftRadius: 12,
			// borderTopRightRadius: 12,
			paddingBottom: insets?.bottom,
			paddingHorizontal: 7,

			elevation: 30, // 안드로이드 그림자
			shadowColor: 'rgba(20, 20, 20)', // iOS 그림자
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
		},
		tabContainer: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-around',
			overflow: 'hidden',
			zIndex: 2,
			height: rootStyle.bottomTabs.height,
			
		},
		item: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
		},
		itemContainer: {
			width: '100%',
			height: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 4,
		},
		itemText: {
			fontSize: 12,
			color: colors.text6C7072,
			textAlign: 'center', 
		},
		itemTextOn: {
			fontSize: 12,
			color: colors.primary,
			textAlign: 'center',
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
