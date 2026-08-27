import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
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
import { ToastMessage } from '@/libs/utils';
import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {

	const router = useRouter();
	
	const { styles } = useStyle();

	const { setSignData } = useSignData();
	
	/******************************* */

	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {

	}, [])

	const handleSelectType = (type) => {

		setSignData({
            key: 'level',
            value: type
        })

		router.replace(routes.joinNick);
	};

	return (
		<View style={styles.root}>
			
			{/* 타이틀 및 설명 */}
			<View style={styles.titleContainer}>
				<Text style={styles.title}>
					어떤 유형으로 가입하시겠어요? {'\n'}
					<Text style={styles.subtitle}>내 상황에 맞는 가입 방식을 선택해주세요.</Text>
				</Text>
			</View>

			{/* 가입 유형 선택 카드들 */}
			<View style={styles.cardsContainer}>
				
				{/* 사장님으로 가입하기 */}
				<TouchableOpacity 
					style={styles.card}
					onPress={() => handleSelectType(1)}
				>
					<Image 
						source={images.shop_icon}
						style={styles.icon}
						contentFit="contain"
					/>
					<Text style={styles.cardText}>사장님으로 가입하기</Text>
				</TouchableOpacity>

				{/* 예비사장님으로 가입하기 */}
				<TouchableOpacity 
					style={styles.card}
					onPress={() => handleSelectType(2)}
				>
					<Image 
						source={images.rocket_icon}
						style={styles.icon}
						contentFit="contain"
					/>
					<Text style={styles.cardText}>예비사장님으로 가입하기</Text>
				</TouchableOpacity>

				{/* 업계관계자로 가입하기 */}
				<TouchableOpacity 
					style={styles.card}
					onPress={() => handleSelectType(3)}
				>
					<Image 
						source={images.parent_icon}
						style={styles.icon}
						contentFit="contain"
					/>
					<Text style={styles.cardText}>업계관계자로 가입하기</Text>
				</TouchableOpacity>

			</View>

		</View>
	)
}


const useStyle = () => {

	const insets = useSafeAreaInsets();
	const { width, heigth } = useSafeAreaFrame();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.white,
		},
		
		titleContainer: {
			paddingHorizontal: 27,
			marginTop: 9,
			marginBottom: 34,
		},

		title: {
			fontSize: 20,
			fontFamily: fonts.bold,
			color: colors.black,
			lineHeight: 28,
			letterSpacing: -0.28,
		},

		subtitle: {
			fontSize: 20,
			fontFamily: fonts.bold,
			color: colors.black,
			lineHeight: 28,
			letterSpacing: -0.28,
		},

		cardsContainer: {
			paddingHorizontal: 30,
			gap: 16,
		},

		card: {
			height: 101,
			backgroundColor: colors.white,
			borderWidth: 1,
			borderColor: colors.borderGray,
			borderRadius: 10,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: width <= 330 ? 25 : 46,
		},

		icon: {
			width: 32,
			height: 32,
			marginRight: 20,
		},

		cardText: {
			fontSize: 16,
			fontFamily: fonts.semiBold,
			color: colors.textGray,
			letterSpacing: -0.28,
		},
	})

	return { styles }
}
