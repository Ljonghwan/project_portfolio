import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { Image } from 'expo-image';
import { router } from "expo-router";

import Text from '@/components/Text';
import TextList from '@/components/TextList';
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
	badge,
	date
}) {

	const { styles } = useStyle();
	const { closeAlertFunc } = useAlert();

	const [disabled, setDisabled] = useState(true);
	const [load, setLoad] = useState(false);

	return (
		<View style={styles.root}>
			<View style={{ gap: 16 }}>
				<Text style={styles.title}>🎉 축하합니다! 🎉</Text>
				<Image source={consts.s3Url + badge?.image} style={styles.image} />
				<Text style={styles.message}>{badge?.congrats}</Text>
				<View>
					<TextList>조건: {badge?.comment}</TextList>
					<TextList>획득일: {dayjs(date).format('YYYY.MM.DD')}</TextList>
				</View>
			</View>

			<Button onPress={closeAlertFunc}>확인</Button>
		</View>
	);
}



const useStyle = () => {

	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingHorizontal: rootStyle.side,
			paddingTop: 32,
			paddingBottom: 16,
			gap: 32
		},
		title: {
			fontSize: 16,
			color: colors.black,
			fontFamily: fonts.bold,
			letterSpacing: -0.4,
			lineHeight: 22.4,
			textAlign: 'center'
		},
		image: {
			width: 135,
			aspectRatio: 1/1,
			alignSelf: 'center'
		},
		message: {
			fontSize: 14,
			color: colors.primaryBright,
			fontFamily: fonts.medium,
			lineHeight: 20,
			textAlign: 'center'
		}

	});

	return { styles }
}

