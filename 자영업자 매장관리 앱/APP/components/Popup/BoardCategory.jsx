import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions, Keyboard } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { Image } from 'expo-image';
import { router } from "expo-router";

import BottomSheet, { BottomSheetTextInput } from "@gorhom/bottom-sheet";

import Text from '@/components/Text';
import TextArea from '@/components/TextArea';
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

import { useUser, useAlert, useAlertSheet, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	onSubmit
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();

	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const [selected, setSelected] = useState(null);

	const [disabled, setDisabled] = useState(true);
	const [load, setLoad] = useState(false);

	const [f, setF] = useState(false);

	useEffect(() => {
		setDisabled( !(selected) );
	}, [selected])

	const onSubmitAlert = () => {
		onSubmit( selected );
	}
	
	return (
		<View style={styles.root}>

			<Animated.View style={{ gap: 16 }}>
				<View style={{ gap: 8 }}>
					<Text style={{ ...rootStyle.font(20, colors.black, fonts.bold) }}>카테고리</Text>
				</View>
				<View>
					{configOptions?.boardCategory?.map((x, i) => {
						return (
							<TouchableOpacity key={i} activeOpacity={0.7} style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 12 }]} onPress={() => setSelected(x?.idx)}>
								<Text style={{ ...rootStyle.font(15, colors.black) }}>{x?.title}</Text>
								<Image source={selected === x?.idx ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
							</TouchableOpacity>
						)
					})}
				</View>
			</Animated.View>
		

			<View style={[rootStyle.flex, { gap: 4 }]}>
				<Button disabled={disabled} load={load} style={{ flex: 1 }} onPress={onSubmitAlert}>등록</Button>
			</View>
		</View>
	);
}



const useStyle = () => {

	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingHorizontal: rootStyle.side,
			paddingBottom: insets?.bottom + 20,
			gap: 32
		},

		inputWrap: {
			flex: 1,
			alignSelf: 'stretch',
			flexDirection: 'row',
			gap: 4,
			height: 150,
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderRadius: 8,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.white
		},
		input: {
			flex: 1,
			color: colors.dark,
			fontFamily: fonts.regular,
		},
		max: {
			fontSize: 14,
			color: colors.textSecondary,
			lineHeight: 20,
			letterSpacing: -0.35,
			textAlign: 'right'
		}
	});

	return { styles }
}

