import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight } from 'react-native-reanimated';
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

import { useUser, useAlert } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	value,
	onDelete,
	onSubmit
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

	const [comment, setComment] = useState(value?.comment || "");

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

	const onChanged = (v) => {
		setComment(v);
	}

	return (
		<View style={styles.root}>
			<View style={{ gap: 20 }}>
				<Text style={styles.title}>메모</Text>
				<View style={{ gap: 8 }}>
					<View style={[styles.inputWrap]}>
						<BottomSheetTextInput
							name={'comment'}
							value={comment}
							placeholder={`특이사항 및 메모가 있다면 남겨주세요`}
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
					</View>
					<Text style={styles.max}>{comment?.length}/200</Text>
				</View>
			</View>
			
			<View style={[rootStyle.flex, { gap: 4 }]}>
				{value?.idx && <Button type={'delete'} style={{ flex: 1 }} onPress={onDelete}>삭제</Button>}
				<Button style={{ flex: 1 }} onPress={() => onSubmit(comment)}>저장</Button>
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
		title: {
			fontSize: 24,
			color: colors.textPrimary,
			fontFamily: fonts.semiBold,
			lineHeight: 34,
			letterSpacing: -0.6
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

