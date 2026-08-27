import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { router } from "expo-router";

import { Slider } from 'react-native-awesome-slider';
import * as Haptics from 'expo-haptics';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	onPress=() => {},
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();

	const progress = useSharedValue(12);
	const min = useSharedValue(1);
	const max = useSharedValue(24);

	const [km, setKm] = useState(12);
	const [load, setLoad] = useState(false);

	const onPressFunc = async (v) => {
		closeAlertFunc();

		onPress(km);
	};

	return (
		<View style={styles.root}>
			<View style={{ gap: 15 }}>
				<Text style={styles.title}>{lang({ id: 'join_carpool' })}</Text>
				<Text style={{...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center'}}>{lang({ id: 'have_you_reviewed' })}</Text>
				<Text style={{...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center'}}>{lang({ id: 'by_clicking_join_carpool' })}</Text>
				<Text style={{...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center'}}>{lang({ id: 'set_how_long_your_request' })}</Text>
				<View style={{ gap: 8, marginTop: 24 }}>
					<View style={styles.sliderBox}>
						<Slider
							hapticMode={'step'}
							style={styles.slider}
							containerStyle={{ borderRadius: 8 }}
							progress={progress}
							minimumValue={min}
							maximumValue={max}
							steps={max.value - min.value}
							forceSnapToStep={true}
							onValueChange={v => setKm(Math.ceil(v))}
							onHapticFeedback={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							}}
							bubble={v => Math.ceil(v) + "h"}
							panHitSlop={20}
							thumbWidth={16}
							sliderHeight={2}
							theme={{
								maximumTrackTintColor: colors.sub_2,
								minimumTrackTintColor: colors.taseta,
							}}
							renderThumb={() => (
								<View style={styles.thumb}>
									<Text style={styles.thumbText}>{Math.ceil(km)}h</Text>
								</View>
							)}

							renderMark={() => (null)}
							renderBubble={() => (null)}
						/>
					</View>

					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{min.value}h</Text>
						<Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{max.value}h</Text>
					</View>
				</View>

				<View style={[rootStyle.flex, { gap: 14 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
					<Button style={{ flex: 1 }} onPress={onPressFunc}>{lang({ id: 'join' })}</Button>
				</View>
			</View>
		</View>
	);
}



const useStyle = () => {

	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingVertical: 27,
			paddingHorizontal: rootStyle.side,
		},
		title: {
			fontSize: 22,
			color: colors.main,
			fontFamily: fonts.extraBold,
			textAlign: 'center',
		},
		thumb: {
			width: 16,
			height: 16,
			borderRadius: 1000,
			backgroundColor: colors.taseta_sub_2,
			borderWidth: 1,
			borderColor: colors.taseta
		},
		thumbText: {
			...rootStyle.font(16, colors.taseta, fonts.medium),
			position: 'absolute',
			top: -23,
			left: -17,
			width: 50,
			textAlign: 'center',
		},
		sliderBox: {
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 10
		},
		slider: {
			width: '100%',
			zIndex: 10000
		}
	});

	return { styles }
}

