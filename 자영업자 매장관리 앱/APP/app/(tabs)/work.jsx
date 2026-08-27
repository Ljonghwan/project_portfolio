import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Select from '@/components/Select';

import Popup from '@/store-component/Popup';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useUser, useStore } from '@/libs/store';

import protectedStoreRouter from '@/libs/protectedStoreRouter';


const links = [
	{ icon: images.work_01, width: 49, gap: 20, title: '매입비 관리', route: routes.매입비관리 },
	{ icon: images.work_09, width: 41, gap: 20, title: '제품 원가 관리', route: routes.제품원가관리 },
	{ icon: images.work_02, width: 49, gap: 15, title: '원가계산기', route: routes.원가계산기 },

	
	{ icon: images.work_03, width: 41, gap: 20, title: '일용노무대장', route: routes.일용노무대장 }, // 미완
	{ icon: images.work_04, width: 41, gap: 20, title: '직원관리', route: routes.직원관리 },
	{ icon: images.work_07, width: 41, gap: 20, title: '근무 형태 관리', route: routes.근무형태관리 },


	{ icon: images.work_05, width: 45, gap: 20, title: '고객 관리', route: routes.고객관리 },
	{ icon: images.work_06, width: 35, gap: 27, title: '이벤트 관리', route: routes.이벤트관리 },
	
	{ icon: images.work_08, width: 41, gap: 20, title: '계약서 관리', route: routes.계약서관리 },  // 미완
	{ icon: images.work_10, width: 41, gap: 18, title: '현금 거래', route: routes.현금거래 },
]

export default function Index() {

	const tabBarHeight = useBottomTabBarHeight();
	const { styles } = useStyle();
	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();
	
	const renderItem = ({ item, index }) => {

		return (
			<TouchableOpacity style={[styles.item, { gap: item?.gap }]} activeOpacity={0.7} onPress={() => {
				protectedStoreRouter.push(item?.route);
			}} >
				<Image source={item?.icon} style={{ width: item?.width, aspectRatio: 1 }}  />
				<Text style={{...rootStyle.font(16, colors.text757575, fonts.semiBold) }}>{item?.title}</Text>
			</TouchableOpacity>
		);
	};

	const header = {
		store: true,
		right: {
			bell: true
		},
	};

	return (
		<Layout header={header} backgroundColor={colors.fafafa}>

			<FlatList
				data={links}
				renderItem={renderItem}
				numColumns={2}
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingTop: 20,
					paddingHorizontal: width <= 330 ? 20 : 37,
					paddingBottom: insets?.bottom + tabBarHeight,
					gap: 20,
				}}
				columnWrapperStyle={{
					gap: 12
				}}
			>
			</FlatList>


			<Popup page={'work'} />
		</Layout>
	);
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		item: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 8,
			backgroundColor: colors.white,
			flex: 1,
			height: 150
		}

	})

	return { styles }
}