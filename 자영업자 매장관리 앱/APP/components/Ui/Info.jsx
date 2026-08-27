import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Pressable, Keyboard } from 'react-native';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
	FadeIn,
	FadeOut
} from "react-native-reanimated";
import {
	GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";
import { BlurView } from 'expo-blur';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useEtc } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

const ComponentSelect = forwardRef(({
	key = "",
	children,
	infoComponent = null,
	transformOrigin = 'top right',
	right = null,
	left = null,
	top = 0,
	mode='bottom',
	disabled=false,
	style,
	boxStyle,
	listStyle,
	textStyle,

}, ref) => {
	const insets = useSafeAreaInsets();
	const { width } = useSafeAreaFrame();

	const innerRef = useRef(null);

    const { transparencyEnabled, appActiveStatus, setAudioId } = useEtc();


	const [open, setOpen] = useState(false);
	const [view, setView] = useState(false);

	const [layout, setLayout] = useState({});
	const [boxLayout, setBoxLayout] = useState({});

	const menuOpacity = useSharedValue(1);

	const onPress = () => {
		console.log('!!!!!');
		if(disabled) return;
		
		onLayout();
		Keyboard.dismiss();

		setOpen(true);
		setView(true);

		menuOpacity.value = 0.5;
	};

	const onClose = () => {

		menuOpacity.value = 1;

		setView(false);
		setTimeout(() => {
			setOpen(false);
		}, 200)
	};

	// 부모 컴포넌트에서 사용할 수 있도록 함수 노출
	useImperativeHandle(ref, () => ({
		onPress,
		onClose,
		// 필요한 다른 함수들도 여기에 추가 가능
	}));

	const animatedMenuStyle = useAnimatedStyle(() => ({
		opacity: withTiming(menuOpacity.value, { duration: 200 }),
	}));


	const customEntering = (targetValues) => {
		'worklet';
		const animations = {
			transform: [
				{ scale: withSpring(1, { damping: 100, stiffness: 1000 }) },
			],
			opacity: withTiming(1, { duration: 200 }),
		};
		const initialValues = {
			transform: [
				{ scale: 0.2 }
			],
			opacity: 0,
		};
		return {
			initialValues,
			animations,
		};
	};

	const customExiting = (targetValues) => {
		'worklet';
		const animations = {
			opacity: withTiming(0, { duration: 200 }),
			transform: [
				{ scale: withTiming(0.5, { duration: 200 }) },
			],
		};
		const initialValues = {
			opacity: 1,
			transform: [
				{ scale: 1 }
			],
		};
		return {
			initialValues,
			animations,
		};
	};


	const onLayout = (e) => {

		innerRef.current?.measureInWindow((x, y, width, height) => {

			setLayout({ x, y, width, height });
		});

	};

	const onBoxLayout = (e) => {
		e.target.measure((x, y, width, height, pageX, pageY) => {

			setBoxLayout({ x, y, width, height });
		});
	};

	return (
		<View >
			<AnimatedTouchable key={key} ref={innerRef} onPress={onPress} onLayout={onLayout} style={[animatedMenuStyle]} hitSlop={10}>
				{children}
			</AnimatedTouchable>
			<OverKeyboardView visible={open}>
				<GestureHandlerRootView style={styles.fullScreen}>
					<Pressable
						style={styles.fullScreen}
						onPressIn={onClose}
					>
						<View style={styles.container}>
							{view && (
								<Animated.View
									entering={Platform.OS === 'ios' ? customEntering : FadeIn.duration(200)}
									exiting={Platform.OS === 'ios' ? customExiting : FadeOut.duration(200)}
									style={[
										styles.box,
										{
											top: layout?.y + layout?.height + (Platform.OS === 'ios' ? 0 : insets?.top) + (top) - (mode === 'top' ? (boxLayout?.height + layout?.height) : 0),
											right: !right ? width - (layout?.x + (layout?.width)) : right,
											left: left || 'auto',
											transformOrigin,
										},
										boxStyle
									]}
								>
									{infoComponent}
								</Animated.View>
							)}
						</View>
					</Pressable>
				</GestureHandlerRootView>
			</OverKeyboardView>
		</View>
	);
});

export default ComponentSelect;

const styles = StyleSheet.create({
	fullScreen: {
		flex: 1,
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: rootStyle.side,
		// opacity: 0.5
		// backgroundColor: colors.dimWhite
	},
	box: {
		position: 'absolute',
		minWidth: '100%',
		// backgroundColor: colors.white,
		
	},
	button: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		// height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		borderRadius: 4
	},
	buttonText: {
		fontSize: 12,
		lineHeight: 20,
		flexShrink: 1,
		color: colors.grey6,
		letterSpacing: -0.3,
		textAlign: 'center',
		fontFamily: fonts.semiBold,
	},
	colorOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255, 255, 255, 0.80)', // 원하는 색상 + 투명도
	},
});