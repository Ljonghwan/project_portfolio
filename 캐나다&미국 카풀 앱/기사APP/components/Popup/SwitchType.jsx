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
	list = [],
	value,
	setValue
}) {	
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	
    const [ load, setLoad ] = useState(false);

	const onPress = async (v) => {
		console.log('v', v);
		setLoad(true);

		const sender = { level: v }

		const { data, error } = await API.post('/v1/user/changeLevel', sender);

		closeAlertFunc();

		if (error) {
			ToastMessage(lang({ id: error?.message }), { type: 'error' });
			return;
		}

		reload();
		router.canDismiss() && router.dismissAll();
		router.replace(routes.introViewer);
		setTimeout(() => {
			router.replace(routes.tabs);
		}, 1000)
	};

	return (
		<View style={styles.root}>

			<TouchableOpacity style={styles.top} hitSlop={10} onPress={closeAlertFunc}>
				<Image source={images.exit} style={rootStyle.default}/>
			</TouchableOpacity>
			
			<View style={{ gap: 21 }}>
				<Text style={styles.title}>{lang({ id: 'do_you_want_2' })}</Text>
				<View style={{ gap: 14, paddingHorizontal: 15, paddingBottom: 15  }}>
					<Button type={1} onPress={()=>{ onPress(1) }}>{lang({ id: 'passenger' })}</Button>
					<Button disabled={!(mbData?.carpool || mbData?.rideShare)} onPress={()=>{ onPress(mbData?.rideShare ? 3 : 2 ) }}>{lang({ id: 'driver' })}</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		padding: 18
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
	}
});