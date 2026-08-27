import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	Easing,
} from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({ item }) {
	const [active, setActive] = useState(false);
	const [showContent, setShowContent] = useState(false);
	
	const opacity = useSharedValue(0);
	const rotate = useSharedValue(180);

	const onToggle = () => {
		const next = !active;
		const config = {
			duration: 200,
			easing: Easing.bezier(0.4, 0, 0.2, 1),
		};
		
		if (next) {
			// 열기: 먼저 보여주고 → 애니메이션
			setShowContent(true);
			setActive(true);
			opacity.value = withTiming(1, config);
			rotate.value = withTiming(0, config);
		} else {
			// 닫기: 애니메이션 → 숨기기
			opacity.value = withTiming(0, { duration: 150 }, () => {
				// 애니메이션 끝나면 DOM에서 제거 (runOnJS 필요 없이 상태로 처리)
			});
			rotate.value = withTiming(180, config);
			setActive(false);
			// 약간의 딜레이 후 제거
			setTimeout(() => setShowContent(false), 150);
		}
	};

	const contentStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const rotateStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotate.value}deg` }],
	}));

	return (
		<AnimatedTouchable style={styles.container} activeOpacity={0.7} onPress={onToggle}>
			<View style={styles.top}>
				<Text style={styles.title} numberOfLines={1}>
					[{consts.faqOptions?.find(x => x.value === item?.type)?.title || '기타'}] {item?.title}
				</Text>
				<Animated.View style={rotateStyle}>
					<Image source={images.up} style={rootStyle.default} />
				</Animated.View>
			</View>

			{showContent && (
				<Animated.View style={contentStyle}>
					<View style={styles.bottom}>
						<Text style={styles.dataText}>{item?.content}</Text>
					</View>
				</Animated.View>
			)}
		</AnimatedTouchable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 8,
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: colors.greyE
	},
	top: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10
	},
	title: {
		color: colors.dark,
		fontSize: 16,
		lineHeight: 24,
		fontFamily: fonts.semiBold,
		letterSpacing: -0.4,
		flex: 1
	},
	bottom: {},
	dataText: {
		color: colors.grey6,
		fontSize: 14,
		lineHeight: 20,
		letterSpacing: -0.35,
	},
});