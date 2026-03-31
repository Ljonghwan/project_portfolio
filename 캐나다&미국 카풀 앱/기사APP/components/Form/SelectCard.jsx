import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Pressable, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import Card from '@/components/Item/Card';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useAlert, useLoader } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7; // 카드 실제 크기 (80%)
const SPACING = 30;             // 카드 간격

export default function Component({
	selected,
	onSubmit = () => { },
	onCencle = () => { },
	style
}) {

	const { openLoader, closeLoader } = useLoader();

	const listRef = useRef(null);

	const [cards, setCards] = useState([]);
	const [card, setCard] = useState(selected || null);

	const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
	const [load, setLoad] = useState(false); // 데이터 추가 로딩
	const [reload, setReload] = useState(false); // 새로고침
	const [disabled, setDisabled] = useState(true); // 카드등록 로딩

	const [addLoad, setAddLoad] = useState(false); // 카드등록 로딩

	const [page, setPage] = useState(0);

	useEffect(() => {
		cardList();
	}, [])

	useEffect(() => {
		setCard(cards?.[page] || null);
	}, [page])

	useEffect(() => {
		setDisabled(!(card));
	}, [card])

	const cardList = async (reset) => {

		const { data, error } = await API.post('/v2/my/cardList');
		setCards(data || []);
		// setCards([]);

		setTimeout(() => {
			let index = data?.findIndex(x => x?.idx === card?.idx);
			listRef?.current?.scrollToIndex({ index: reset ? 0 : ( index < 0 ? 0 : index ), animated: true });

			// setList([]);
			setInitLoad(false);
			setLoad(false);
			setReload(false);

		}, consts.apiDelay)

	}

	const renderItemCard = ({ item, index }) => {
		if (!item) {
			return (
				<TouchableOpacity style={styles.add} activeOpacity={0.7} onPress={addCardPop}>
					<Image source={images.card_add} style={rootStyle.default32} />
				</TouchableOpacity>
			)
		} else {
			return (
				<Card item={item} style={{ width: CARD_WIDTH }} />
			)
		}
	};


	const addCardPop = async () => {
		
	}

	const handleScroll = (event) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const index = Math.round(offsetX / (CARD_WIDTH + SPACING)); // 현재 페이지 계산
		setPage(index);
	};

	return (
		<View style={[styles.container, style]}>

			{initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

			<View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start', paddingHorizontal: rootStyle.side }]}>
				<TouchableOpacity onPress={onCencle}>
					<Image source={images.back} style={rootStyle.default} />
				</TouchableOpacity>
				<Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'select_payment_card' })}</Text>
			</View>

			<FlatList
				ref={listRef}
				data={[...cards, null]}
				renderItem={renderItemCard}
				contentContainerStyle={{
					paddingHorizontal: (width - CARD_WIDTH) / 2,
				}}
				ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
				horizontal
				snapToInterval={CARD_WIDTH + SPACING}
				decelerationRate="fast"
				snapToAlignment="start"
				pagingEnabled
				disableIntervalMomentum={true}
				showsHorizontalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16} // 16ms 마다 이벤트 (60fps)
				getItemLayout={(data, index) => ({
					length: CARD_WIDTH + SPACING,
					offset: (CARD_WIDTH + SPACING) * index,
					index,
				})}
				ListEmptyComponent={
					<View style={[styles.add, { width: width - 40, paddingHorizontal: 40, gap: 26 }]} >
						<Text style={styles.emptyTitle}>{lang({ id: 'no_registered_cards' })}</Text>
						<Button onPress={addCardPop}>{lang({ id: 'register_credit_card' })}</Button>
					</View>
				}
			/>

			<View style={{ paddingHorizontal: rootStyle.side }}>
				<Button disabled={disabled} onPress={() => { onSubmit(card); onCencle(); }} >{lang({ id: 'done' })}</Button>
			</View>

		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 28
	},
	add: {
		width: CARD_WIDTH,
		aspectRatio: rootStyle.card.aspectRatio,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.sub_3
	},
});