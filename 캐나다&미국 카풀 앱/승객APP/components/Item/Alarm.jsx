import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSpring,
	Easing
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import Text from '@/components/Text';
import Tag from '@/components/Tag';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { getDday, numFormat, getFullDateFormat } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({ item, style, deleteFunc }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { openAlertFunc } = useAlert();
	const { badges } = useConfig();

	const swipeable = useRef();

	const [users, setUsers] = useState([]);

	useEffect(() => {

		setUsers(item?.members?.filter(x => x?.idx !== mbData?.idx) || []);

	}, [item])

	const onPress = () => {
		if(!routes?.[item?.route]) return;

		router.push({
			pathname: routes?.[item?.route],
			params: {
				idx: item?.routeIdx
			},
		})

	}

	const deleteAlert = () => {
		swipeable?.current?.close();

		deleteFunc(item?.idx);
	}

	return (
		<Animated.View style={{ paddingHorizontal: rootStyle.side }}>
			<Pressable style={[styles.container, style]} onPress={onPress}>
				<View style={{ gap: 5, flex: 1 }}>
					<Text numberOfLines={3} style={{flex: 1, ...rootStyle.font(18, colors.main, fonts.semiBold)}}>{lang({ id: item?.title })}</Text>
					<Text style={{flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium)}}>{dayjs(item?.createAt).format('MMM/DD/YYYY h:mm A')}</Text>
				</View>

				<TouchableOpacity onPress={deleteAlert} hitSlop={10}>
					<Image source={images.exit} style={rootStyle.default} />
				</TouchableOpacity>
			</Pressable>
		</Animated.View>

	);
}


const useStyle = () => {
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 13,
			paddingVertical: 14,
			borderBottomWidth: 1,
			borderBottomColor: colors.sub_1
		},
		count: {
			minWidth: 20,
			height: 20,
			paddingHorizontal: 4,
			backgroundColor: colors.text_popup,
			borderRadius: 100,
			alignItems: 'center',
			justifyContent: 'center',
		},
		countText: {
			fontFamily: fonts.medium,
			fontSize: 12,
			lineHeight: 20,
			color: colors.white,
		},
		rightAction: {
			width: 80,
			height: '100%',
			backgroundColor: colors.text_popup,
			alignItems: 'center',
			justifyContent: 'center'
		},
	});

	return { styles }
}


