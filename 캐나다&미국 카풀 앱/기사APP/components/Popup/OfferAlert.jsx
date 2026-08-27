import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
	FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { router } from "expo-router";

import dayjs from 'dayjs';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Select from '@/components/Select';
import TextArea from '@/components/TextArea';

import RoutesView from '@/components/Post/RoutesView';

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
	way,
	start,
	onPress = () => { }
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const [load, setLoad] = useState(false);

	const onPressFunc = async () => {

		closeAlertFunc();

		onPress();
	};

	return (
		<View style={styles.root}>
			<View style={{ gap: 15 }}>
				<View style={{ gap: 5 }}>
					<Text style={styles.title}>{lang({ id: 'offer_ride' })}</Text>
					<Text style={styles.subTitle}>{lang({ id: 'would_you_like_to_offer' })}</Text>
				</View>

				<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
					<View style={[rootStyle.default]}>
						<Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
					</View>
					<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
						{dayjs(`${dayjs(start?.driveDate).format('YYYY-MM-DD')} ${dayjs(start?.driveTime).format('HH:mm')}`).format('MMM DD, YYYY, h:mm A')}
					</Text>
				</View>

				<RoutesView style={{ gap: 15 }} way={way} />

				<View style={[rootStyle.flex, { gap: 14, marginTop: 10 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'cancel' })}</Button>
					<Button style={{ flex: 1 }} onPress={onPressFunc}>{lang({ id: 'send' })}</Button>
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

