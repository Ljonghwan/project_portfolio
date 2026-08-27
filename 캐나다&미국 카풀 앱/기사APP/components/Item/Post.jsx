import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import Text from '@/components/Text';
import Tag from '@/components/Tag';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { getDday, numDoler, sumPay, numFormat, getTreeBadge } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Component({ item, style }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { badges } = useConfig();

	const [start, setStart] = useState(item?.itinerary?.[0] || null);
	const [end, setEnd] = useState(item?.itinerary?.at(-1) || null);
	const [status, setStatus] = useState(true);
	const [treeBadge, setTreeBadge] = useState(null);

	const [boxHeight, setBoxHeight] = useState(0);

	useEffect(() => {

		setStart(item?.itinerary?.[0] || null);
		setEnd(item?.itinerary?.at(-1) || null);
		setStatus(( item?.status === 1 && getDday(item?.driveAt) > 0 && (item?.seats - item?.joinCount) > 0 ));
		setTreeBadge( getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }) );

	}, [item])


	
	const onPress = () => {
		router.push({
			pathname: routes.postView,
			params: {
				idx: item?.idx,
				startIndex: item?.startIndex,
				endIndex: item?.endIndex
			},
		})

	}
	const onLayout = (e) => {
		setBoxHeight(e.nativeEvent.layout.height)
	};

	return (
		<Pressable style={[styles.container, style]} activeOpacity={1} onPress={onPress}>
			<View style={[styles.top]}>
				<View style={{ flex: 1 }}>
					
					<View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between', marginBottom: 10 }]}>
						{status ? <Tag msg={lang({ id: 'recruitment' })} /> : <Tag type={3} msg={lang({ id: 'end_of_recruitment' })} />}
						
						<View style={[rootStyle.flex, { gap: 4 }]}>
							{item?.creator?.badges?.filter(x => badges?.filter(xx => xx?.type !== 1)?.map(xx => xx?.idx+"")?.includes(x))?.map((x, i) => {
								let badge = badges?.find(xx => xx?.idx == x);
								return (
									<Image key={i} source={consts.s3Url + badge?.imgPath} style={{ width: 26, height: 26, borderRadius: 1000 }} />
								)
							})}
						</View>
					</View>
					<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start', marginBottom: 15 }]}>
						{/* <Tag type={2} msg={item?.creator?.driverInfo?.carType || ''} /> */}
						<Tag type={2} msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling'})} />
						{item?.itinerary?.length > 2 && (
							<Tag type={2} msg={lang({ id: 'several_stops'}) } />
						)}
					</View>
					<View style={{ gap: 15, marginBottom: 21 }} onLayout={onLayout}>
						<View style={[styles.bar, { height: boxHeight - 30 }]} />
						<View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
							<View style={[rootStyle.default19]}>
								<Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
							</View>
							<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{start?.name}</Text>
						</View>

						{/* <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
							<View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
							</View>
							<Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>Perrine Bridge</Text>
						</View>
						*/}

						<View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
							<View style={[rootStyle.default19]}>
								<Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
							</View>
							<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{end?.name}</Text>
						</View>

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

									<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>{numFormat(item?.creator?.rideCount || 0)} {lang({ id: 'rides' })}</Text>
								</View>
							) : (
								<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>{lang({ id: 'no_ratings' })}</Text>
							)}
							
						</View>
					</View>
				</View>
			</View>

			<View style={styles.bottom}>
				<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
					<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
						<Image source={images?.[`post_bag_${item?.luggage}`]} style={rootStyle.default30} />
						{item?.pet === 'yes' && <Image source={images.post_dog_yes} style={rootStyle.default30} />}
						{item?.smoke === 'yes' && <Image source={images.post_smoke_yes} style={rootStyle.default30} />}
						{item?.bicycle === 'yes' && <Image source={images.post_bike_yes} style={rootStyle.default30} />}
						{item?.snowboard === 'yes' && <Image source={images.post_snowboard_yes} style={rootStyle.default30} />}
						{item?.tire === 'winter' && <Image source={images.post_tire_winter} style={rootStyle.default30} />}
					</View>
					{/* <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>$15.28</Text> */}
				</View>

				<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
					<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.creator?.driverInfo?.carType || ''}</Text>
					<View style={[{ alignItems: 'flex-end',  gap: 2 }]}>
						
						<Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.main, fonts.semiBold) }}>
							{numDoler( sumPay({ itinerary: item?.itinerary, startIndex: 0, endIndex: item?.itinerary?.length - 1, rate: item?.feeRate }) )}
						</Text>
						{status ? 
							<Text style={{ ...rootStyle.font(14, colors.text_popup, fonts.medium) }}>{item?.seats - item?.joinCount} {lang({ id: 'seat_left' })}</Text>
						: 
							<Text style={{ ...rootStyle.font(14, colors.text_popup, fonts.medium) }}>{lang({ id: (getDday(item?.driveAt) < 1 || item?.status === 2) < 1 ? 'end_of_recruitment' : 'trip_full' })}</Text>
						}
					</View>
				</View>
			</View>

		</Pressable>
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
			justifyContent: 'space-between'
		},
		top: {
			flex: 1,
			paddingVertical: 18,
			paddingHorizontal: 22,
			borderBottomColor: colors.sub_2,
			borderBottomWidth: 1,
			justifyContent: 'space-between'
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
			gap: 10

		},
	});

	return { styles }
}


