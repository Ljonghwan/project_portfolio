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
	const { country, setCountry } = useLang();
	
	const [ countryState, setCountryState ] = useState(country);
    const [ load, setLoad ] = useState(false);

	useEffect(() => {
		setCountryState(country)
	}, [country])

	const onSubmit = async () => {

  		let sender = {
			lang: countryState
		}
		const { data, error } = await API.post('/v2/my/setLang', sender);

		setCountry(countryState);
		closeAlertFunc();
	};
	

	return (
		<View style={styles.root}>
{/* 
			<TouchableOpacity style={styles.top} hitSlop={10} onPress={closeAlertFunc}>
				<Image source={images.exit} style={rootStyle.default}/>
			</TouchableOpacity>
			 */}
			<View style={{ gap: 21 }}>
				<Text style={styles.title}>{lang({ id: 'language_settings' })}</Text>
				<View style={{ gap: 14, paddingHorizontal: 70 }}>
					{consts.languageOptions.map((x, i) => {
						return (
							<Button key={i} type={x?.idx === countryState ? 1 : 2} onPress={()=>{ setCountryState(x?.idx) }}>{lang({ id: x?.title })}</Button>
						)
					})}
				</View>

				<View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 28 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
					<Button style={{ flex: 1 }} onPress={onSubmit}>{lang({ id: 'save' })}</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 40,
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