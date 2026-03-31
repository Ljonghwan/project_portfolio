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


	return (
		<View style={styles.root}>
			
			<View style={{ flex: 1 , alignItems: 'center', gap: 35 }}>
				<Image source={images.emoji_sign} style={rootStyle.emoji_sign} />
				<View style={{ gap: 10 }}>
					<Text style={styles.title}>가입을 축하드립니다!</Text>
					<Text style={styles.subtitle}>{`오너톡 시작을 위한 기본 정보는 모두 불러왔어요.\n지금 바로 홈으로 이동해 시작해보세요.`}</Text>
				</View>
			</View>

			<Button bottom onPress={() => { 
				router.dismissAll();
				router.replace(routes.tabs)
			 }}>오너톡 시작하기</Button>

		</View>
	)
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.white,
			paddingTop: 45
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
