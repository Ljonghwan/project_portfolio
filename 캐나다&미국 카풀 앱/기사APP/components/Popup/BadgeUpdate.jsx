import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
	treeBadge
}) {

	const { styles } = useStyle();

	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

	return (
		<View style={styles.root}>

			<Image source={consts.s3Url + treeBadge?.imgPath} style={{ width: 150, aspectRatio: 1/1, alignSelf: 'center' }}/>

			<View style={{ gap: 40 }}>
				<View style={{ gap: 12 }}>
					<Text style={{ textAlign: 'center', ...rootStyle.font(30, colors.main, fonts.extraBold) }}>{lang({ id: 'congratulations' })}</Text>
					<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.sub_1, fonts.medium), lineHeight: 22 }}>{lang({ id: 'new_badge' })}</Text>
				</View>

				<View style={{ gap: 12 }}>
					<Text style={{ textAlign: 'center', ...rootStyle.font(24, colors.main, fonts.extraBold) }}>{lang({ id: treeBadge?.title })}</Text>
					<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.sub_1, fonts.medium), lineHeight: 22 }}>{lang({ id: treeBadge?.desc })}</Text>
				</View>
			</View>


			<View style={[rootStyle.flex, { gap: 14, marginTop: 10 }]}>
				<Button style={{ flex: 1 }} onPress={closeAlertFunc}>{lang({ id: 'ok' })}</Button>
			</View>
		</View>
	);
}



const useStyle = () => {
	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			paddingBottom: insets?.bottom + 20,
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

	return { styles }
}

