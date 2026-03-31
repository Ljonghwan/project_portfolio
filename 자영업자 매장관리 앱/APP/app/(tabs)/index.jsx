import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInLeft, useSharedValue } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

import Home from '@/componentsPage/Home';
import HomePermission from '@/componentsPage/HomePermission';

import EmptyStore from '@/components/Popup/EmptyStore';

import Popup from '@/store-component/Popup';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';
import { useUser, useStore, useAlert, useLoader, useConfig } from '@/libs/store';

export default function Page() {

	const tabBarHeight = useBottomTabBarHeight();

	const { styles } = useStyle();

	const { token, mbData, pushToken } = useUser();
	const { store } = useStore();
	const { emptyStore, setEmptyStore } = useConfig();

	const [tab1, setTab1] = useState(1);
	const [tab2, setTab2] = useState(1);

	const [initLoad, setInitLoad] = useState(true);
	const [reload, setReload] = useState(false); // 새로고침
	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);
	

	const header = {
		store: true,
		right: {
			bell: true
		},
	};

	return (
		<Layout header={header} backgroundColor={colors.fafafa}>
			{token ? (
				<Home />
			) : (
				<HomePermission />
			)}

			<Popup page={'index'}/> 
			{(token && !mbData?.store_idx && !emptyStore) && <EmptyStore /> }
		</Layout>
	)
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		

	})

	return { styles }
}
