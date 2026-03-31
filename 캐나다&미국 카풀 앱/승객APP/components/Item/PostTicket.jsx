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

import API from '@/libs/api';

import { getDday, numDoler, sumPay, numFormat, getTreeBadge } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Component({ item, style, onPress=null }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { badges } = useConfig();

	const onPressFunc = () => {
		if(onPress) {
			onPress();
			return;
		}

		router.push({
			pathname: routes.postView,
			params: {
				idx: item?.idx,
			},
		})

	}

	return (
		<Pressable style={[styles.container, style]} activeOpacity={1} onPress={onPressFunc}>
			<View style={{ gap: 15 }}>
				
				<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start'  }]}>
					<Tag msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling'})} />
					<Text style={{ flex: 1, ...rootStyle.font(16, colors.main, fonts.medium) }}>{lang({ id: 'passenger' })} - {lang({ id: item?.status === 4 ? 'end_ride' : item?.status === 3 ? 'on_ride' : 'pending' })}</Text>
				</View>
				
				<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
					<View style={[rootStyle.default]}>
						<Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
					</View>
					<Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
						{dayjs(`${item?.start?.driveDate} ${item?.start?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
					</Text>
				</View>

				<View style={[ rootStyle.flex, { gap: 7, justifyContent: 'flex-start' } ]}>
					<Image source={item?.creator?.profile ? consts.s3Url + item?.creator?.profile : images.profile} style={styles.profile} />
					<Image source={images.dashed} style={rootStyle.dashed } />
					<View style={[rootStyle.flex, {  flex: 1  }]}>
						{item?.joins?.filter((x, i) => i < 5)?.map((x, i) => {
							return (
								<Image 
									key={`${item?.idx}_${i}` }
									source={x?.user?.profile ? consts.s3Url + x?.user?.profile : images.profile} 
									style={[
										styles.profile, 
										styles.profileFix,
										{
											left: i * (styles.profile.width - 10),
											zIndex: -i
										}
									]} 
								/>
							)
						})}
					</View>
				</View>

				<RoutesView style={{ gap: 15 }} way={[item?.start, item?.end]?.map(x => ( {...x, pay: null })) } />
				
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
			justifyContent: 'space-between',

			paddingVertical: 18,
			paddingHorizontal: 22,
		},
		profile: {
			width: 40,
			aspectRatio: 1/1,
			borderRadius: 1000,
			backgroundColor: colors.placeholder,
			borderWidth: 1,
			borderColor: colors.white
		},
		profileFix: {
			position: 'absolute',
			left: 0,
		}
	});

	return { styles }
}


