import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions, Keyboard, Linking } from 'react-native';
import Animated, {
	FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { router } from "expo-router";

import { Slider } from 'react-native-awesome-slider';
import * as Haptics from 'expo-haptics';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import CheckBox from '@/components/CheckBox2';
import TextArea from '@/components/TextArea';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	dispatchIdx,
	postIdx
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const contentref = useRef(null);
	const [content, setContent] = useState("");

	const [view, setView] = useState(false);

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(content))
	}, [content])

	const onPress = async (v) => {
		Keyboard.dismiss();

		/*
			**API 연결필요** 운행중 기사 신고
			dispatchIdx
			postIdx
		*/
		setLoad(true);

		const sender = {
			dispatchIdx: dispatchIdx,
			postIdx: postIdx,
			content: content
		}

		const { data, error } = await API.post('/v2/passenger/emergency/report', sender);

		setTimeout(() => {
			setLoad(false);

			if (error) {
				ToastMessage(lang({ id: error?.message }, { type: 'error' }));
				return;
			} 
				
			ToastMessage(lang({ id: 'thank_you_for' }));
			closeAlertFunc();

		}, consts.apiDelay);

	};



	const callTo = async () => {
		let url = `tel:911`;
		try {
			const supported = await Linking.canOpenURL(url);
			if (supported) {
				await Linking.openURL(url);
			}
		} catch (error) {
			ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
		}

	};

	return (
		<View style={styles.root}>
			{!view ? (
				<View style={{ gap: 15 }}>
					<Text style={styles.title}>{lang({ id: 'report' })}</Text>

					<View style={{ gap: 9 }}>
						<Pressable style={styles.box} onPress={() => setView(true)}>
							<Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'contact_support' })}</Text>
							<Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center', lineHeight: 22 }}>{lang({ id: 'report_an_issue' })}</Text>
						</Pressable>
						<Pressable style={styles.box} onPress={callTo}>
							<Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'call_911_for' })}</Text>
							<Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center', lineHeight: 22 }}>{lang({ id: 'report_an_emergency' })}</Text>
						</Pressable>
					</View>

					<View style={[rootStyle.flex, { gap: 14 }]}>
						<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
					</View>
				</View>
			) : (
				<View style={{ gap: 15 }}>
					<Text style={styles.title}>{lang({ id: 'contact_support' })}</Text>

					<View style={{ gap: 7 }}>
						<Animated.View
							entering={FadeIn}
						>
							<TextArea
								iref={contentref}
								autoFocus
								name={'content'}
								state={content}
								setState={setContent}
								placeholder={lang({ id: 'report_reason' })}
								blurOnSubmit={false}
								maxLength={255}
								multiline
								inputWrapStyle={{ height: 100 }}
								inputStyle={{ fontSize: 16 }}
							/>
						</Animated.View>
					</View>

					<View style={[rootStyle.flex, { gap: 14 }]}>
						<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'close' })}</Button>
						<Button style={{ flex: 1 }} onPress={onPress} disabled={disabled} load={load}>{lang({ id: 'report' })}</Button>
					</View>
				</View>
			)}

		</View>
	);
}



const useStyle = () => {

	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingVertical: 33,
			paddingHorizontal: rootStyle.side,
		},
		title: {
			fontSize: 22,
			color: colors.main,
			fontFamily: fonts.extraBold,
			textAlign: 'center',
		},
		box: {
			alignItems: 'center',
			justifyContent: 'center',
			gap: 5,
			paddingHorizontal: 15,
			paddingVertical: 21,
			backgroundColor: colors.sub_3,
			borderRadius: 12
		}
	});

	return { styles }
}

