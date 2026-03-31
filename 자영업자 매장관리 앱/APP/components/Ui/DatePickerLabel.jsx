import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

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
	format = 'YYYY.MM.DD',
	range = true,
	startDate,
	endDate,
	onPrev,
	onNext,
}) {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();
	const { width } = useSafeAreaFrame();

	const ref = useRef(null);

	return (
		<View style={styles.root}>
			{onPrev && (
				<TouchableOpacity style={styles.arrow} hitSlop={10} onPress={onPrev}>
					<Image source={images.arrow_left} style={rootStyle.default16} />
				</TouchableOpacity>
			)}

			<View style={styles.container}>
				<Image source={images.datepicker} style={rootStyle.default16} />
				{!range || startDate === endDate ? (
					<Text style={styles.date}>{dayjs(startDate).format(format)}</Text>
				) : (
					<Text style={styles.date}>{dayjs(startDate).format(format)} ~ {dayjs(endDate).format(format)}</Text>
				)}
			</View>

			{onNext && (
				<TouchableOpacity style={styles.arrow} hitSlop={10} onPress={onNext}>
					<Image source={images.arrow_right} style={rootStyle.default16} />
				</TouchableOpacity>
			)}
		</View>
	);
}


const useStyle = () => {

	const { width, height } = useSafeAreaFrame();

	const styles = StyleSheet.create({
		root: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 7,
			height: 40,
		},
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 4,
			backgroundColor: colors.fafafa,
			borderRadius: 4,
			height: '100%',
			paddingHorizontal: 15
		},
		date: {
			fontSize: 14,
			color: colors.text313131
		},
		arrow: {
			width: 28,
			height: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.fafafa,
			borderRadius: 4,
		}
	});

	return { styles }

}
