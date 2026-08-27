import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

import Text from '@/components/Text';

import fonts from '@/libs/fonts';
import images from '@/libs/images';
import colors from '@/libs/colors';

const CheckIcon = ({ checked }) => (
	<Image source={checked ? images.check_on : images.check_off} style={{ width: '100%', height: '100%' }} transition={50} />
);
const CheckIcon2 = ({ checked }) => (
	<Image source={checked ? images.check2_on : images.check2_off} style={{ width: '100%', height: '100%' }} transition={50} />
);

const ChevronRightIcon = () => (
	<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<Path
			d="M6 4L10 8L6 12"
			stroke="#8B95A1"
			strokeWidth="1"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Svg>
);

export default function Checkbox({
	type = 1,
	label,
	checked = false,
	onPress,
	onLink,
	labelStyle,
	containerStyle,
	checkboxStyle,
}) {
	return (
		<View style={styles.termItem}>
			<TouchableOpacity
				style={[styles.container, containerStyle]}
				onPress={onPress}
				activeOpacity={0.7}
				hitSlop={2}
			>
				<View style={[styles.checkbox, checked && styles.checkboxChecked, checkboxStyle]}>
					{type === 2 ? (
						<CheckIcon2 checked={checked} />
					) : (
						<CheckIcon checked={checked} />
					)}
				</View>
				{label && (
					<Text style={[styles.label, labelStyle]}>{label}</Text>
				)}
			</TouchableOpacity>
			
			{onLink && (
				<TouchableOpacity
					onPress={onLink}
					hitSlop={5}
				>
					<ChevronRightIcon />
				</TouchableOpacity>
			)}
			
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	termItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 6,
	},
	checkbox: {
		width: 18,
		aspectRatio: 1 / 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkboxChecked: {
	},
	label: {
		fontFamily: fonts.regular,
		fontSize: 14,
		lineHeight: 20,
		letterSpacing: -0.35,
		color: '#4E5968',
	},
});
