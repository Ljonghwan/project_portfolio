import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function Component({ item }) {

	const [active, setActive] = useState(false);
	const [measured, setMeasured] = useState(false);

	const contentHeight = useRef(0);
	const height = useSharedValue(0);
	const rotate = useSharedValue(0);

	const onToggle = () => {
		setActive(prev => {
			const next = !prev;
			height.value = withTiming(next ? contentHeight.current : 0, { duration: 300 });
			rotate.value = withTiming(next ? 180 : 0, { duration: 300 });
			return next;
		});
	};

	const onContentLayout = (e) => {
		if (measured) return;
		contentHeight.current = e.nativeEvent.layout.height;
		setMeasured(true); // 다시 렌더링 트리거
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
				<Text style={styles.title} numberOfLines={1}>{item?.name}</Text>
				<Animated.View style={[rotateStyle]} >
					<Image source={images.down} style={[rootStyle.default]} />
				</Animated.View>
			</View>

			{/* 보이는 애니메이션 영역 */}
			<AnimatedView style={[animatedStyle]}>
				<View>
					<View style={styles.bottom}>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'drivers_license_1' })} {item?.license}</Text>
						</View>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'allowed_vehicle' })} {item?.allowed?.join(", ")}</Text>
						</View>
					</View>
				</View>
			</AnimatedView>

			{/* 렌더링 되지만 화면에 안 보이는 높이 측정용 View */}
			{!measured && (
				<View
					style={styles.hidden}
					onLayout={onContentLayout}
				>
					<View style={styles.bottom}>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'drivers_license_1' })} {item?.license}</Text>
						</View>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'allowed_vehicle' })} {item?.allowed?.join(", ")}</Text>
						</View>
					</View>
				</View>
			)}
		</AnimatedTouchable>
		
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 5,
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: colors.sub_1
	},
	top: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10
	},
	title: {
		color: colors.main,
		fontSize: 18,
		fontFamily: fonts.semiBold,
		letterSpacing: -0.36,
		flex: 1
	},
	bottom: {
		gap: 5,
		paddingTop: 5
	},
	data: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3
	},
	dataText: {
		color: colors.sub_1,
		fontSize: 16,
		fontFamily: fonts.medium,
		letterSpacing: -0.32,
	},
	hidden: {
		position: 'absolute',
		top: 0,
		left: 0,
		opacity: 0,
	}
});
