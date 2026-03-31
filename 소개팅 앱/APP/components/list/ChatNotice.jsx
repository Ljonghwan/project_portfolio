import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import dayjs from "dayjs";
import { Image } from 'expo-image';

import Text from '@/components/Text';
import AutoHeightImage from '@/components/AutoHeightImage';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function Component({ item, index }) {

	const [active, setActive] = useState(false);
	const [measured, setMeasured] = useState(false);

	const contentHeight = useRef(0);
	const height = useSharedValue(0);
	const rotate = useSharedValue(180);

	useEffect(() => {
		if (index === 0) {
			onToggle();
		}
	}, [index])
	const onToggle = () => {
		setActive(prev => {
			const next = !prev;
			height.value = withTiming(next ? contentHeight.current : 0, { duration: 100 });
			rotate.value = withTiming(next ? 0 : 180, { duration: 100 });
			return next;
		});
	};

	const onContentLayout = (e) => {
		if (measured) return;
		contentHeight.current = e.nativeEvent.layout.height;
		setMeasured(true); // 다시 렌더링 트리거

		if (index === 0) {
			onToggle();
		}
	};

	const animatedStyle = useAnimatedStyle(() => ({
		height: height.value,
		overflow: 'hidden',
	}));

	const rotateStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotate.value}deg` }],
	}));

	return (
		<AnimatedTouchable style={styles.container} activeOpacity={0.7} onPress={onToggle}>


			<View style={styles.top}>
				<View style={[rootStyle.flex, { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', gap: 4 }]}>
					{/* {dayjs(item?.createAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') && <Text style={styles.new}>NEW</Text>} */}
					<Text style={styles.title} numberOfLines={2}>{item?.title}</Text>
				</View>
				<Text style={styles.date}>{dayjs(item?.createAt).format('YYYY.MM.DD')}</Text>
				{/* <Animated.View style={[rotateStyle]} >
					<Image source={images.up} style={[rootStyle.default]} />
				</Animated.View> */}
			</View>

			{/* 보이는 애니메이션 영역 */}
			{active && (
				<View style={{}}>
					<View style={styles.bottom}>
						<Text style={styles.dataText}>{item?.content}</Text>
						<View style={{ gap: 8 }}>
							{item?.photoList?.map((x, i) => {
								return (
									<AutoHeightImage key={i} source={consts.s3Url + x} />
								)
							})}
						</View>
					</View>
				</View>
			)}


			{/* 렌더링 되지만 화면에 안 보이는 높이 측정용 View */}
			{/* {!measured && (
				<View
					style={styles.hidden}
					onLayout={onContentLayout}
				>
					<View style={styles.bottom}>
						<Text style={styles.dataText}>{item?.content}</Text>
						<View style={{ gap: 8 }}>
							{item?.photoList?.map((x, i) => {
								return (
									<AutoHeightImage key={"hidden_" + i} source={consts.s3Url + x} />
								)
							})}
						</View>
					</View>
				</View>
			)} */}

		</AnimatedTouchable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: colors.greyE
	},
	top: {
		gap: 8
	},
	title: {
		color: colors.dark,
		fontSize: 16,
		lineHeight: 24,
		fontFamily: fonts.semiBold,
		letterSpacing: -0.4,
		flex: 1
	},
	date: {
		color: colors.grey9,
		fontSize: 12,
		lineHeight: 16,
		letterSpacing: -0.3,
	},
	bottom: {
		borderTopColor: colors.greyE,
		borderTopWidth: 1,
		paddingTop: 20,
		marginTop: 20
	},
	dataText: {
		color: colors.dark,
		fontSize: 14,
		lineHeight: 20,
		letterSpacing: -0.35,
	},
	hidden: {
		position: 'absolute',
		top: 0,
		left: 0,
		opacity: 0,
	},

	new: {
		color: colors.red,
		fontSize: 12,
		lineHeight: 24,
		letterSpacing: -0.35,
	},
});
