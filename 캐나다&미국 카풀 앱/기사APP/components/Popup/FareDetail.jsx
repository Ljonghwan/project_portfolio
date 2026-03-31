import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable } from 'react-native';
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

import { useUser, useAlert, useLang } from '@/libs/store';

import { numFormat, ToastMessage } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
	onSubmit=()=>{}
}) {
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	const { country } = useLang();

	const [success, setSuccess] = useState(false);
	const [load, setLoad] = useState(false);

	return (
		<View style={styles.root}>
			<Text style={{ textAlign: 'center', ...rootStyle.font(30, colors.main, fonts.extraBold)}}>{lang({ id: 'fare_details' })}</Text>

			<View style={{ gap: 22 }}>
				<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.sub_1, fonts.medium), lineHeight: 22 }}>{lang({ id: 'fare_details_comment' })}</Text>
				<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.main, fonts.medium), lineHeight: 22 }}>{lang({ id: 'fare_details_comment2' })}</Text>
			</View>

			<View style={[rootStyle.flex, { gap: 14, marginTop: 10 }]}>
				<Button type={2} style={{ flex: 1 }} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
				<Button style={{ flex: 1 }} onPress={() => {
					closeAlertFunc();
					setTimeout(() => {
						onSubmit()
					}, 300)
				}}>{lang({ id: 'pay' })}</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 40,
		paddingHorizontal: rootStyle.side,
		gap: 11
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
	},
	label: {
		fontSize: 16,
		color: colors.sub_1,
		fontFamily: fonts.medium,
		letterSpacing: -0.64
	},
	comment: {
		fontSize: 16,
		color: colors.main,
		letterSpacing: -0.64
	},
});