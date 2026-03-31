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
	icon = images.select_down,
	placeHolder = "선택",
	disabled = false,
	style = {}
}) {

	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const ref = useRef(null);

	return (
		<View
            style={[styles.root, disabled && styles.disabled, style]}
        >
            <Text style={[styles.title]} numberOfLines={1}>{title || placeHolder}</Text>
            <Image source={icon} style={rootStyle.default14} transition={100} />
        </View>
	);
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 30,
		borderRadius: 12,
		borderWidth: 0.5,
		borderColor: colors.grey6,
		backgroundColor: colors.white,
		paddingHorizontal: 10,
		gap: 4,
	},
	disabled: {
		backgroundColor: colors.disabled
	},
	title: {
		fontFamily: fonts.semiBold,
		fontSize: 12,
		color: colors.grey6,
        letterSpacing: -0.3,
	}

});
