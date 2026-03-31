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

	const header = {
        right: {
            icon: 'exit',
            onPress: () => {
                router.back();
            }
        }
    };

	return (
		<Layout header={header} >
			<View style={styles.root}>
				
				<View style={{ flex: 1 , alignItems: 'center', gap: 35 }}>
					<Image source={images.my_service} style={rootStyle.my_service} />
					<View style={{ gap: 10 }}>
						<Text style={styles.title}>연동에 성공했어요!</Text>
						<Text style={styles.subtitle}>{`데이터를 모두 수집하는데\n최대 1 - 2일의 시간이 필요해요.`}</Text>
						<Text style={styles.subtitle}>{`화면을 나가도 데이터 수집은 계속 진행됩니다.`}</Text>
					</View>
				</View>

				<Button bottom onPress={() => { 
					router.back();
				}}>확인</Button>

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
