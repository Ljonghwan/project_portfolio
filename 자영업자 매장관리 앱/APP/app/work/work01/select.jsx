import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import { router } from 'expo-router';

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

import { photoShot } from '@/libs/utils';

const links = [
	{ icon: images.work_01_camera, width: 32, title: '거래명세표 촬영', route: routes.매입촬영 },
	{ icon: images.work_01_pen, width: 32, title: '직접 입력', route: routes.매입등록 },
]

export default function Index() {

	const { styles } = useStyle();
	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();


	const renderItem = ({ item, index }) => {

		return (
			<TouchableOpacity style={[styles.item ]} activeOpacity={0.7} onPress={async () => {
				if(item?.route === routes.매입촬영) {
					const status = await photoShot();
					if(!status) {
						
						return;
					}
				} 

				router.push(item?.route)
				
			}} >
				<View style={styles.itemImage}>
					<Image source={item?.icon} style={{ width: item?.width, aspectRatio: 1 }}  />
				</View>
				<Text style={{...rootStyle.font(16, colors.header, fonts.semiBold) }}>{item?.title}</Text>
			</TouchableOpacity>
		);
	};

	const header = {
		left: {
			icon: 'back',
			onPress: () => {
				router.back()
			}
		},
		title: '매입 등록'
	};

	return (
		<Layout header={header}>

			<FlatList
				data={links}
				renderItem={renderItem}
				numColumns={2}
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingTop: 30,
					paddingHorizontal: 41,
					gap: 32,
				}}
				columnWrapperStyle={{
					gap: 12
				}}
				ListHeaderComponent={
					<View>
						<Text style={{...rootStyle.font(20, colors.black, fonts.semiBold)}}>매입등록 방식을 선택해주세요</Text>
					</View>
				}
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
			borderRadius: 10,
			backgroundColor: colors.white,
			flex: 1,
			height: 165,
			borderColor: colors.border,
			borderWidth: 1,
			gap: 21
		},
		itemImage: {
			width: 58,
			aspectRatio: 1,
			borderRadius: 8,
			backgroundColor: colors.fafafa,
			alignItems: 'center',
			justifyContent: 'center'
		}

	})

	return { styles }
}