import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

export default function Component({ item, style, onPress=()=>{} }) {

	const brand = consts.cardBrands.find(x => x?.idx === item?.cardName) || null;

	return (
		<TouchableOpacity activeOpacity={1} onPress={onPress}>
			<LinearGradient
				style={[
					styles.container, 
					style
				]} 
				colors={brand?.bg || colors.gradient3}
				start={{ x: 0, y: 0 }}
				end={{ x: 0.5, y: 1 }}
			>
				<TouchableOpacity style={styles.exit}>
					{/* <Image source={images.exit_card} style={rootStyle.default32}/> */}
					<Image source={brand?.logo} style={rootStyle.cardLogo}/>
				</TouchableOpacity>
				<View></View>
				<View style={{ gap: 5 }}>
					<Image source={images.card_chip} style={rootStyle.cardChip} />
					
				</View>

				{/* <View>
					<Text style={styles.title} numberOfLines={1}>2222</Text>
					<Image source={images.card_chip} style={rootStyle.cardChip} />
				</View> */}

				<View style={{ gap: 8 }}>
					<Text style={[styles.title, { color: brand?.color }]} numberOfLines={1}>✱✱✱✱ ✱✱✱✱ ✱✱✱✱ {item?.cardNum}</Text>
					<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4.5 }]}>
						<Text style={[styles.label, { color: brand?.subColor }]}>{lang({ id: 'valid_thru' })}</Text>
						<Text style={[styles.date, { color: brand?.color }]} numberOfLines={1}>{item?.cardExp}</Text>
					</View>
					
					{/* <Image source={brand?.logo} style={rootStyle.card}/> */}
				</View>
				

			</LinearGradient>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 15,
		width: 282,
		aspectRatio: rootStyle.card.aspectRatio,
		justifyContent: 'space-between',
		paddingHorizontal: 10,
		paddingLeft: 20,
		paddingVertical: 20,
		position: 'relative',
	},
	exit: {
		// alignSelf: 'flex-end'
		position: 'absolute',
		top: 7,
		right: 10
	},
	top: {
	},
	title: {
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: {width: 0, height: 0.5},
		textShadowRadius: 2,
		fontSize: 16,
		fontFamily: fonts.bold,
		letterSpacing: 0.764
	},
	label: {
		fontSize: 8,
		fontFamily: fonts.medium,
		lineHeight: 8
	},
	date: {
		fontSize: 14,
		fontFamily: fonts.bold, 
	},
});

