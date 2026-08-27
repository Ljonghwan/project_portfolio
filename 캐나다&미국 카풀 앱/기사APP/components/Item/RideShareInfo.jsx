import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	Easing,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import Text from '@/components/Text';
import Tag from '@/components/Tag';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { nameMasking, numDoler, getDistanceFromLatLonInKm } from '@/libs/utils';

import { useUser, useGps, useConfig } from '@/libs/store';



export default function Component({ item, style, onPress = () => { } }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { configOptions } = useConfig();
	const { lat, lng } = useGps();

	const progress = useSharedValue(1); // 1 = 100%, 0 = 0%

	const [distance, setDistance] = useState(0);
	const [boxHeight, setBoxHeight] = useState(0);

	const barStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scaleX: progress.value }], // 가로 방향으로만 줄어듦
		};
	});

	useEffect(() => {

		let calc = getDistanceFromLatLonInKm(lat, lng, item?.startLat, item?.startLng);
		setDistance(calc ? (calc / 1000).toFixed(2) : '-');
		// 처음엔 꽉 차있게
		progress.value = 1;

		// 10초 동안 왼쪽으로 줄어들기
		progress.value = withTiming(0, {
			duration: configOptions?.callLimit * 1000,
			easing: Easing.linear,
		});

	}, [item])


	const onLayout = (e) => {
		setBoxHeight(e.nativeEvent.layout.height)
	};

	return (
		<TouchableOpacity style={[styles.container, style]} activeOpacity={1} onPress={onPress}>


			<View style={{ gap: 10, paddingVertical: 18, paddingHorizontal: 22 }} >
				<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
					<Image source={consts.s3Url + item?.user?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />
					<View style={[{ flex: 1, gap: 2 }]}>
						<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{nameMasking(item?.user?.firstName + " " + item?.user?.lastName)}</Text>
						{item?.user?.reviewCount > 0 ? (
							<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 2 }]}>
								<Image source={images.star_red} style={rootStyle.default14} />
								<Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.text_popup), lineHeight: 22 }}>{item?.user?.avgRate}</Text>
								<Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>({item?.user?.reviewCount})</Text>
							</View>
						) : (
							<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>{lang({ id: 'no_ratings' })}</Text>
						)}
						
					</View>
				</View>

				<Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{distance} {lang({ id: 'km_away' })}</Text>

				<View style={{ gap: 15 }} onLayout={onLayout}>
					<View style={[styles.bar, { height: boxHeight - 30 }]} />
					<View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
						<View style={[rootStyle.default19]}>
							<Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
						</View>
						<Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.startName}</Text>
					</View>
					{item?.wayPoint?.map((x, i) => {
						return (
							<View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
								<View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
									<Text style={{ ...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i+1}</Text>
								</View>
								<Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{x?.name}</Text>
							</View>
						)
					})}
					
					<View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
						<View style={[rootStyle.default19]}>
							<Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
						</View>
						<Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.endName}</Text>
					</View>

				</View>

				<Text numberOfLines={1} style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>
					{lang({ id: 'estimated_fare' })} - {numDoler(item?.fare)}
				</Text>
			</View>


			<View style={styles.progressWrapper}>
				<Animated.View style={[styles.progressBar, barStyle]} />
			</View>

		</TouchableOpacity>
	);
}


const useStyle = () => {
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
		container: {
			// aspectRatio: rootStyle.card.aspectRatio,
			width: '100%',
			borderRadius: 12,
			backgroundColor: colors.white,
			shadowColor: colors.black,
			shadowOffset: { width: 0, height: 1 }, //: -1
			shadowOpacity: 0.15,
			shadowRadius: 5, // blur 정도
			elevation: 5, // Android용 
		},
		bar: {
			position: 'absolute',
			left: 19 / 2 - 1,
			top: 15,
			height: '100%',
			borderRightWidth: 1,
			borderRightColor: colors.taseta,
			borderStyle: Platform.OS === 'ios' ? 'solid' : 'dashed'
		},
		progressWrapper: {
			width: "100%",
			height: 15,
			backgroundColor: colors.sub_2,
			overflow: "hidden",

			borderBottomLeftRadius: 12,
			borderBottomRightRadius: 12,
		},
		progressBar: {
			flex: 1,
			backgroundColor: colors.taseta,
			transformOrigin: "left", // 중요! 왼쪽 기준으로 줄어들게 함
		},

	});

	return { styles }
}


