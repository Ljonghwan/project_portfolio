import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, Keyboard, useWindowDimensions } from 'react-native';
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
	idx
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();
	const { configOptions } = useConfig();
	const { openAlertFunc, closeAlertFunc } = useAlert();

	const contentref = useRef(null);
	const [content, setContent] = useState("");

	const [checked, setChecked] = useState(configOptions?.report?.[0] || null);
	const [termsAgree, setTermsAgree] = useState(null);

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(checked || (!checked && content)))
	}, [checked, content])

	const onPress = async (v) => {

		Keyboard.dismiss();
		
		setLoad(true);

		const sender = {
			postIdx: idx,
			content: checked,
			desc: content
		}
		console.log('sender', sender);

		const { data, error } = await API.post('/v2/driver/reqpost/report', sender);

		setLoad(false);
		closeAlertFunc();

		if(error) {
			ToastMessage(lang({ id: error?.message }, { type: 'error' }));	
		} else {
			ToastMessage(lang({ id: 'thank_you_for'}));
		}
	};

	const checkFunc = (idx, check) => {
		setChecked(idx);
	}

	return (
		<View style={styles.root}>
			<View style={{ gap: 15 }}>
				<View style={{ gap: 5 }}>
					<Text style={styles.title}>{lang({ id: 'report_post' })}</Text>
					<Text style={styles.subTitle}>{lang({ id: 'select_reason_for' })}</Text>
				</View>

				<View style={{ gap: 7 }}>
					{configOptions?.report?.map((x, i) => {
						return (
							<CheckBox
								key={i}
								label={lang({ id: x })}
								checked={checked === x}
								onCheckedChange={(v) => {
									checkFunc(x);
								}}
							/>
						)
					})}

					<CheckBox
						label={lang({ id: 'other_please_specify' })}
						checked={!checked}
						onCheckedChange={(v) => {
							checkFunc(null);
						}}
					/>

					{!checked && (
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
					)}

				</View>

				<View style={[rootStyle.flex, { gap: 14 }]}>
					<Button style={{ flex: 1 }} type={2} onPress={closeAlertFunc}>{lang({ id: 'cancel' })}</Button>
					<Button style={{ flex: 1 }} onPress={onPress} disabled={disabled} load={load}>{lang({ id: 'report' })}</Button>
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
			paddingVertical: 33,
			paddingHorizontal: rootStyle.side,
		},
		title: {
			fontSize: 22,
			color: colors.main,
			fontFamily: fonts.extraBold,
			textAlign: 'center',
		},
		subTitle: {
			fontSize: 16,
			color: colors.sub_1,
			fontFamily: fonts.medium,
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

