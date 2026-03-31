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

import Board from '@/components/Item/Board';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, getFullDateFormat } from '@/libs/utils';

import { useUser, useStore, useAlert, useLoader } from '@/libs/store';

export default function Page({ cate, page, sort }) {

	const { removeIdx } = useLocalSearchParams();
	const { styles } = useStyle();
	const insets = useSafeAreaInsets();

	const { mbData } = useUser();
	const { store } = useStore();

	const scRef = useRef(null);

	const [list, setList] = useState([]);
	const [pagination, setPagination] = useState(null);
    const [nextToken, setNextToken] = useState(null);
	
	const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
	const [reload, setReload] = useState(false); // 새로고침
	const [load, setLoad] = useState(false);
	const [disabled, setDisabled] = useState(true);

	useFocusEffect(
		useCallback(() => {
			if(removeIdx) {
				console.log('removeIdx', removeIdx, )
				handleRemove(removeIdx);
				router.setParams({ removeIdx: null  });
			}
		}, [removeIdx])
	);

	useEffect(() => {
		scRef.current?.scrollToTop({
			animated: true
		})

		setInitLoad(true);
		dataFunc(true);
	}, [sort])

	useEffect(() => {

		if (reload) {
			dataFunc(true);
		}

	}, [reload]);

	const dataFunc = async (reset) => {
		
		if (load) return;
        if (!reset && !pagination?.hasNextPage) return;

		setLoad(true);

		const sender = {
			cate: cate,
			sort: sort,
			page: reset ? 1 : (pagination?.currentPage + 1) || 1,
		}
		const { data, error } = await API.post(page === 'my' ? '/v1/board/myList' : '/v1/board/list', sender);

		setPagination(data?.pagination);
		setList(prev => {
            return reset ? data?.list : [...prev, ...data?.list]
        });

		setTimeout(() => {
			
			setInitLoad(false);
			setLoad(false);
			setReload(false);

		}, consts.apiDelay)
	}

	const handleRemove = (idx) => {
		setLoad(true);

		setList(prev => prev?.filter(x => x?.idx != idx));

		setTimeout(() => {
			setLoad(false);
		}, consts.apiDelay)
	}

	const renderItem = ({ item, index }) => {

		return (
			<Board item={item} handleRemove={handleRemove} />
		);
	};


	return (
		<View style={{ flex: 1, paddingTop: page === 'my' ? 0 : 10 }}>

			{initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
			{/* <Text>{list?.[0]?.idx} ~ {list?.at(-1)?.idx}</Text> */}
			<FlashList
				ref={scRef}
				data={list}
				renderItem={renderItem}
				numColumns={1}
				refreshing={reload}
				removeClippedSubviews
				onRefresh={() => {
					setReload(true);
				}}
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingBottom: (page === 'my' ? insets?.bottom + 20 : rootStyle.bottomTabs.height + insets?.bottom + 100),
					paddingHorizontal: 20,
					flex: list?.length < 1 ? 1 : 'unset',
				}}
				keyboardDismissMode={'on-drag'}
				keyboardShouldPersistTaps={"handled"}
				nestedScrollEnabled={true}
				decelerationRate={'normal'}

				onEndReached={() => dataFunc()}
				onEndReachedThreshold={0.6}

				ListEmptyComponent={
					<Empty msg={'게시글이 없습니다.'} style={{ paddingBottom: 0 }} />
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
