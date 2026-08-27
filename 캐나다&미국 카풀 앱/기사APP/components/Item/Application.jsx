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

	return (
		<Pressable style={[styles.container, style]} activeOpacity={1} onPress={onPress}>
			<View style={[styles.top]}>
				<Text style={{...rootStyle.font(20, colors.main, fonts.medium)}} numberOfLines={1}>{lang({ id: item?.driverType === 1 ? 'carpool_driver_application' : 'ride_share_driver_application'})}</Text>

				<View style={{ flex: 1, gap: 15 }}>
					<View style={styles.list}>
						<Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>
						<Text numberOfLines={1} style={styles.content}>{item?.carType}</Text>
					</View>
					<View style={styles.list}>
						<Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>
						<Text numberOfLines={1} style={styles.content}>{item?.carNumber}</Text>
					</View>
					<View style={styles.list}>
						<Text style={styles.label}>{lang({ id: 'application_date' })}</Text>
						<Text numberOfLines={1} style={styles.content}>{dayjs(item?.createAt).format('MMMM DD, YYYY')}</Text>
					</View>
					
					
					<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-end' }]}>
						{
							item?.status === 4 ? <Tag type={3} msg={lang({ id: 'declined' })} />
							: item?.status === 3 ? <Tag type={4} msg={lang({ id: 'approved' })} />
							: <Tag type={1} msg={lang({ id: 'in_progress' })} />
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
			gap: 18
		},
		list: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10
        },
        label: {
            ...rootStyle.font(16, colors.sub_1, fonts.medium)
        },
        content: {
            ...rootStyle.font(16, colors.main),
            flexShrink: 1,
            textAlign: 'right',
        },
	});

	return { styles }
}


