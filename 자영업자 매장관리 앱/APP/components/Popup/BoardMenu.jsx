import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { Image } from 'expo-image';
import { router } from "expo-router";

import Text from '@/components/Text';
import TextList from '@/components/TextList';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import Report from '@/components/Popup/Report';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useAlertSheet, useLoader } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
	item,
	target='board',
	handleRemove = () => { }
}) {

	const { styles } = useStyle();
	const { mbData, reload } = useUser();

	const { openAlertFunc } = useAlert();
	const { openAlertFunc: closeAlertSheetFunc, closeAlertFunc } = useAlertSheet();
	const { openLoader, closeLoader } = useLoader();

	const [disabled, setDisabled] = useState(true);
	const [load, setLoad] = useState(false);


	const menuPress = (type) => {
		if (type === 'block') {
			onBlock();
		} else if (type === 'report') {
			console.log('??????');
			closeAlertSheetFunc({
				alertType: 'Sheet',
				handleStyle: { display: 'flex' },
				component: <Report onSubmit={onReport} />
			})
		} else if(type === 'edit') {
			router.push({
				pathname: routes.boardForm,
				params: {
					idx: item?.idx
				}
			})
		} else if(type === 'delete') {
			openAlertFunc({
				label: '삭제하시겠어요?',
				title: `삭제한 정보는 복구할 수 없습니다.\n정말 삭제하시겠어요?`,
				onCencleText: '취소',
				onPressText: '삭제',
				onPress: onDelete
			})
		}
	}

	const onDelete = async () => {
		closeAlertFunc();
		openLoader();

		const sender = {
			idx: item?.idx,
		}

		const { data, error } = await API.post(
			target === 'board' ? '/v1/board/delete' : target === 'comment' ? '/v1/reply/delete' : '/dummy', 
			sender
		);

		setTimeout(() => {
			closeLoader();

			if (error) {
				ToastMessage(error?.message);
				return;
			}

			ToastMessage("삭제 되었습니다.");

			if(target === 'board') {
				router.back();
			} else {
				handleRemove(item?.idx);
			}
			
		}, consts.apiDelay)
	}

	const onReport = async (value) => {

		closeAlertFunc();
		openLoader();

		const sender = {
			idx: item?.idx,
			type: target === 'board' ? 1 : 2,
			comment: value
		}

		const { data, error } = await API.post('/v1/action/report', sender);

		setTimeout(() => {
			closeLoader();

			if (error) {
				ToastMessage(error?.message);
				return;
			}

			ToastMessage("신고가 접수되었어요.");
		}, consts.apiDelay)
	}

	const onBlock = async () => {
		closeAlertFunc();

		const sender = {
			idx: item?.idx,
			type: target === 'board' ? 1 : 2
		}

		const { data, error } = await API.post('/v1/action/block', sender);

		if (error) {
			ToastMessage(error?.message);
			return;
		}

		ToastMessage("차단했어요.");
		handleRemove(item?.idx);
	}

	

	return (
		<View style={styles.root}>
			{mbData?.idx === item?.user_idx ? (
				<View style={styles.container}>
					{target === 'board' && (
						<>
							<Button type={6} onPress={() => { closeAlertFunc(); menuPress('edit') }}>수정하기</Button>
							<View style={{ backgroundColor: colors.gray, height: 1 }} />
						</>
					)}
					<Button type={7} onPress={() => { closeAlertFunc(); menuPress('delete') }}>삭제하기</Button>
				</View>
			) : (
				<View style={styles.container}>
					<Button type={6} onPress={() => { closeAlertFunc(); menuPress('block') }}>이 글 차단하기</Button>
					<View style={{ backgroundColor: colors.gray, height: 1 }} />
					<Button type={7} onPress={() => { closeAlertFunc(); menuPress('report') }}>신고하기</Button>
				</View>
			)}
			

			<Button type={5} onPress={closeAlertFunc}>취소</Button>
		</View>
	);
}



const useStyle = () => {

	const insets = useSafeAreaInsets();
	// Dimensions.get('window').width

	const styles = StyleSheet.create({
		root: {
			paddingHorizontal: rootStyle.side,
			paddingTop: 32,
			paddingBottom: insets?.bottom + 20,
			gap: 8
		},
		container: {
			backgroundColor: colors.f1f1f0,
			borderRadius: 12,
			overflow: 'hidden'
		}

	});

	return { styles }
}

