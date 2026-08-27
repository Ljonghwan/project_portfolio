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

import { useUser, useAlert } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
	item
}) {	
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	
    const [ load, setLoad ] = useState(false);

	const onPress = async (v) => {
		setLoad(true);
		setTimeout(() => {

			setLoad(false);
			closeAlertFunc();


		}, consts.apiDelay)
		return;
		
		let sender = {
			idx: item?.idx
		}
		
		const { data, error } = await API.post('/v2/my/couponUse', sender);
		
		reload();

		setTimeout(() => {

			setLoad(false);
			closeAlertFunc();

			if (error) {
				ToastMessage(lang({ id: error?.message }), { type: 'error' });
				return;
			}

		}, consts.apiDelay)
	};

	return (
		<View>
			{load && <Loading style={{ backgroundColor: colors.dimWhite, paddingBottom: 0 }} color={colors.black} fixed /> }
			
			<View style={styles.root}>
				<View style={{ gap: 16 }}>
					<View style={{ gap: 5 }}>
						<Text style={styles.title}>{lang({ id: 'are_you_sure' })}</Text>
						<Text style={styles.subTitle}>{lang({ id: 'once_deleted_youll' })}</Text>
					</View>
					<View style={[rootStyle.flex, { gap: 14 }]}>
						<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'no' })}</Button>
						<Button style={{ flex: 1 }} onPress={()=>{ onPress(mbData?.rideShare ? 3 : 2 ) }}>{lang({ id: 'delete' })}</Button>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 28,
		paddingVertical: 33
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
	subTitle: {
		fontSize: 16,
		color: colors.sub_1,
		fontFamily: fonts.medium,
		textAlign: 'center',
		letterSpacing: -0.64
	}
});