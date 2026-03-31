import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Pressable, Keyboard } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
} from "react-native-reanimated";
import {
	GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";

import Text from '@/components/Text';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

const ComponentSelect = forwardRef(({
	key = "",
	state,
	setState = () => { },
	onSubmitEditing = () => {},
	list = [],
	children,
	transformOrigin = 'top right',
	right = null,
	left = null,
	top = 0,
	mode='bottom',
	disabled=false,

	boxStyle,
	listStyle,
	textStyle,
}, ref) => {
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const innerRef = useRef(null);

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
			opacity: withTiming(1, { duration: 200 }),
			transform: [
				{ scale: withSpring(1, { damping: 100, stiffness: 1000 }) },
			],
		};
		const initialValues = {
			opacity: 0,
			transform: [
				{ scale: 0 }
			],
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
				{ scale: withTiming(0, { duration: 200 }) },
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
			console.log('e.nativeEvent.layout', x, y, width, height)

			setLayout({ x, y, width, height });
		});

	};

	const onBoxLayout = (e) => {
		e.target.measure((x, y, width, height, pageX, pageY) => {
			console.log('e.nativeEvent.layout', x, y, width, height)

			setBoxLayout({ x, y, width, height });
		});
	};

	return (
		<View>
			<AnimatedTouchable key={key} ref={innerRef} onPress={onPress} onLayout={onLayout} style={[animatedMenuStyle]}>
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
									entering={customEntering}
									exiting={customExiting}
									style={[
										styles.box,
										{
											top: layout?.y + layout?.height + (Platform.OS === 'ios' ? 0 : insets?.top) + (top) - (mode === 'top' ? (boxLayout?.height + layout?.height) : 0),
											right: !right ? width - (layout?.x + (layout?.width)) : right,
											left: left || 'auto',
											transformOrigin
										}
									]}
								>
									<View
										style={[styles.blurView, boxStyle]}
										onLayout={onBoxLayout} 
									>
										{list?.map((x, i) => {
											return (
												<Pressable
													key={key + i}
													style={[
														styles.button,
														x?.idx === state && {
															backgroundColor: colors.backgroundLight
														},
														listStyle
													]}
													onPressIn={() => {
														setState(x?.idx);
														onClose();
														onSubmitEditing();
													}}
												>

													{x?.role === 'add' && <Image source={images.add} style={rootStyle.default18} />}
													{x?.role === 'write' && <Image source={images.pen} style={rootStyle.default16} />}

													<Text
														style={[
															styles.buttonText,
															{ color: x?.role === 'destructive' ? 'red' : colors.text6C6C6C },
															textStyle
														]}
														numberOfLines={2}
													>
														{x?.title}
													</Text>
												</Pressable>
											)
										})}
									</View>


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
		backgroundColor: colors.white,
		borderRadius: 6,
		shadowColor: 'rgba(19, 48, 74, 1)',
		shadowOffset: { width: 0, height: 1 }, //: -1
		shadowOpacity: 0.15,
		shadowRadius: 30, // blur 정도
		elevation: 5, // Android용 


	},
	blurView: {
		borderRadius: 6,
		minWidth: '50%',
		maxWidth: '100%',
		overflow: "hidden",
		backgroundColor: colors.white,
		gap: 2,
		paddingHorizontal: 4,
		paddingVertical: 6
	},
	button: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		// height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		// justifyContent: 'center',
		gap: 10,
		borderRadius: 4
	},
	buttonText: {
		fontSize: 13,
		lineHeight: 20,
		flexShrink: 1
	},
});