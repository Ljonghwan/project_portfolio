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

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData, useSignStoreData } from '@/libs/store';

import { ToastMessage, regName, businessNumHypen, hpHypen, hpHypenRemove } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const router = useRouter();
	const { mbData } = useUser();
	const { business_num, owner, open_date, setSignStoreData } = useSignStoreData();

	const iref = useRef();
	const telRef = useRef();

	const [input, setInput] = useState('');
	const [tel, setTel] = useState('');

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(input && tel?.length >= 9));
	}, [input, tel])

	const handleNext = async () => {
		Keyboard.dismiss();
		if (load || disabled) return;

		setLoad(true);


		setSignStoreData({
			key: 'title',
			value: input,
		})
		setSignStoreData({
			key: 'tel',
			value: tel,
		})


		setLoad(false);
		router.push(routes.storeAddAddress);
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
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`사장님의 매장을 확인했어요!\n매장 정보를 입력해주세요`}</Text>

				<View style={{ paddingHorizontal: 10, gap: 17 }}>

					{/* <View style={styles.fieldContainer}>
						<Text style={styles.label}>사업자등록번호</Text>
						<TextInput
							value={businessNumHypen(business_num)}
							editable={false}
							inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
							style={{ color: colors.textSecondary }}
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

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>개업일자</Text>
						<TextInput
							value={dayjs(open_date).format('YYYY.MM.DD')}
							editable={false}
							inputContainerDisabledStyle={{ backgroundColor: colors.fafafa }}
							style={{ color: colors.textSecondary }}
						/>
					</View> */}

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>매장명</Text>
						<TextInput
							iref={iref}
							autoFocus
							placeholder="매장명을 입력해주세요."
							value={input}
							onChangeText={setInput}
							maxLength={20}
							returnKeyType="next"
							blurOnSubmit={false}
							onSubmitEditing={() => telRef.current?.focus()}
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>매장 전화번호 (지역번호 포함)</Text>
						<TextInput
							iref={telRef}
							placeholder="매장 전화번호를 입력해주세요."
							value={tel}
							onChangeText={setTel}
							displayValue={hpHypen(hpHypenRemove(tel))}
							maxLength={13}
							keyboardType="number-pad"
						/>
					</View>

					
				</View>
			</KeyboardAwareScrollView>

			
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

