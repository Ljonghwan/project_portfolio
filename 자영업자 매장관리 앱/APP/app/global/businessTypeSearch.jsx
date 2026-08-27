import { Image } from 'expo-image';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableOpacity, View, FlatList, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import _ from 'lodash';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData, useSignStoreData, usePageContext } from '@/libs/store';

import { ToastMessage, regName, businessNumHypen, hpHypen, hpHypenRemove } from '@/libs/utils';

export default function Login() {

	const { styles } = useStyle();
	const insets = useSafeAreaInsets();
	const { width } = useSafeAreaFrame();

    const pathname = usePathname();

	const { pushToken, login } = useUser();
	const { business_num, owner, setSignStoreData } = useSignStoreData();
	const { context, setContext } = usePageContext();

	const [list, setList] = useState([]);
	const [depth1List, setDepth1List] = useState([]);
	const [depth2List, setDepth2List] = useState([]);

	const [depth1, setDepth1] = useState(null);
	const [depth2, setDepth2] = useState(null);
	const [depth3, setDepth3] = useState(null);

	const [initLoad, setInitLoad] = useState(true);
	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		dataFunc()
	}, [])

	useEffect(() => {
		if (depth1) {
			const depth2List = _.uniq(_.map(list?.filter(x => x?.depth1 === depth1), 'depth2'));
			setDepth2List(_.chunk(depth2List, 2));
			setDepth2(null);
			setDepth3(null);
		}
	}, [depth1])

	useEffect(() => {
		if (depth2) {
			setDepth3(null);
		}
	}, [depth2])

	useEffect(() => {
		setDisabled(!(depth3));
	}, [depth3])


	const dataFunc = async () => {

		const { data, error } = await API.post('/v1/store/type');
		
		setList(data || []);

		const depth1List = _.uniq(_.map(data, 'depth1'));
		setDepth1List(depth1List);
		setDepth1(depth1List?.[0]);

		setTimeout(() => {
			setInitLoad(false);
		}, consts.apiDelay);
	}

	const handleNext = async () => {
		 setContext({
			key: 'businessType',
			data: {
				type: depth3,
				depth1: depth1,
				depth2: depth2,
				depth3: list?.find(x => x?.idx === depth3)?.depth3,
			},
		});
		router.back();
	}


	const renderItem = ({ item, index }) => {

		return (
			<Animated.View entering={FadeIn.delay(index * 30)} style={{ flex: 1, gap: 12 }}>
				<View style={[rootStyle.flex, { gap: 12, justifyContent: 'space-between' }	]}>
					{item?.map((x, i) => {
						return (
							<TouchableOpacity key={i} style={[styles.item, depth2 === x && styles.itemActive]} activeOpacity={0.7} onPress={() => {
								setDepth2(x);
							}} >
								<Text style={{...rootStyle.font(14, depth2 === x ? colors.primary : colors.textA6A6A6, fonts.medium) }}>{x}</Text>
							</TouchableOpacity>
						)
					})}
				</View>
				{item?.includes(depth2) && (
					<View style={styles.depth3List}>
						{list?.filter(x => x?.depth1 === depth1 && x?.depth2 === depth2)?.map((x, i) => {
							return (
								<TouchableOpacity key={x?.idx} style={{ width: width <= 330 ? '100%' : '45%' }} activeOpacity={0.7} hitSlop={10} onPress={() => {
									setDepth3(x?.idx);
								}} >
									<Text style={{...rootStyle.font(14, depth3 === x?.idx ? colors.primary : colors.textA6A6A6, fonts.medium) }}>+ {x?.depth3}</Text>
								</TouchableOpacity>
							)
						})}
					</View>
				)}
			</Animated.View>
		);
	};

	const header = {
		left: {
			icon: 'back',
			onPress: () => router.back()
		},
		title: '업종 선택'
	};

	return (
		<Layout header={header}>

			{initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

			<View style={{ paddingHorizontal: rootStyle.side, paddingTop: 24, paddingBottom: 10, gap: 20 }}>
				<Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`우리가게의 업종을\n선택해주세요`}</Text>
				<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 9, flexWrap: 'wrap' }]}>
					{depth1List?.map((x, i) => {
						return (
							<TouchableOpacity key={i} style={[styles.cate, depth1 === x && styles.cateActive]} activeOpacity={0.7} hitSlop={4} onPress={() => {
								setDepth1(x);
							}}>
								<Text style={[styles.cateText, depth1 === x && styles.cateTextActive]}>{x}</Text>
							</TouchableOpacity>
						)
					})}
				</View>
			</View>

			<View style={{ flex: 1 }}>
				<FlatList
					data={depth2List}
					renderItem={renderItem}
					numColumns={1}
					style={{ flex: 1 }}
					keyExtractor={item => item?.[0]}
					contentContainerStyle={{
						paddingTop: 5,
						paddingHorizontal: rootStyle.side,
						paddingBottom: insets?.bottom + 100,
						gap: 11,
					}}
				/>	
			</View>




			<Button bottom disabled={disabled} load={load} onPress={handleNext}>완료</Button>
		</Layout>
	);
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		cate: {
			borderRadius: 100,
			borderWidth: 1,
			borderColor: colors.dadada,
			backgroundColor: colors.fafafa,
			height: 30,
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: 10
		},
		cateActive: {
			borderColor: colors.primary,
			backgroundColor: colors.primary,
		},
		cateText: {
			fontSize: 14,
			fontFamily: fonts.semiBold,
			color: colors.text757575,
			letterSpacing: -0.35
		},
		cateTextActive: {
			color: colors.white,
		},


		item: {
			alignItems: 'flex-start',
			justifyContent: 'center',
			borderRadius: 8,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.white,
			height: 48,
			paddingHorizontal: 13,
			flex: 1,
			maxWidth: '48%',
		},
		itemActive: {
			borderColor: colors.primary,
		},

		depth3List: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: 23,
			borderRadius: 8,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.f4f4f4,
			paddingHorizontal: 13,
			paddingVertical: 25,
		},
	});

	return { styles }
}

