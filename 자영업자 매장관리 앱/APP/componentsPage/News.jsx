import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInRight, useSharedValue } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import News from '@/components/Item/News';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, getFullDateFormat } from '@/libs/utils';

import { useUser, useStore, useAlert, useLoader } from '@/libs/store';

export default function Page({ cate, page }) {

	const { removeIdx } = useLocalSearchParams();
	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const { mbData } = useUser();
	const { store } = useStore();

	const [list, setList] = useState([]);
    const [nextToken, setNextToken] = useState(null);

	const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
	const [reload, setReload] = useState(false); // 새로고침
	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);


	useEffect(() => {
		dataFunc(true);
	}, [])

	useEffect(() => {

		if (reload) {
			dataFunc(true);
		}

	}, [reload]);

	const dataFunc = async (reset) => {

		if (load) return;

		setLoad(true);

		const { data, error } = await API.post('v1/news/list');

		setList(data || []);

		setTimeout(() => {
			
			setInitLoad(false);
			setLoad(false);
			setReload(false);

		}, consts.apiDelay)
	}


	const renderItem = ({ item, index }) => {

		return (
			<News item={item} />
		);
	};


	return (
		<View style={{ flex: 1 }}>

			{initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
			{/* <Text>{list?.[0]?.idx} ~ {list?.at(-1)?.idx}</Text> */}
			<FlashList
				data={list}
				keyExtractor={({ item }) => item?.idx}
				renderItem={renderItem}
				numColumns={1}
				refreshing={reload}
				removeClippedSubviews
				onRefresh={() => {
					setReload(true);
				}}
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingBottom: insets?.bottom + 20 ,
					paddingHorizontal: 20,
					flex: list?.length < 1 ? 1 : 'unset',
				}}
				keyboardDismissMode={'on-drag'}
				keyboardShouldPersistTaps={"handled"}
				nestedScrollEnabled={true}
				decelerationRate={'normal'}

				// onEndReached={() => dataFunc()}
				// onEndReachedThreshold={0.6}

				ListEmptyComponent={
					<Empty msg={'소식이 없습니다.'} style={{ paddingBottom: 0 }} />
				}
			/>

		</View>
	)
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({


	})

	return { styles }
}
