import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

/******************************* */

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

/******************************* */

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, useBackHandler } from '@/libs/utils';

import { useUser, useStore, useAlert, useLoader, useSignStoreData } from '@/libs/store';

export default function Page() {

	const router = useRouter();
	
	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const { openAlertFunc } = useAlert();
	const { store } = useStore();
	
	/******************************* */

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useBackHandler(() => {
        closeFunc();
        return true;
    });

	useEffect(() => {

	}, [])

	const closeFunc = () => {
        openAlertFunc({
            label: '나중에 연동해도 괜찮아요! 😊',
            title: '매출 자동 조회가 필요하시면\n[사장실 > 서비스 연동 관리]에서 연동해 주세요.',
            onPressText: '확인',
            onPress: async () => {
                router.replace(routes.tabs);
            }
        })
    }

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.replace(routes.tabs)
		},
	};

	return (
		<Layout header={header}>
			<View style={styles.root}>
				<View style={{ flex: 1 , alignItems: 'center',  justifyContent: 'center', gap: 35 }}>
					<Image source={images.store} style={rootStyle.store} />
					<View style={{ gap: 10 }}>
						<Text style={styles.title}>매장 추가 완료!</Text>
						<Text style={styles.subtitle}>{`여신금융협회 연동 시 카드 매출·입금 내역을\n자동으로 가져올 수 있어요.`}</Text>
					</View>
				</View>

				<View style={{ paddingBottom: insets?.bottom + 20, paddingHorizontal: 35, gap: 10 }}>
					<Button onPress={() => { 
						router.replace(routes.tabs);
						router.push({
							pathname: routes.certCardSales,
							params: {
								idx: store?.idx
							}
						})

					}}>연동하러 가기</Button>
					<Button type={2} onPress={closeFunc}>나중에 할게요</Button>
				</View>
			</View>
		</Layout>
	)
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.white,
		},
		title: {
			fontSize: 24,
			fontFamily: fonts.semiBold,
			color: colors.textPrimary,
			lineHeight: 34,
			letterSpacing: -0.6,
			textAlign: 'center'
		},

		subtitle: {
			fontSize: 16,
			color: colors.textSecondary,
			lineHeight: 24,
			letterSpacing: -0.4,
			textAlign: 'center'
		},

	})

	return { styles }
}
