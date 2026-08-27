import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from "expo-router";
import { DateTimePicker, Host } from '@expo/ui/swift-ui';

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

export default function Component({
	date,
	setDate
}) {	
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

    const [ value, setValue ] = useState(date || null);

	const onSubmit = async (v) => {
		setDate(value);
		closeAlertFunc();
	};
	
	return (
		<View style={styles.root}>
			<View style={{ gap: 25 }}>
				<View style={[{ gap: 15, paddingHorizontal: 20 }]}>
					<Host matchContents>
						<DateTimePicker
							title=""
							onDateSelected={date => {
								console.log('date' + Platform.OS, date);
								setValue(dayjs(date).startOf('day'));
								
							}}
							displayedComponents='date'
							initialDate={value ? dayjs(value).toISOString() : null}
							variant='graphical'
						/>
					</Host>
				</View>

				<View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 20 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
					<Button style={{ flex: 1 }} onPress={onSubmit}>{lang({ id: 'apply' })}</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 20,
	},
	
	top: {
		alignSelf: 'flex-end',
		marginBottom: 8
	},
	title: {
		fontSize: 20,
		color: colors.main,
		fontFamily: fonts.extraBold,
		textAlign: 'center',
	},
	label: {
		fontSize: 18,
		color: colors.main,
		fontFamily: fonts.medium,
		letterSpacing: -0.36
	}
});