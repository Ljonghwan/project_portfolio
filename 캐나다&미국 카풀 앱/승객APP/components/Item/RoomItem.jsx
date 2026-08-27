import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSpring,
	Easing
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

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

import { getDday, numFormat, getFullDateFormat } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({ item, style, leaveAlert }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();
	const { openAlertFunc } = useAlert();
	const { badges } = useConfig();

	const swipeable = useRef();

	const [users, setUsers] = useState([]);

	useEffect(() => {

		setUsers(item?.members?.filter(x => x?.idx !== mbData?.idx) || []);

	}, [item])

	const onPress = () => {
		console.log({
			pathname: routes.chatRoom,
			params: {
				idx: item?.idx
			},
		})
		router.push({
			pathname: routes.chatRoom,
			params: {
				idx: item?.idx
			},
		})

	}

	const leaveAlertFunc = () => {
		swipeable?.current?.close();

		leaveAlert();

	}

	const RightAction = (prog, drag) => {
		const styleAnimation = useAnimatedStyle(() => {
			return {
				transform: [
					{
						translateX: withTiming(drag.value + styles.rightAction.width, {
							duration: 100,
							easing: Easing.out(Easing.exp),
						})
					}
				],
			};
		});

		return (
			<AnimatedTouchable style={[styles.rightAction, styleAnimation]} onPress={leaveAlertFunc}>
				<Image source={images.out} style={rootStyle.default} />
			</AnimatedTouchable>
		);
	}

	return (
		<Swipeable
			ref={swipeable}
			friction={2}
			overshootFriction={10}
			enableTrackpadTwoFingerGesture
			rightThreshold={40}
			renderRightActions={RightAction}
			containerStyle={{ paddingHorizontal: rootStyle.side }}
		>
			<Pressable style={[styles.container, style]} activeOpacity={1} onPress={onPress}>
				<View style={[rootStyle.flex, { width: 50, aspectRatio: 1 / 1, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }]}>
					{users?.length < 1 ? (
						<Image style={{ width: '100%', aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
					) : users?.length === 2 ? (
						<>
							{users?.map((x, i) => {
								return (
									<Image 
										key={`${item?.idx}-${x?.idx}`} 
										source={x?.profile ? consts.s3Url + x?.profile : images.profile} 
										style={[
											{ 
												width: 32, 
												aspectRatio: 1 / 1, 
												borderRadius: 1000, 
												backgroundColor: colors.placeholder,
												position: 'absolute',
											},
											i === 0 ? {
												top: 0,
												left: 0
											} : {
												bottom: 0,
												right: 0
											}
										]} 
									/>
								)
							})}
						</>
					) : (
						users?.filter((x, i) => i < 4)?.map((x, i) => {
							return (
								<Image key={`${item?.idx}-${x?.idx}`} source={x?.profile ? consts.s3Url + x?.profile : images.profile} style={{ width: users?.length > 1 ? 25 : 50, aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
							)
						})
					)}

				</View>

				<View style={{ flex: 1, gap: 7 }}>
					<View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 12 }]}>
						{item?.type === 1 ? (
							<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(16, colors.main, fonts.semiBold) }}>{users?.[0] ? `${users?.[0]?.firstName} ${users?.[0]?.lastName}` : lang({ id: 'unknown' })}</Text>
						) : (
							<View style={[rootStyle.flex, { flex: 1, gap: 2, justifyContent: 'flex-start' }]}>
								<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(14, colors.main, fonts.semiBold) }}>{users?.map(x => `${x?.firstName} ${x?.lastName}`)?.join(", ")}</Text>
								<Text style={{ ...rootStyle.font(14, colors.sub_1, fonts.semiBold) }}>{users?.length + 1}</Text>
							</View>
						)}

						<Text numberOfLines={1} style={{ ...rootStyle.font(12, colors.sub_1) }}>
							{getFullDateFormat(item?.lastMessageAt || item?.createAt, 2)}
						</Text>
					</View>
					<View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]}>
						<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(14, colors.main) }}>{item?.lastMessage || ""}</Text>
						{item?.badgeCount > 0 && (
							<View style={styles.count}>
								<Text style={styles.countText}>{numFormat(item?.badgeCount, 100)}</Text>
							</View>
						)}

					</View>
				</View>
			</Pressable>
		</Swipeable>


	);
}


const useStyle = () => {
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 13,
			paddingVertical: 12
		},
		count: {
			minWidth: 20,
			height: 20,
			paddingHorizontal: 4,
			backgroundColor: colors.text_popup,
			borderRadius: 100,
			alignItems: 'center',
			justifyContent: 'center',
		},
		countText: {
			fontFamily: fonts.medium,
			fontSize: 12,
			lineHeight: 20,
			color: colors.white,
		},
		rightAction: {
			width: 80,
			height: '100%',
			backgroundColor: colors.text_popup,
			alignItems: 'center',
			justifyContent: 'center'
		},
	});

	return { styles }
}


