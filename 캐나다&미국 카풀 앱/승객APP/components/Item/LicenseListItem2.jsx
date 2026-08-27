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

export default function Component({ item, onPress=()=>{} }) {

	const [active, setActive] = useState(false);
	const [measured, setMeasured] = useState(false);

	const contentHeight = useRef(0);
	const height = useSharedValue(0);
	const rotate = useSharedValue(0);

	const onToggle = () => {
		if(!item) {
			onPress();
			return;
		}

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
				<Text style={styles.title} numberOfLines={1}>{lang({ id: item ? 'check_eligibility' : 'get_location' })}</Text>
				<Animated.View style={[rotateStyle]} >
					<Image source={item ? images.down_fill : images.reload_gps} style={[rootStyle.default]} />
				</Animated.View>
			</View>

			{/* 보이는 애니메이션 영역 */}
			<AnimatedView style={[animatedStyle]}>
				<View>
					<View style={styles.bottom}>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'drivers_license_1' })} {item?.license || 'Invalid'}</Text>
						</View>
						<View style={styles.data}>
							<Text style={styles.dataText}>{lang({ id: 'allowed_vehicle' })} {item?.allowed?.join(", ") || 'Invalid'}</Text>
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
		paddingVertical: 14,
		paddingHorizontal: 22,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.taseta
	},
	top: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10
	},
	title: {
		color: colors.taseta,
		fontSize: 18,
		fontFamily: fonts.medium,
		flex: 1
	},
	bottom: {
		gap: 5,
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: colors.taseta
	},
	data: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3
	},
	dataText: {
		color: colors.taseta,
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
