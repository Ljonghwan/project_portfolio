import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
} from "react-native-reanimated";

import dayjs from 'dayjs';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	type="",
	title = "",
	icon = images.select_down2,
	placeHolder = "선택",
	disabled = false,
	style = {}
}) {

	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const ref = useRef(null);

	return (
		type === 1 ? (
			<View style={[rootStyle.flex, { justifyContent: 'space-between', height: 44, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
				<Text style={{ ...rootStyle.font(14, (title ? colors.textPrimary : colors.textSecondary)) }} numberOfLines={1}>{title || placeHolder}</Text>
				<Image source={images.arrow_right} style={rootStyle.default20} />
			</View>
		) : (
			<View
				style={[styles.root, disabled && styles.disabled, style]}
			>
				<Text style={[styles.title, { color: title ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>{title || placeHolder}</Text>
				<Image source={icon} style={rootStyle.default} transition={100} />
			</View>
		)

	);
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		height: 48,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		gap: 10,
	},
	disabled: {
		backgroundColor: colors.disabled
	},
	title: {
		flex: 1,
		fontFamily: fonts.regular,
		fontSize: 16,
		color: colors.textPrimary,
	}

});
