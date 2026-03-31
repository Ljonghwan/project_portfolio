import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';


import Counter from '@/components/Ui/Counter';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useStore, useConfig, useSignStoreData } from '@/libs/store';

import { ToastMessage, numFormat } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const router = useRouter();
	const { pushToken, login } = useUser();
	const { business_num, owner, open_date, title, tel, addr, addr2, type, setSignStoreData } = useSignStoreData();
	const { configOptions } = useConfig();
	const { reloadStore } = useStore();

	const iref = useRef();
	const areaRef = useRef();

	const [capacity, setCapacity] = useState('');
	const [area, setArea] = useState('');
	const [tables, setTables] = useState([]);

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(capacity && area));
	}, [capacity, area])

	const handleNext = async () => {
		Keyboard.dismiss();
		if (load || disabled) return;

		setLoad(true);

		const sender = {
            business_num,
			owner,
			open_date,
			title,
			tel,
			addr: addr,
			addr2: addr2,
			type: type,
			capacity: capacity,
			area: area,
			tables: tables,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/store/update', sender);

		setTimeout(() => {
			setLoad(false);

			if(error) {
				ToastMessage(error?.message);
				return;
			}

			reloadStore();

			router.dismissAll();
			router.replace(routes.storeAddSuccess);

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
			<KeyboardAwareScrollView
				bottomOffset={200}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps={"handled"}
				disableScrollOnKeyboardHide={Platform.OS === 'ios'}
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingTop: 24,
					paddingBottom: insets?.bottom + 100,
					paddingHorizontal: rootStyle.side,
					gap: 17
				}}
			>
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`우리가게의 운영정보를\n입력해주세요`}</Text>

				<View style={{ paddingHorizontal: 10, gap: 17 }}>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>수용 인원</Text>
						<TextInput
							iref={iref}
							value={capacity}
							displayValue={numFormat(capacity)}
							onChangeText={setCapacity}
							maxLength={5}
							placeholder="수용 인원을 입력해주세요."
							keyboardType="number-pad"
							valid={'price'}
							autoFocus
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>면적(평)</Text>
						<TextInput
							iref={areaRef}
							value={area}
							displayValue={numFormat(area)}
							onChangeText={setArea}
							maxLength={10}
							placeholder="면적을 입력해주세요."
							keyboardType="number-pad"
							valid={'price'}
						/>
					</View>

					<Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), marginTop: 30 }}>테이블 상세 정보</Text>

					<View style={styles.fieldContainer}>
						<View style={{ gap: 32 }}>
							{configOptions?.tableType?.map((x, i) => {
								return (
									<View key={i} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 12 }]}>
										<Text style={styles.label}>{x}</Text>
										<Counter
											value={tables?.find(y => y?.title === x)?.count || 0}
											setValue={(v) => {
												setTables(prev => [
													...prev?.filter(y => y?.title !== x),
													{ title: x, count: v }
												]);
											}} />
									</View>
								)
							})}
						</View>
					</View>


				</View>
			</KeyboardAwareScrollView>


			<Button bottom disabled={disabled} load={load} onPress={handleNext}>완료</Button>
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

