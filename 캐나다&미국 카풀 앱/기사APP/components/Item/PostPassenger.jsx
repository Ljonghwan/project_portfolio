import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from "expo-router";

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

import { getDday, numDoler, sumPay, numFormat, getTreeBadge } from '@/libs/utils';
import { useUser, useAlert, useConfig } from '@/libs/store';
import routes from '@/libs/routes';


export default function Component({ item, style, onPress = null }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { badges } = useConfig();

	const [boxHeight, setBoxHeight] = useState(0);

	const [start, setStart] = useState(item?.itinerary?.[item?.startIndex || 0] || null);
	const [end, setEnd] = useState(item?.itinerary?.[item?.endIndex || item?.itinerary?.length - 1] || null);
	const [status, setStatus] = useState(true);
	const [treeBadge, setTreeBadge] = useState(null);
	const [fav, setFav] = useState(false);


	useEffect(() => {

		setStart(item?.itinerary?.[item?.startIndex || 0] || null);
		setEnd(item?.itinerary?.[item?.endIndex || item?.itinerary?.length - 1] || null);
		setStatus((item?.status === 1 && getDday(item?.driveAt) > 0));
		setTreeBadge(getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }));
		setFav(item?.isFav);

	}, [item])

	const onPressFunc = () => {
		if (onPress) {
			onPress();
			return;
		}

		router.push({
			pathname: routes.postFindDriver,
			params: {
				idx: item?.idx
			}
		})
	}
	const onLayout = (e) => {
		setBoxHeight(e.nativeEvent.layout.height)
	};

	return (
		<TouchableOpacity style={[styles.container, style]} activeOpacity={1} onPress={onPressFunc}>

			<View style={[styles.top]}>
				{/* <View style={[rootStyle.flex, { justifyContent: 'flex-end' }]}>
					<View style={[rootStyle.flex, { gap: 4 }]}>
						{item?.creator?.badges?.filter(x => badges?.filter(xx => xx?.type !== 1)?.map(xx => xx?.idx + "")?.includes(x))?.map((x, i) => {
							let badge = badges?.find(xx => xx?.idx == x);
							return (
								<Image key={i} source={consts.s3Url + badge?.imgPath} style={{ width: 26, height: 26, borderRadius: 1000 }} />
							)
						})}
					</View>
				</View> */}
				<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start', marginBottom: 15 }]}>
					{status ? <Tag msg={lang({ id: 'searching' })} /> : <Tag type={3} msg={lang({ id: 'matched' })} />}
					<Tag type={2} msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
				</View>
				<View style={{ gap: 15, marginBottom: 21 }} onLayout={onLayout}>
					<View style={[styles.bar, { height: boxHeight - 30 }]} />
					{item?.itinerary?.map((x, i) => {
						return (
							<View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
								<View style={[rootStyle.default19]}>
									<Image source={i === 0 ? images.start_point : images.end_point} style={{ width: '100%', height: '100%' }} />
								</View>
								<Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{x?.name}</Text>
							</View>
						)
					})}
				</View>
				<View style={{ gap: 15, marginBottom: 17 }} >
					<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
						<View style={[rootStyle.default]}>
							<Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
						</View>
						<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
							{dayjs(`${start?.driveDate} ${start?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
						</Text>
					</View>
				</View>
				<View style={{ gap: 12 }} >

					<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
						<Image source={consts.s3Url + item?.creator?.profile} style={{ width: 30, height: 30, borderRadius: 1000, backgroundColor: colors.placeholder }} />
						<View style={[rootStyle.flex, { flex: 1, gap: 4 }]}>
							<View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 4 }]}>
								{treeBadge && <Image source={consts.s3Url + treeBadge?.imgPath} style={{ width: 26, height: 26 }} />}
								<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(16, colors.main, fonts.semiBold) }}>{item?.creator?.firstName} {item?.creator?.lastName}</Text>
							</View>

							{item?.creator?.reviewCount || item?.creator?.rideCount ? (
								<View style={[rootStyle.flex, { alignItems: 'center', justifyContent: 'flex-start', gap: 2 }]}>

									<Image source={images.star_red} style={rootStyle.default14} />
									<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.text_popup), lineHeight: 22 }}>{item?.creator?.avgRate || 0}</Text>
									<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>({numFormat(item?.creator?.reviewCount || 0)})</Text>
								</View>
							) : (
								<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>{lang({ id: 'no_ratings' })}</Text>
							)}
						
						</View>
					</View>
				</View>
			</View>

			<View style={styles.bottom}>
				<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
					<Image source={images?.[`post_bag_${item?.luggage}`]} style={rootStyle.default30} />
					{item?.pet == 'yes' && <Image source={images.post_dog_yes} style={rootStyle.default30} />}
					{item?.smoke == 'yes' && <Image source={images.post_smoke_yes} style={rootStyle.default30} />}
					{item?.bicycle == 'yes' && <Image source={images.post_bike_yes} style={rootStyle.default30} />}
					{item?.snowboard == 'yes' && <Image source={images.post_snowboard_yes} style={rootStyle.default30} />}
					{item?.tire == 'winter' && <Image source={images.post_tire_winter} style={rootStyle.default30} />}
				</View>
				<View style={[rootStyle.flex, { justifyContent: 'flex-end' }]}>
					{item?.joinCount > 0 ? (
						<Text style={{ ...rootStyle.font(18, colors.text_popup, fonts.medium) }}>{item?.joinCount} {lang({ id: 'application' })}</Text>
					) : (
						<Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>{lang({ id: 'no_applicants_yet' })}</Text>
					)}
				</View>
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
			borderRadius: 12,
			backgroundColor: colors.white,
			shadowColor: colors.black,
			shadowOffset: { width: 0, height: 1 }, //: -1
			shadowOpacity: 0.15,
			shadowRadius: 5, // blur 정도
			elevation: 5, // Android용 
		},
		top: {
			paddingVertical: 18,
			paddingHorizontal: 22,
			borderBottomColor: colors.sub_2,
			borderBottomWidth: 1
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
		bottom: {
			paddingVertical: 18,
			paddingHorizontal: 22,
			gap: 12
		},
	});

	return { styles }
}


