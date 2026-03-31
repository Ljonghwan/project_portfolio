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
import Radio from '@/components/Radio';
import Input from '@/components/Input';

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
	value=0,
	pay=0,
	onSubmit = () => { }
}) {
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	const { country } = useLang();

	const iref = useRef();

	const [type, setType] = useState(value > 0 ? 2 : 1);
	const [state, setState] = useState(value || "");

	const [load, setLoad] = useState(false);

	useEffect(() => {
		if (type === 2) iref.current.focus();
		else setState(Math.min(Math.floor(pay * 100 * 0.2), mbData?.mileage));
	}, [type])

	useEffect(() => {
		if(state > Math.min(Math.floor(pay * 100 * 0.2), mbData?.mileage)) setState(Math.min(Math.floor(pay * 100 * 0.2), mbData?.mileage));
	}, [state])

	return (
		<View style={styles.root}>
			<View style={{ gap: 11 }}>
				<Text style={{ textAlign: 'center', ...rootStyle.font(30, colors.main, fonts.extraBold) }}>{lang({ id: 'apply_mileage' })}</Text>
				<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{lang({ id: 'use_taseta_for' })}</Text>
				<Text style={{ textAlign: 'center', ...rootStyle.font(16, colors.taseta, fonts.medium) }}>{lang({ id: '1000_mileage_1' })}</Text>
			</View>

			<View style={[{ gap: 14 }]}>
				<View style={{ gap: 3 }}>
					<Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'my_accumulated_milea' })}</Text>
					<Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>
						<Text style={{ ...rootStyle.font(30, colors.main, fonts.extraBold), letterSpacing: -0.6 }}>{numFormat(mbData?.mileage)} </Text>
						{lang({ id: 'mileage' })}
					</Text>
				</View>
				<View style={{ gap: 3 }}>
					<Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>{lang({ id: 'remaining_mileage' })}</Text>
					<Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
						<Text style={{ ...rootStyle.font(30, colors.sub_1, fonts.extraBold), letterSpacing: -0.6 }}>{numFormat(mbData?.mileage - (state*1))} </Text>
						{lang({ id: 'mileage' })}
					</Text>
				</View>

				<Radio
					state={type}
					setState={setType}
					list={[
						{ idx: 1, title: lang({ id: 'use_it_all' }) },
						{ idx: 2, title: lang({ id: 'enter_directly' }) }
					]}
				/>

				<Input
					iref={iref}
					name={'state'}
					valid={'numberFormat'}
					state={state}
					setState={setState}
					placeholder={lang({ id: 'how_much_discount' })}
					maxLength={12}
					readOnly={type === 1}
					returnKeyType={"done"}
					blurOnSubmit={false}
				/>

				<View style={[rootStyle.flex, { gap: 14, marginTop: 10 }]}>
					<Button type={2} style={{ flex: 1 }} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
					<Button style={{ flex: 1 }} onPress={() => {
						closeAlertFunc();
						setTimeout(() => {
							onSubmit(state)
						}, 300)
					}}>{lang({ id: 'apply' })}</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 40,
		paddingHorizontal: rootStyle.side,
		gap: 30
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