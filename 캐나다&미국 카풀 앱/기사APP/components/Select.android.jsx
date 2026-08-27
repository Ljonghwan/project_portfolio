import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Pressable, Modal } from 'react-native';

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function Component({
	key = "",
	state,
	setState = () => { },
	list = [],
	children,
	transformOrigin='top right',
	right=null,
}) {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const ref = useRef(null);

	const [open, setOpen] = useState(false);
	const [view, setView] = useState(false);

	const [layout, setLayout] = useState({});

	const menuOpacity = useSharedValue(1);

	const onPress = () => {
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

	const animatedMenuStyle = useAnimatedStyle(() => ({
		opacity: withTiming(menuOpacity.value, { duration: 200 }),
	}));


	const customEntering = (targetValues) => {
		'worklet';
		const animations = {
			// originX: withTiming(targetValues.targetOriginX, { duration: 300 }),
			opacity: withTiming(1, { duration: 200 }),
			transform: [
				{ scale: withSpring(1, { damping: 100, stiffness: 1000 }) },
			],
		};
		const initialValues = {
			// originX: -width,
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
			// originX: withTiming(targetValues.targetOriginX, { duration: 300 }),
			opacity: withTiming(0, { duration: 200 }),
			transform: [
				{ scale: withTiming(0, { duration: 200 } )},
			],
		};
		const initialValues = {
			// originX: -width,
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

		ref.current?.measureInWindow((x, y, width, height) => {
			console.log('e.nativeEvent.layout', x, y, width, height)

			setLayout({ x, y, width, height });
		});

	};

	return (
		<View>
			<AnimatedTouchable ref={ref} onPress={onPress} onLayout={onLayout} style={[animatedMenuStyle]}>
				{children}
			</AnimatedTouchable>
			<Modal 
				visible={open} 
				animationType={'none'}
				onRequestClose={onClose}
				transparent
				statusBarTranslucent={true}
				navigationBarTranslucent={true}
			>
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
										top: layout?.y + layout?.height + (Platform.OS === 'ios' ? 0 : insets?.top),
										right: !right ? width - (layout?.x + (layout?.width)) : 'auto',
										transformOrigin
									}
								]}
							>
								<View
									style={[ styles.blurView ]}
								>
									{list?.map((x, i) => {
										return (
											<Pressable
												key={key + i}
												style={[
													styles.button,
													{ borderBottomWidth: i < list?.length - 1 ? 1 : 0 }
												]}
												onPressIn={() => {
													console.log('press!!!');
													setState(x?.idx);
													onClose();
												}}
											>
												<Text 
													style={[
														styles.buttonText, 
														{ color: x?.role === 'destructive' ? 'red' : colors.black }
													]}
													numberOfLines={2}
												>
													{x?.title}
												</Text>
												<View style={rootStyle.default}>
													{x?.idx === state && (
														<Image source={images.checkmark} style={{ width: '100%', height: '100%' }} />
													)}
												</View>
											</Pressable>
											// <Button key={key + i} systemImage={x?.idx === state ? "checkmark" : null} >{x?.title}</Button>
										)
									})}
								</View>


							</Animated.View>
						)}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	fullScreen: {
		flex: 1,
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: rootStyle.side
		// opacity: 0.5
		// backgroundColor: colors.dimWhite
	},
	box: {
		position: 'absolute',
	},
	blurView: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.sub_2,
		minWidth: '50%',
		maxWidth: '100%',
		overflow: "hidden",
		backgroundColor: colors.sub_4,
		
	},
	button: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.sub_2,
		// height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 20
	},
	buttonText: {
		...rootStyle.font(18, colors.black),
		flexShrink: 1
	},
});