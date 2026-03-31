import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { TabView, TabBar } from 'react-native-tab-view';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Select from '@/components/Select';

import Board from '@/componentsPage/Board';

import Popup from '@/store-component/Popup';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useLoader } from '@/libs/store';

export default function Page() {

	const tabBarHeight = useBottomTabBarHeight();

	const { styles } = useStyle();
	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	const { mbData } = useUser();
	const { store } = useStore();

	const { configOptions } = useConfig();

	const [index, setIndex] = useState(0);
	const [sort, setSort] = useState(1);

	const renderScene = ({ route }) => {
		return <Board cate={route.idx} sort={sort}/>
	};

	const renderTabBar = (props) => (
		<View style={[{ paddingHorizontal: 18, marginTop: 15, gap: 15 }]}>
			<TabBar
				{...props}
				indicatorStyle={styles.indicator}
				style={styles.tabBar}
				gap={6}
				tabStyle={{ width: 'auto' }}
				labelStyle={styles.label}
				activeColor={colors.primary}
				inactiveColor={colors.text686B70}
				pressColor="transparent"

				renderTabBarItem={({ route, navigationState, onPress }) => {
					const routeIndex = navigationState.routes.findIndex((r) => r.key === route.key);
					const focused = navigationState.index === routeIndex;

					return (
						<Pressable
							style={[
								styles.tabButton,
								focused && styles.tabButtonActive,
							]}
							onPress={onPress}
						>
							<Text
								style={[
									styles.tabLabel,
									focused && styles.tabLabelActive
								]}
							>
								{route.title}
							</Text>
						</Pressable>
					)
				}}
			/>

			<View style={[rootStyle.flex, {justifyContent: 'flex-start', gap: 6 }]}>
				<TouchableOpacity style={[styles.sortButton, sort === 1 && styles.sortButtonActive]} onPress={() => setSort(1)}>
					<Image source={images.talk_sort_01} style={[rootStyle.default16, sort === 1 && { tintColor: colors.black }]} />
					<Text style={[styles.sortButtonText, sort === 1 && styles.sortButtonTextActive]}>최신순</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.sortButton, sort === 2 && styles.sortButtonActive]} onPress={() => setSort(2)}>
					<Image source={images.talk_sort_02} style={rootStyle.default16} />
					<Text style={[styles.sortButtonText, sort === 2 && styles.sortButtonTextActive]}>인기순</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const header = {
		leftTitle: '커뮤니티',
		right: {
			bell: true
		},
	};

	return (
		<Layout header={header} >
			<TabView
				swipeEnabled={false}
				navigationState={{ index, routes: configOptions?.boardCategory?.map(x => ({ ...x, key: x?.idx })) }}
				renderTabBar={renderTabBar}
				onIndexChange={setIndex}
				initialLayout={{ width: width }}
				renderScene={renderScene}
				lazy={true}
			/>
			<View
				style={[styles.addBox, { bottom: tabBarHeight + 20 }]}
			>
				<Select
					list={[{ idx: 'write', title: '글쓰기', role: 'write' }]}
					transformOrigin={'bottom right'}
					right={20}
					top={-120}
					boxStyle={{ minWidth: 'auto' }}
					listStyle={{ justifyContent: 'center', gap: 6 }}
					textStyle={{ color: colors.text415980, fontFamily: fonts.medium }}
					setState={(v) => {
						if (v === 'write') protectedRouter.push(routes.boardForm);
					}}
				// onSubmitEditing={() => inputRefs.current?.price?.focus()}
				>
					<View style={styles.add}>
						<Image source={images.add_white} style={rootStyle.default20}></Image>
					</View>
				</Select>
			</View>
			{/* </Select> */}



			<Popup page={'talk'} />
		</Layout>
	)
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		tabBar: {
			backgroundColor: '#FFFFFF',
			elevation: 0,
			shadowOpacity: 0,
			borderBottomWidth: 0,
		},
		indicator: {
			display: 'none',
		},
		tabButton: {
			backgroundColor: colors.f4f4f5,
			paddingHorizontal: 12,
			height: 32,
			borderRadius: 8,
			alignItems: 'center',
			justifyContent: 'center'
		},
		tabButtonActive: {
			backgroundColor: colors.primary,
		},
		tabLabel: {
			fontFamily: fonts.medium,
			fontSize: 13,
			color: colors.text686B70,
			letterSpacing: -0.325,
		},
		tabLabelActive: {
			color: colors.white,
		},

		sortButton: {
			height: 32,
			flexDirection: 'row',
			alignItems: 'center',
			gap: 4,
			borderRadius: 8,
			borderWidth: 1,
			borderColor: colors.cfcfcf,
			paddingHorizontal: 8
		},
		sortButtonText: {
			fontFamily: fonts.medium,
			fontSize: 13,
			color: colors.text686B70,
		},
		sortButtonActive: {
			borderColor: colors.primary,
		},
		sortButtonTextActive: {
			color: colors.black,
		},
		addBox: {
			position: 'absolute',
			bottom: 0,
			right: 20,
		},
		add: {
			backgroundColor: colors.primary,
			width: 65,
			aspectRatio: 1 / 1,
			borderRadius: 1000,
			alignItems: 'center',
			justifyContent: 'center'
		},


	})

	return { styles }
}