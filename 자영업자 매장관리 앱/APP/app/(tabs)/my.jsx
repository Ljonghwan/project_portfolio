import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Select from '@/components/Select';

import EarnBadge from '@/components/Popup/EarnBadge';

import Tag from '@/components/Ui/Tag';

import Popup from '@/store-component/Popup';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useUser, useStore, useAlert, useConfig } from '@/libs/store';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

const links = [
	{ icon: images.my_menu1, title: '서비스 연동 관리', route: routes.myService }, // 완
	{ icon: images.my_menu2, title: '내 활동', route: routes.myBoard }, // 완
	{ icon: images.my_menu3, title: '소식 센터', route: routes.myNews },
	{ icon: images.my_menu4, title: '자주하는 질문', route: routes.myFaq }, // 완
	{ icon: images.my_menu5, title: '공지사항', route: routes.notice }, // 완
	{ icon: images.my_menu6, title: '피드백 센터', route: routes.myFeedback }, // 완
	{ icon: images.my_menu7, title: '앱 설정', route: routes.mySetting }, // 완
]
export default function Index() {


	const tabBarHeight = useBottomTabBarHeight();
	const insets = useSafeAreaInsets();

	const { pushToken, mbData, login, logout, reload } = useUser();
	const { store } = useStore();
	const { openAlertFunc } = useAlert();
	const { configOptions } = useConfig();

	const [cate, setCate] = useState(false);
	const [load, setLoad] = useState(false);

	useFocusEffect(
		useCallback(() => {
			reload();
		}, [])
	);

	useFocusEffect(
		useCallback(() => {
			badgeFunc();
		}, [mbData])
	);

	useEffect(() => {
		
		configOptions?.class?.map(x => Image.prefetch(consts.s3Url + x?.image));

	}, []);

	const badgeFunc = async () => {

		if(!mbData?.newBadge) return

		console.red('configOptions', mbData?.newBadge);
		const badge = configOptions?.badges?.find(x => x?.idx === mbData?.newBadge);
		console.red('configOptions', badge);
		if(!badge) return;

		await API.post('/v1/auth/badge');

		setTimeout(async () => {
			openAlertFunc({
				component: <EarnBadge badge={badge} date={mbData?.newBadgeAt}/>,
				onEnd: () => {
					reload();
				}
			})
		}, 200)
	}


	const header = {
		leftTitle: '마이페이지',
		right: {
			bell: true
		},
	};

	return (
		<Layout header={header} backgroundColor={colors.fafafa}>
			<View style={{ flex: 1 }}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						paddingTop: 20,
						paddingHorizontal: rootStyle.side,
						paddingBottom: insets?.bottom + tabBarHeight
					}}
				>
					<View style={{ gap: 20 }}>
						<View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: 4 }]}>
							<View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 15 }]}>
								<Image source={consts.s3Url + mbData?.profile} style={{ width: 45, aspectRatio: 1 / 1, borderRadius: 1000 }} placeholder={images.profile} placeholderContentFit={'cover'} />
								<Text style={{ ...rootStyle.font(16, colors.text212223, fonts.semiBold) }}>{mbData?.nickname}</Text>
							</View>
							<Button type={8} style={{ width: 'auto' }} onPress={() => { 
								router.push(routes.myInfo)
							}}>내 정보 수정</Button>
						</View>


						<View style={{ gap: 14 }}>
							<TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { justifyContent: 'center', backgroundColor: colors.white, borderRadius: 20, height: 80 }]} onPress={() => {
								router.push(routes.myClass)
							}}>
								<View style={{ height: '100%', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
									<Text style={{ ...rootStyle.font(12, colors.text757575) }}>나의 등급</Text>
									<Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold) }}>{configOptions?.class?.find(x => x?.idx === mbData?.class)?.label || '새내기 사장님'}</Text>
								</View>
								<View style={{ width: 1, height: '50%', backgroundColor: colors.e9e9e9 }} />
								<View style={{ height: '100%', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
									<Text style={{ ...rootStyle.font(12, colors.text757575) }}>대표 뱃지</Text>
									{mbData?.badge ? <Tag type={'badge2'} tag={configOptions?.badges?.find(x => x?.idx === mbData?.badge)?.label} /> : (
										<Text style={{ ...rootStyle.font(16, colors.text757575, fonts.medium) }}>-</Text>
									)}
								</View>
							</TouchableOpacity>

							<View style={[{ backgroundColor: colors.white, borderRadius: 20, padding: 14 }]}>
								<TouchableOpacity style={[rootStyle.flex, { justifyContent: 'space-between' }]} activeOpacity={0.7} onPress={() => {
									// router.push(routes.certHometax);
									router.push(routes.storeAdd);
								}}>
									<View style={[rootStyle.flex, { flex: 1, gap: 10, justifyContent: 'flex-start' }]}>
										<Image source={images.my_store} style={rootStyle.default40} />
										<Text style={{ ...rootStyle.font(16, colors.textPrimary, fonts.medium) }}>가게 정보</Text>
									</View>
									<Text style={{ ...rootStyle.font(13, colors.primaryBright, fonts.semiBold), paddingHorizontal: 10 }}>매장 추가</Text>
								</TouchableOpacity>

								{mbData?.store?.length > 0 && (
									<View style={{ marginTop: 10, paddingTop: 6, borderTopColor: colors.f4f4f5, borderTopWidth: 1 }}>
										{mbData?.store?.map((x, i) => {
											return (
												<TouchableOpacity key={i} style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 10 }]} activeOpacity={0.7} onPress={() => {
													router.push({
														pathname: routes.myStore,
														params: {
															idx: x?.idx
														}
													});
												}}>
													<Text style={{ ...rootStyle.font(16, colors.textPrimary, fonts.medium) }}>{x?.title}</Text>
													<Image source={images.link} style={rootStyle.default} />
												</TouchableOpacity>
											)
										})}
									</View>
								)}
								
							</View>

							<View style={[{ backgroundColor: colors.white, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 }]}>
								{links?.map((x, i) => {
									return (
										<TouchableOpacity key={i} style={[rootStyle.flex, { justifyContent: 'flex-start', paddingVertical: 14, gap: 8 }]} activeOpacity={0.7} onPress={() => {
											router.push(x.route);
										}}>
											<Image source={x?.icon} style={rootStyle.default20} />
											<Text style={{ ...rootStyle.font(16, colors.textPrimary, fonts.medium) }}>{x?.title}</Text>
										</TouchableOpacity>
									)
								})}
							</View>


						</View>

					</View>
{/* 
					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							gap: 20,
							paddingHorizontal: rootStyle.side,
						}}
					>
						<View>
							<Text>MODE - {__DEV__ ? "Debug" : "Release"}</Text>
						</View>

						{!mbData ? (
							<Button onPress={loginFunc}>로그인 하기</Button>
						) : (
							<Button onPress={logout}>로그아웃</Button>
						)}

						<Button onPress={badgeFunc}>뱃지 획득</Button>
					</View>
					 */}
				</ScrollView>
			</View>

			<Popup page={'my'}/> 
		</Layout>
	);
}
