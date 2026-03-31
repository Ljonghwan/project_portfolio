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

import DateTimePicker from '@react-native-community/datetimepicker';

// import { DateTimePicker, Host } from '@expo/ui/swift-ui';

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
	setDate,
	mode = 'time',
	minDate
}) {	
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

    const [ value, setValue ] = useState(date ? (mode === 'time' ? dayjs(dayjs().format('YYYY-MM-DD') + " " + date) : dayjs(date)) : dayjs());

	const onSubmit = async () => {
		console.log('value' + Platform.OS, value);
		setDate(value ? (mode === 'time' ? dayjs(value).format('HH:mm') : dayjs(value).format('YYYY-MM-DD')) : null);
		closeAlertFunc();
	};
	
	return (
		<View style={styles.root}>
			<View style={{ gap: 25 }}>
				<View style={[{ gap: 15,  }]}>
					<DateTimePicker
						onChange={(event, date) => {
							console.log('date' + Platform.OS, date);
							setValue(dayjs(date));
						}}
						value={dayjs(value).toDate()}
						mode={mode}
						display={'spinner'}
						minimumDate={minDate ? dayjs(minDate).toDate() : undefined}
					/>
					
					{/* <Host matchContents style={{  }}>
						<DateTimePicker
							title=""
							onDateSelected={date => {
								console.log('date' + Platform.OS, date);
								setValue(dayjs(date));
							}}
							displayedComponents={mode === 'time' ? 'hourAndMinute' : 'date'}
							initialDate={value ? dayjs(value).toISOString() : null}
							variant='wheel'
						/>
					</Host> */}
				</View>

				<View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 20 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>취소</Button>
					<Button style={{ flex: 1 }} onPress={onSubmit}>확인</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		paddingVertical: 20,
		
	},
	
});