import { Image } from 'expo-image';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { useUser, useAlert, useLoader, useStore, useSignStoreData, usePageContext } from '@/libs/store';

import { ToastMessage, regName, businessNumHypen, hpHypen, hpHypenRemove } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

    const pathname = usePathname();

	const { pushToken, login } = useUser();
	const { business_num, owner, open_date, title, tel, setSignStoreData } = useSignStoreData();
	const { context, setContext } = usePageContext();
	const { reloadStore } = useStore();

	const iref = useRef();
	const telRef = useRef();

	const [input, setInput] = useState('');

	const [addr, setAddr] = useState('');
	const [addr2, setAddr2] = useState('');

	const [type, setType] = useState('');
	const [depth1, setDepth1] = useState('');
	const [depth2, setDepth2] = useState('');
	const [depth3, setDepth3] = useState('');

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(!(addr && addr2 && type));
	}, [addr, addr2, type])

	useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'addr') {
			setAddr(context?.data?.addr);
			iref.current?.focus();
			// setAddr2(context?.data?.addr2);
        }
		if (context?.key === 'businessType') {
			setType(context?.data?.type);
			setDepth1(context?.data?.depth1);
			setDepth2(context?.data?.depth2);
			setDepth3(context?.data?.depth3);
        }

        setContext(null);

    }, [context])


	const handleNext = async () => {
		Keyboard.dismiss();
		if (load || disabled) return;

		setLoad(true);


		setSignStoreData({
			key: 'addr',
			value: addr,
		})
		setSignStoreData({
			key: 'addr2',
			value: addr2,
		})
		setSignStoreData({
			key: 'type',
			value: type,
		})

		setLoad(false);
		router.push(routes.storeAddCapacity);
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
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`어디서 어떤 매장을\n운영하세요?`}</Text>

				<View style={{ paddingHorizontal: 10, gap: 40 }}>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>사업장 주소</Text>
						<TouchableOpacity
							activeOpacity={0.7}
							style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
							onPress={() => {
								Keyboard.dismiss();
								router.push({
									pathname: routes.addrSearch,
									params: {
										route: pathname,
									}
								})
							}}
						>
							<Text style={{ ...rootStyle.font(16, addr ? colors.textPrimary : colors.textSecondary, fonts.regular), flexShrink: 1 }} numberOfLines={1}>{addr || '주소를 검색해주세요'}</Text>
							<Image source={images.search} style={rootStyle.default20} transition={100} />
						</TouchableOpacity>

						<TextInput
							iref={iref}
							value={addr2}
							onChangeText={setAddr2}
							maxLength={50}
							placeholder="상세주소를 입력해주세요."
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>업종</Text>
						<TouchableOpacity
							activeOpacity={0.7}
							style={[styles.inputView, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white }]}
							onPress={() => {
								Keyboard.dismiss();
								router.push({
									pathname: routes.businessTypeSearch,
									params: {
										route: pathname,
									}
								})
							}}
						>
							<Text style={{ ...rootStyle.font(!type ? 16 : 14, !type ? colors.textSecondary : colors.textPrimary, fonts.regular), flexShrink: 1 }} numberOfLines={2}>
								{!type ? '업종을 선택해주세요' : `${depth1} > ${depth2} > ${depth3}`}
							</Text>
							{!type && <Image source={images.search} style={rootStyle.default20} transition={100} />}
						</TouchableOpacity>
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
		inputView: {
            height: 48,
            justifyContent: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.fafafa,
            paddingHorizontal: 16,
            flex: 1
        },

	});

	return { styles }
}

