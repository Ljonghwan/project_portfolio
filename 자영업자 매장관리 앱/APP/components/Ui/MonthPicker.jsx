import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions, Pressable, ScrollView, TouchableOpacity, Modal } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import dayjs from 'dayjs';

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
import Button from '@/components/Button';

import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

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
	transformOrigin = 'top right',
	right = null,
	left = null,
}) {

	const { styles } = useStyle();

	const insets = useSafeAreaInsets();

	const ref = useRef(null);
	const scRef = useRef(null);

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

	const [open, setOpen] = useState(false);
	const [view, setView] = useState(false);

	const [layout, setLayout] = useState({});

	const menuOpacity = useSharedValue(1);

	const onPress = () => {
		sheetRef.current?.present();
	};

	const onClose = () => {
		sheetRef.current?.dismiss();
	};

	return (
		<View>
			<AnimatedTouchable key={key} ref={ref} onPress={onPress} style={[{ alignSelf: 'center' }]}>
				{children}
			</AnimatedTouchable>

			<BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >
				<View style={styles.root}>
					<View style={{ gap: 20 }}>
						<View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
							<Text style={styles.title}>월 이동</Text>
							<TouchableOpacity style={styles.exit} onPress={onClose}>
								<Image source={images.exit} style={rootStyle.default} />
							</TouchableOpacity>
						</View>
						<View style={{ gap: 8 }}>
							<Button type={10} onPress={() => {
								setState(dayjs().startOf('months').format('YYYY-MM-DD'));
								onClose();
							}}>이번 달</Button>
							<Button type={10} onPress={() => {
								setState(dayjs().startOf('months').subtract(3, 'months').format('YYYY-MM-DD'));
								onClose();
							}}>3개월 전</Button>
							<Button type={10} onPress={() => {
								setState(dayjs().startOf('months').subtract(1, 'year').format('YYYY-MM-DD'));
								onClose();
							}}>1년 전</Button>
						</View>
					</View>
				</View>
				
            </BottomSheetModalTemplate>

		</View>
	);
}

const useStyle = () => {

	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingHorizontal: rootStyle.side,
			paddingBottom: insets?.bottom + 20,
			gap: 32
		},
		title: {
			fontSize: 20,
			color: colors.textPrimary,
			fontFamily: fonts.semiBold,
			lineHeight: 34,
			letterSpacing: -0.6
		},
	
	});

	return { styles }
}

