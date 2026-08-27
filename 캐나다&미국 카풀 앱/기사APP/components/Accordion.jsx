import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Pressable } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

function AccordionItem({
	active,
	item,
	type = "1",
	onPress=()=>{}
}) {

	return (
		<>
			<Pressable
				style={[styles.item, active && styles.itemActive ]}
				onPress={() => {
					onPress(item?.idx)
				}}
			>
				<View style={styles.top}>
					<Text style={[ styles.title, active && styles.titleActive ]}>{item?.title}</Text>
					<Image source={images.check_white} style={rootStyle.default} />
				</View>

				{active && (
					<View style={styles.bottom} >
						<Text style={[ styles.message ]}>{item?.message}</Text>
					</View>
				)}
				
			</Pressable>
		</>
	);
}

export default function Component({
	list = [],
	value,
	setValue,
	disabled=false
}) {
	const onPress = (v) => {
		if(disabled) return;
		
		console.log('v', v);
		setValue(v);
	};

	return (
		<View style={styles.container}>
			{list?.map((x, i) => {
				return (
					<AccordionItem
						key={i}
						active={value === x?.idx}
						item={x}
						onPress={onPress}
					/>
				)
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 13
	},
	item: {
		gap: 20,
		paddingHorizontal: 22,
		paddingVertical: 13,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.main,
		backgroundColor: colors.white
	},
	itemActive: {
		borderColor: colors.taseta,
		backgroundColor: colors.taseta
	},
	top: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	bottom: {

	},
	title: {
		color: colors.main,
		fontSize: 18,
		lineHeight: 22,
		fontFamily: fonts.semiBold,
		letterSpacing: -0.36,
	},
	titleActive: {
		color: colors.taseta_sub_2
	},
	message: {
		color: colors.taseta_sub_2,
		fontSize: 16,
		lineHeight: 26,
		fontFamily: fonts.medium,
		letterSpacing: -0.32,
	}
});