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
	value,
	onSubmit
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();

	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const [selected, setSelected] = useState(null);
	const [comment, setComment] = useState(value?.desc || "");

	const [disabled, setDisabled] = useState(true);
	const [load, setLoad] = useState(false);

	const [f, setF] = useState(false);

	const [view, setView] = useState(false);

	const borderColor = useSharedValue(styles.inputWrap.borderColor);
	const animatedStyle = useAnimatedStyle(() => {
		return {
			borderColor: withTiming(borderColor.value, { duration: 200 }),
		};
	});

	useEffect(() => {
		borderColor.value = f ? colors.primary : styles.inputWrap.borderColor;
	}, [f])

	useEffect(() => {
		setDisabled( !(selected && (selected !== 99) || (selected === 99 && comment?.trim()?.length > 4 )) );
	}, [selected, comment])

	const onChanged = (v) => {
		setComment(v);
	}

	const onSubmitAlert = () => {
		Keyboard.dismiss();
		onSubmit( selected === 99 ? comment : configOptions?.reportOptions?.find(x => x?.idx === selected)?.title );
	}
	
	return (
		<View style={styles.root}>

			{selected !== 99 ? (
				<Animated.View style={{ gap: 16 }}>
					<View style={{ gap: 8 }}>
						<Text style={{ ...rootStyle.font(20, colors.black, fonts.bold) }}>신고 사유</Text>
						<Text style={{ ...rootStyle.font(14, colors.text686B70, fonts.medium) }}>어떤 옵션을 선택해도 상대방은 이를 알 수 없습니다.</Text>
					</View>
					<View>
						{configOptions?.reportOptions?.map((x, i) => {
							return (
								<TouchableOpacity key={i} activeOpacity={0.7} style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 12, gap: 10 }]} onPress={() => setSelected(x?.idx)}>
									<Text style={{ ...rootStyle.font(15, colors.black), flexShrink: 1 }}>{x?.title}</Text>
									<Image source={selected === x?.idx ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
								</TouchableOpacity>
							)
						})}
					</View>
				</Animated.View>
			) : (
				<Animated.View key={selected} entering={FadeInRight} style={{ gap: 16 }}>
					<TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { gap: 2, alignSelf: 'flex-start', justifyContent: 'flex-start' }]} onPress={() => {
						Keyboard.dismiss();
						setComment("");
						setTimeout(() => {
							setSelected(null);
						}, Keyboard.isVisible() ? 200 : 0)
					}}>
						<Image source={images.back} style={rootStyle.default} transition={100} />
						<Text style={{ ...rootStyle.font(15, colors.black) }}>이전으로</Text>
					</TouchableOpacity>

					<View style={{ gap: 8 }}>
						<Animated.View style={[styles.inputWrap, animatedStyle]}>
							<BottomSheetTextInput
								name={'comment'}
								value={comment}
								placeholder={`신고 사유를 작성해 주세요`}
								onFocus={(event) => {
									setF(true);
								}}
								onBlur={() => {
									setF(false);
								}}
								onChangeText={onChanged}
								style={[styles.input]}
								placeholderTextColor={colors.textSecondary}
								maxLength={200}
								autoCapitalize={'none'}
								textContentType={'oneTimeCode'}
								multiline={true}
								allowFontScaling={false}
								textAlignVertical="top"
							/>
						</Animated.View>
						<Text style={styles.max}>{comment?.length}/200</Text>
					</View>
				</Animated.View>
			)}


			<View style={[rootStyle.flex, { gap: 4 }]}>
				<Button disabled={disabled} load={load} style={{ flex: 1 }} onPress={onSubmitAlert}>신고하기</Button>
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

