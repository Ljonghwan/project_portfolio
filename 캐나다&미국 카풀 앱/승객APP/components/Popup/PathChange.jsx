import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
	FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { router } from "expo-router";

import { Slider } from 'react-native-awesome-slider';
import * as Haptics from 'expo-haptics';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Select from '@/components/Select';
import TextArea from '@/components/TextArea';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	list=[],
	start,
	setStart,
	end,
	setEnd
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const [startSelect, setStartSelect] = useState(start?.idx);
	const [endSelect, setEndSelect] = useState(end?.idx);

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(startSelect && endSelect))
	}, [startSelect, endSelect])

	const onPress = async () => {

		setStart(list?.find(x => x?.idx == startSelect));
		setEnd(list?.find(x => x?.idx == endSelect));

		closeAlertFunc();
	};

	return (
		<View style={styles.root}>
			<View style={{ gap: 15 }}>
				<View style={{ gap: 5 }}>
					<Text style={styles.title}>{lang({ id: 'path_change' })}</Text>
					<Text style={styles.subTitle}>{lang({ id: 'please_select_your_departure_and_destination' })}</Text>
				</View>

				<View style={[{ gap: 15 }]}>
					<Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'departure' })}</Text>
					<Select
						state={startSelect}
						setState={(v) => {
							setStartSelect(v);
							setEndSelect(null);
						}}
						list={
							list?.filter((x, i) => i < list?.length - 1 )?.map((x, i) => {
								return { idx: x?.idx, title: x?.name }
							})
						}
						style={rootStyle.default}
						transformOrigin={'top center'}
                        right={'auto'}
					>
						<Button type={9} icon={'down'} pointerEvents="none">{list?.find(x => x?.idx == startSelect)?.name}</Button>
					</Select>
				</View>
				<View style={[{ gap: 15 }]}>
					<Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'destination' })}</Text>
					<Select
						state={endSelect}
						setState={setEndSelect}
						list={
							list?.filter((x, i) => i > list?.findIndex(x => x?.idx == startSelect) )?.map((x, i) => {
								return { idx: x?.idx, title: x?.name }
							})?.sort()
						}
						style={rootStyle.default}
						transformOrigin={'top center'}
                        right={'auto'}
					>
						<Button type={9} icon={'down'} pointerEvents="none">{endSelect ? list?.find(x => x?.idx == endSelect)?.name : lang({ id: 'selection' })}</Button>
					</Select>
				</View>

				<View style={[rootStyle.flex, { gap: 14, marginTop: 10 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'cancel' })}</Button>
					<Button style={{ flex: 1 }} onPress={onPress} disabled={disabled} load={load}>{lang({ id: 'apply' })}</Button>
				</View>
			</View>
		</View>
	);
}



const useStyle = () => {

	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingVertical: 33,
			paddingHorizontal: rootStyle.side,
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
		},
		thumb: {
			width: 16,
			height: 16,
			borderRadius: 1000,
			backgroundColor: colors.taseta_sub_2,
			borderWidth: 1,
			borderColor: colors.taseta
		},
		thumbText: {
			...rootStyle.font(16, colors.taseta, fonts.medium),
			position: 'absolute',
			top: -23,
			left: -17,
			width: 50,
			textAlign: 'center',
		},
		sliderBox: {
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 10
		},
		slider: {
			width: '100%'
		}
	});

	return { styles }
}

