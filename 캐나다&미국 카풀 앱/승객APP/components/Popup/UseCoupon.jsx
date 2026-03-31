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
	item
}) {	
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	const { country } = useLang();
	
	const [ success, setSuccess ] = useState(false);
    const [ load, setLoad ] = useState(false);

	const onSubmit = async (v) => {
		setLoad(true);

		let sender = {
			idx: item?.idx
		}
		
		const { data, error } = await API.post('/v2/my/couponUse', sender);
		
		reload();

		setTimeout(() => {

			setLoad(false);

			if (error) {
				closeAlertFunc();
				ToastMessage(lang({ id: error?.message }), { type: 'error' });
				return;
			}
			
			setSuccess(true);

		}, consts.apiDelay)
	};
	
	return (
		<View>
			{load && <Loading style={{ backgroundColor: colors.dimWhite, paddingBottom: 0 }} color={colors.black} fixed /> }

			<View style={styles.root}>
				{!success ? (
					<View style={{ gap: 21 }}>
						<Text style={styles.title}>{lang({ id: 'use_this_coupon' })}</Text>
						<View style={{ gap: 10, paddingHorizontal: 28 }}>
							<View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
								<Text style={styles.label}>{lang({ id: 'coupon' })}</Text>
								<Text style={styles.comment}>{item?.title?.[country]}</Text>
							</View>
							<View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
								<Text style={styles.label}>{lang({ id: 'credit' })}</Text>
								<Text style={styles.comment}>{numFormat(item?.point)} {lang({ id: 'mileage_points' })}</Text>
							</View>
						</View>

						<View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 28 }]}>
							<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'cancel' })}</Button>
							<Button style={{ flex: 1 }} onPress={onSubmit}>{lang({ id: 'apply' })}</Button>
						</View>
					</View>
				) : (
					<View style={{ gap: 21 }}>
						<Text style={styles.title}>{lang({ id: 'coupon_applied' })}</Text>
						<View style={{ gap: 10, paddingHorizontal: 28 }}>
							<View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
								<Text style={styles.label}>{lang({ id: 'your_mileage' })}</Text>
								<Text style={[styles.comment, { color: colors.taseta }]}>{numFormat(mbData?.mileage)} {lang({ id: 'mileage' })}</Text>
							</View>
						</View>

						<View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 28 }]}>
							<Button style={{ width: 130 }} onPress={closeAlertFunc}>{lang({ id: 'ok' })}</Button>
						</View>
					</View>
				)}
				
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 33,
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