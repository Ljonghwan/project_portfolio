import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Platform, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import { Rating } from '@kolking/react-native-rating';

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

import { getFullDateFormat, nameMasking } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Component({ item, style }) {

	const { styles } = useStyle();

	const { token, mbData, login, logout, reload } = useUser();

	return (
		<View style={[styles.container, style]} >
			<View style={{ gap: 8 }} >
				<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
					<Image source={consts.s3Url + item?.creator?.profile} style={{ width: 50, height: 50, borderRadius: 1000, backgroundColor: colors.placeholder }} />
					<View style={[rootStyle.flex, { flex: 1, gap: 10 }]}>
						<View style={{ flex: 1, gap: 3 }}>
							<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
								<Text numberOfLines={1} style={{ flexShrink: 1, ...rootStyle.font(16, colors.main, fonts.semiBold) }}>{nameMasking( item?.creator?.firstName + " " + item?.creator?.lastName )}</Text>
								<Text numberOfLines={1} style={{ ...rootStyle.font(14, colors.sub_1), lineHeight: 22 }}>{getFullDateFormat(item?.createAt)}</Text>
							</View>
							<Rating
								size={16}
								scale={1.1}
								rating={item?.rate}
								disabled={true}
								baseColor={colors.sub_3}
								fillColor={colors.taseta_sub_4}
								touchColor={colors.taseta_sub_4}
							/>
						</View>
					</View>
				</View>
				{item?.tags?.length > 0 && (
					<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5, flexWrap: 'wrap' }]}>
						{item?.tags?.map((x, i) => {
							return (
								<Tag key={i} type={4} msg={lang({ id: x, replace: { key: /\p{Extended_Pictographic}/gu, val: "" } }) } />
							)
						})}
					</View>
				)}
				<Text numberOfLines={3} style={{ ...rootStyle.font(16, colors.main), lineHeight: 22 }}>{item?.message}</Text>
			</View>
		</View>
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
			elevation: 5, // Android용 ,
			paddingHorizontal: 22,
			paddingVertical: 19
		},
		
	});

	return { styles }
}


