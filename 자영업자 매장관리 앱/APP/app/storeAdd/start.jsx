import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import InputDate from '@/components/Ui/InputDate';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData, useSignStoreData } from '@/libs/store';

import { ToastMessage, regName, businessNumHypen, useBackHandler } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();

	const router = useRouter();
	const { mbData } = useUser();
	const { setSignStoreData } = useSignStoreData();


	const iref = useRef();
	const dateRef = useRef();

	const [input, setInput] = useState('');
	const [date, setDate] = useState(null);

	// const [input, setInput] = useState('5670303286');
	// const [date, setDate] = useState('2025-04-03');
	

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setSignStoreData('init');
	}, [])

	useEffect(() => {
		setDisabled(!(input?.length >= 10 && date));
	}, [input, date])

	const handleNext = async () => {
		
		Keyboard.dismiss();
		setSignStoreData({
			key: 'business_num',
			value: input,
		})
		setSignStoreData({
			key: 'owner',
			value: mbData?.name,
		})
		setSignStoreData({
			key: 'open_date',
			value: date,
		})

		router.push({
			pathname: routes.storeAddCert,
		})

		return;


		Keyboard.dismiss();
		if (load || disabled) return;

		setLoad(true);

		const sender = {
			business_num: input,
			open_date: date,
		}

		const { data, error } = await API.post('/v1/store/cert', sender);
		console.log('data', data, error);

		setTimeout(() => {
			setLoad(false);

			if (error) {
				ToastMessage(error?.message);
				return;
			}

			setSignStoreData({
				key: 'business_num',
				value: input,
			})
			setSignStoreData({
				key: 'owner',
				value: data?.owner,
			})
			setSignStoreData({
				key: 'open_date',
				value: data?.open_date,
			})

			router.push({
				pathname: routes.storeAddForm,
			})
		}, consts.apiDelay)
	}



	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: '매장 등록'
	};

	return (
		<Layout header={header}>
			<Pressable style={{ flex: 1, paddingTop: 24, paddingHorizontal: 24, gap: 30 }} onPress={() => {
				Keyboard.dismiss();
			}}>
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`사장님의 매장등록을\n시작할게요`}</Text>

				<View style={{ paddingHorizontal: 10, gap: 17 }}>
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>사업자등록번호</Text>
						<TextInput
							iref={iref}
							autoFocus
							placeholder="매장 사업자등록번호 입력"
							value={input}
							displayValue={businessNumHypen(input)}
							onChangeText={setInput}
							maxLength={12}
							keyboardType="number-pad"
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>개업일자</Text>
						<InputDate
							ref={dateRef}
							state={date} 
							setState={setDate} 
							placeholder={'개업일자'} 
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>대표명</Text>
						<TextInput
							value={mbData?.name}
							editable={false}
							inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
							style={{ color: colors.textSecondary }}
						/>
					</View>
				</View>
				
				
				
				
			</Pressable>
			<Button bottom disabled={disabled} load={load} onPress={handleNext}>다음</Button>
		</Layout>
	);
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		fieldContainer: {
            gap: 12,
        },
        label: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.textTertiary,
            lineHeight: 20,
            letterSpacing: -0.35,
        },

	});

	return { styles }
}

