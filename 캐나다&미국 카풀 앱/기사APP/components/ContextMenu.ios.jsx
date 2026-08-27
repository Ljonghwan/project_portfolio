import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from "expo-router";
import { ContextMenu, Picker, Button } from '@expo/ui/swift-ui';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Radio from '@/components/Radio';
import InputDate from '@/components/InputDate';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useLang } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	state,
	setState = () => { },
	list = [],
	children
}) {
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
// default
// bordered
// plain
// borderedProminent
// borderless
	return (
		<ContextMenu style={{}}>
			<ContextMenu.Items>
				{list?.map((x, i) => {
					return (
						<Button key={i} systemImage={x?.idx === state ? "checkmark" : null} onPress={() => setState(x?.idx)}>{x?.title}</Button>
					)
				})}
			</ContextMenu.Items>
			<ContextMenu.Trigger>
				{children}
			</ContextMenu.Trigger>
		</ContextMenu>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 20,
	},

	top: {
		alignSelf: 'flex-end',
		marginBottom: 8
	},
	title: {
		fontSize: 20,
		color: colors.main,
		fontFamily: fonts.extraBold,
		textAlign: 'center',
	},
	label: {
		fontSize: 18,
		color: colors.main,
		fontFamily: fonts.medium,
		letterSpacing: -0.36
	}
});