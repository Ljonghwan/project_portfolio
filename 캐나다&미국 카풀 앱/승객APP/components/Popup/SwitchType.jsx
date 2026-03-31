import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Linking } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { Image } from 'expo-image';
import { router } from "expo-router";

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
	list = [],
	value,
	setValue
}) {
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

	const [load, setLoad] = useState(false);

	const onPress = async (v) => {
		try {
			const actualUrl = `taseta-driver222://`;
			await Linking.openURL(actualUrl); // 실제 앱 호출
		} catch (err) {
			console.log('err', err);
			// 스토어로 이동
			Linking.openURL(`market://details?id=com.taseta.driver`);
		}
	};

	return (
		<View style={styles.root}>

			<TouchableOpacity style={styles.top} hitSlop={10} onPress={closeAlertFunc}>
				<Image source={images.exit} style={rootStyle.default} />
			</TouchableOpacity>

			<View style={{ gap: 21 }}>
				<Text style={styles.title}>{lang({ id: 'do_you_want_2' })}</Text>
				<View style={{ gap: 14, paddingHorizontal: 15, paddingBottom: 15 }}>
					{/* <Button onPress={() => { onPress(1) }}>{lang({ id: 'passenger' })}</Button> */}
					<Button onPress={() => { onPress(2) }}>{lang({ id: 'driver' })}</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		padding: 18
	},

	top: {
		alignSelf: 'flex-end',
		marginBottom: 8
	},
	title: {
		fontSize: 22,
		color: colors.main,
		fontFamily: fonts.extraBold,
		textAlign: 'center',
	}
});