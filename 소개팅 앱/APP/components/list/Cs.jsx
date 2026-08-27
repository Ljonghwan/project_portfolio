import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import dayjs from 'dayjs';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import { imageViewer } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function Component({ item }) {

    const { styles } = useStyle();

	const [active, setActive] = useState(false);
	const [measured, setMeasured] = useState(false);

	const contentHeight = useRef(0);
	const height = useSharedValue(0);
	const rotate = useSharedValue(0);

	const onToggle = () => {
		setActive(prev => {
			const next = !prev;
			height.value = withTiming(next ? contentHeight.current : 0, { duration: 100 });
			rotate.value = withTiming(next ? 180 : 0, { duration: 100 });
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
				<View style={{ flex: 1, gap: 4 }}>
					<Text style={styles.listItemTitle} numberOfLines={2}>[{item?.type}] {item?.title}</Text>
					<Text style={styles.listItemDate}>{dayjs(item?.createAt).format('YYYY.MM.DD')}</Text>
				</View>

				{item?.answer ? (
					<View style={styles.button1}>
						<Text style={styles.button1Text}>답변완료</Text>
					</View>
				) : (
					<View style={styles.button2}>
						<Text style={styles.button2Text}>미답변</Text>
					</View>
				)}
				
				{/* <Animated.View style={[rotateStyle]} >
					<Image source={images.up} style={[rootStyle.default]} />
				</Animated.View> */}
			</View>

			{/* 보이는 애니메이션 영역 */}
			<AnimatedView style={[animatedStyle]}>
				<View style={styles.bottom}>
					<Text style={styles.dataText}>{item?.content}</Text>
					{item?.file && (
						<TouchableOpacity onPress={() => imageViewer({ index: 0, list: [item?.file] })}>
							<Image source={consts.s3Url + item?.file} style={styles.listItemImage}/>
						</TouchableOpacity>
					)}
					{item?.answer && (
						<View style={styles.answer}>
							<Image source={images.answer} style={rootStyle.default20} />

							<View style={{ flex: 1, gap: 4 }}>
								<Text style={[styles.dataText]}>{item?.answer}</Text>
								<Text style={styles.listItemDate}>{dayjs(item?.updateAt).format('YYYY.MM.DD')}</Text>
							</View>
						</View>
					)}
				</View>
			</AnimatedView>

			{/* 렌더링 되지만 화면에 안 보이는 높이 측정용 View */}
			{!measured && (
				<View
					style={styles.hidden}
					onLayout={onContentLayout}
				>
					<View style={styles.bottom}>
						<Text style={styles.dataText}>{item?.content}</Text>
						{item?.file && (
							<TouchableOpacity onPress={() => imageViewer()}>
								<Image source={consts.s3Url + item?.file} style={styles.listItemImage}/>
							</TouchableOpacity>
						)}
						{item?.answer && (
							<View style={styles.answer}>
								<Image source={images.answer} style={rootStyle.default20} />

								<View style={{ flex: 1, gap: 4 }}>
									<Text style={[styles.dataText]}>{item?.answer}</Text>
									<Text style={styles.listItemDate}>{dayjs(item?.updateAt).format('YYYY.MM.DD')}</Text>
								</View>
							</View>
						)}
					</View>
				</View>
			)}
		</AnimatedTouchable>
	);
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    // Dimensions.get('window').width
	
	const styles = StyleSheet.create({
		container: {
			flex: 1,
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
		listItemTitle: {
			fontFamily: fonts.semiBold,
			fontSize: 16,
			lineHeight: 20,
			color: colors.dark,
		},
		listItemDate: {
			fontSize: 14,
			fontFamily: fonts.pretendardRegular,
			color: '#999',
		},
		listItemImage: {
			width: ( width - 40 - 9) / 3, // 전체 가로길이 - 양쪽 padding 20씩 * 2 - 사이 gap 4 * 2 
			aspectRatio: "1/1",
			borderRadius: 8,
			backgroundColor: colors.placeholder,
		},
		button1: {
			height: 36,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: 12,
			backgroundColor: colors.main2,
			borderRadius: 8
		},
		button1Text: {
			fontSize: 14,
			lineHeight: 20,
			letterSpacing: -0.35,
			fontFamily: fonts.semiBold,
			color: colors.main,
		},
		button2: {
			height: 36,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: 12,
			backgroundColor: colors.greyE,
			borderRadius: 8
		},
		button2Text: {
			fontSize: 14,
			lineHeight: 20,
			letterSpacing: -0.35,
			fontFamily: fonts.semiBold,
			color: colors.grey6,
		},


		bottom: {
			marginTop: 20,
			gap: 20
		},
		answer: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: 12,
		},
		dataText: {
			color: colors.grey6,
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
	});

  
    return { styles }
}

