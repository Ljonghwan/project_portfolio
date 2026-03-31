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

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Select from '@/components/Select';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useConfig } from '@/libs/store';

import { numDoler, ToastMessage } from '@/libs/utils';

export default function Component({
	idx,
	status,
	onPress = () => { },
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { closeAlertFunc } = useAlert();
	const { configOptions } = useConfig();

	const [reason, setReason] = useState(null);
	const [refund, setRefund] = useState(null);

	const [load, setLoad] = useState(false);

	useEffect(() => {
		if(idx) dataFunc();
	}, [idx]);

	const dataFunc = async () => {

		let sender = {
			postIdx: idx,
		}

		console.log('sender', sender);

		const { data, error } = await API.post('/v2/passenger/post/cancelInfo', sender);

		console.log('data, error', data, error);
		setRefund(data);
	}

	const onPressFunc = async () => {
		closeAlertFunc();

		onPress(reason);
	};

	return (
		<View style={styles.root}>
			<View style={{ gap: 15 }}>
				<Text style={styles.title}>{lang({ id: 'cancel_request' })}</Text>
				{(refund && status !== 1) && (
					<View style={{ gap: 5 }}>
						<Text style={{ ...rootStyle.font(16, colors.text_popup, fonts.medium), textAlign: 'center' }}>{lang({ id: 'will_be_refunded' })?.replace("{percent}", `${refund?.refundRate * 100}%`)}</Text>
						<Text style={{ ...rootStyle.font(16, colors.text_popup, fonts.medium), textAlign: 'center' }}>
							{lang({ id: 'refund_amount' })} :
							<Text style={{ ...rootStyle.font(18, colors.text_popup, fonts.semiBold) }}> {numDoler(refund?.refundAmount)}</Text>
						</Text>
					</View>
				)}
				<Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: status === 1 ? 'are_you_sure_5' : 'canceling_now_may_1' })}</Text>
				
				<View style={{ gap: 8 }}>
					<Select
						state={reason}
						setState={(v) => {
							setReason(v)
						}}
						list={
							configOptions?.cancelPassenger?.map((x, i) => {
								return { idx: x, title: lang({ id: x }) }
							})
						}
						style={rootStyle.default}
						transformOrigin={'top center'}
                        right={'auto'}
					>
						<Button type={9} icon={'down'} pointerEvents="none">{lang({ id: reason ? reason : 'select_a_reason' })}</Button>
					</Select>
				</View>

				<View style={[rootStyle.flex, { gap: 14 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'no' })}</Button>
					<Button style={{ flex: 1 }} onPress={onPressFunc} disabled={!reason}>{lang({ id: 'cancel' })}</Button>
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
			width: '100%'
		}
	});

	return { styles }
}

