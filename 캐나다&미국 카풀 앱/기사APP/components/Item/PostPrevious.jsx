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

import RoutesView from '@/components/Post/RoutesView';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { getDday, numDoler, sumPay, numFormat, getTreeBadge } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Component({ item, style, onPress = () => { } }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { badges } = useConfig();

	const [start, setStart] = useState(item?.itinerary?.[0] || null);
	const [end, setEnd] = useState(item?.itinerary?.at(-1) || null);
	const [status, setStatus] = useState(true);
	const [treeBadge, setTreeBadge] = useState(null);

	useEffect(() => {

		setStatus( item?.status === 1 && (getDday(item?.driveAt) > 0 && (item?.seats - item?.joins?.length) > 0));
		setTreeBadge( getTreeBadge({ badges: badges, userBadges: item?.creator?.badges }) );

	}, [item])

	return (
		<Pressable style={[styles.container, style]} activeOpacity={1} onPress={onPress}>
			<View style={[styles.top]}>
				<View style={{ flex: 1, gap: 15 }}>
					{/* <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
						{status ? <Tag msg={lang({ id: 'recruitment' })} /> : <Tag type={3} msg={lang({ id: 'end_of_recruitment' })} />}
					</View> */}
					<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
						<View style={[rootStyle.default]}>
							<Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
						</View>
						<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
							{dayjs(`${start?.driveDate} ${start?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
						</Text>
					</View>

					<RoutesView way={item?.itinerary?.map(x => ({ ...x, pay: null }))} style={{ gap: 15 }} />
				</View>

				<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
					<Image source={images?.[`post_bag_${item?.luggage}`]} style={rootStyle.default30} />
					{item?.pet === 'yes' && <Image source={images.post_dog_yes} style={rootStyle.default30} />}
					{item?.smoke === 'yes' && <Image source={images.post_smoke_yes} style={rootStyle.default30} />}
					{item?.bicycle === 'yes' && <Image source={images.post_bike_yes} style={rootStyle.default30} />}
					{item?.snowboard === 'yes' && <Image source={images.post_snowboard_yes} style={rootStyle.default30} />}
					{item?.tire === 'winter' && <Image source={images.post_tire_winter} style={rootStyle.default30} />}
				</View>
				
			</View>

			{/* <View style={styles.bottom}>
				<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
					<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(18, colors.main, fonts.medium) }}>{item?.creator?.driverInfo?.carType || ''}</Text>
					<View style={[{ alignItems: 'flex-end', gap: 2 }]}>
						<Text numberOfLines={1} style={{ ...rootStyle.font(16, colors.main, fonts.semiBold) }}>
							{numDoler(sumPay({ itinerary: item?.itinerary, startIndex: 0, endIndex: item?.itinerary?.length - 1 }))}
						</Text>
					</View>
				</View>
			</View> */}

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
			justifyContent: 'space-between',
			gap: 18
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


