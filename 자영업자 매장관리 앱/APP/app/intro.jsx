
import { useRouter } from 'expo-router';

import React, { useRef, useState } from 'react';
import {
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Text from '@/components/Text';

import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';

import { useConfig } from '@/libs/store';


const ONBOARDING_DATA = [
	{
		id: '1',
		image: 'onboarding1',
		title: '사장님의 하루, 오너톡으로 시작해볼까요?',
		description: '매출 확인, 출근 체크, 원자재 가격 변동 추이까지\n바쁜 하루의 시작을 오너톡에서 한눈에 확인하세요.',
	},
	{
		id: '2',
		image: 'onboarding2',
		title: '자영업 필수 기능, 한 곳에 모두 담았어요!',
		description: '관리하기 어려운 일용직 관리부터\n계약서, 고객 관리, 이벤트까지\n사장님을 위한 스마트한 업무 도우미입니다.',
	},
	{
		id: '3',
		image: 'onboarding3',
		title: '다른 사장님들과 소통도 놓치지 마세요!',
		description: '인증된 사장님들만 모인 커뮤니티에서\n노하우를 공유하고, 함께 성장할 수 있어요.',
	},
];

export default function Intro() {

    const { styles } = useStyle();
	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	const router = useRouter();

	const { setIntro } = useConfig();

	const [currentIndex, setCurrentIndex] = useState(0);
	const flatListRef = useRef(null);

	const handleSkip = () => {
		setIntro(true);
		router.replace(routes.login);
	};

	const handleNext = () => {
		if (currentIndex < ONBOARDING_DATA.length - 1) {
			const nextIndex = currentIndex + 1;
			flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
			// setCurrentIndex(nextIndex);
		} else {
			handleSkip();
		}
	};

	const onViewableItemsChanged = useRef(({ viewableItems }) => {
		if (viewableItems.length > 0) {
			setCurrentIndex(viewableItems[0].index);
		}
	}).current;

	const renderItem = ({ item }) => (
		<View style={styles.slide}>
			{/* <View style={styles.imageContainer}>
				<Image source={item.image} style={styles.image} resizeMode="contain" />
			</View> */}
			<View style={styles.textContainer}>
				<Text style={styles.title}>{item.title}</Text>
				<Text style={styles.description}>{item.description}</Text>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
				<Text style={styles.skipText}>건너뛰기</Text>
			</TouchableOpacity>

			<View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: insets?.top, height: width < 330 ? '55%' : '60%' }}>
				<Image source={images?.[ONBOARDING_DATA?.[currentIndex]?.image]} style={styles.image} transition={100}/>
			</View>

			<View style={styles.footer}>
				<View style={styles.paginationContainer}>
					<View style={styles.pagination}>
						{ONBOARDING_DATA.map((_, index) => (
							<View
								key={index}
								style={[
									styles.dot,
									currentIndex === index && styles.activeDot,
								]}
							/>
						))}
					</View>
				</View>

				<FlatList
					ref={flatListRef}
					data={ONBOARDING_DATA}
					renderItem={renderItem}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					keyExtractor={(item) => item.id}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={{
						itemVisiblePercentThreshold: 50,
					}}
					bounces={false}
				/>

				<View style={styles.btn}>
					{currentIndex < ONBOARDING_DATA.length - 1 ? (
						<TouchableOpacity
							style={styles.arrowButton}
							onPress={handleNext}
							activeOpacity={0.8}
						>
							<Image source={images.arrowNext} style={styles.arrowIcon} />
						</TouchableOpacity>
					) : (
						<Button onPress={handleNext}>오너톡 시작하기</Button>
					)}
				</View>
			</View>

			{/* <View style={styles.footer}>
				<View style={styles.paginationContainer}>
					<View style={styles.pagination}>
						{ONBOARDING_DATA.map((_, index) => (
							<View
								key={index}
								style={[
									styles.dot,
									currentIndex === index && styles.activeDot,
								]}
							/>
						))}
					</View>
				</View>

				{currentIndex < ONBOARDING_DATA.length - 1 ? (
					<TouchableOpacity
						style={styles.arrowButton}
						onPress={handleNext}
						activeOpacity={0.8}
					>
						<Image source={images.arrowNext} style={styles.arrowIcon} />
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={styles.nextButton}
						onPress={handleNext}
						activeOpacity={0.8}
					>
						<Text style={styles.nextButtonText}>오너톡 시작하기</Text>
					</TouchableOpacity>
				)}
			</View> */}
		</View>
	);
}

const useStyle = () => {

	const { width, height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({

		skipButton: {
			position: 'absolute',
			top: 55,
			right: 40,
			zIndex: 10,
			paddingVertical: 8,
		},
		skipText: {
			fontFamily: fonts.medium,
			fontSize: 18,
			color: colors.onboardingOrange,
		},


		container: {
			flex: 1,
			backgroundColor: colors.onboardingBg,
		},
		image: {
			width: 250,
			height: 250
		},
		footer: {
			flex: 1,
			backgroundColor: colors.white,
			borderTopLeftRadius: 40,
			borderTopRightRadius: 40,
			paddingTop: 23,
			
			// paddingHorizontal: 35,
			// paddingBottom: 100,
		},



		paginationContainer: {
			width: '100%',
			alignItems: 'center',
			marginBottom: 32,
		},
		pagination: {
			flexDirection: 'row',
			gap: 8,
		},
		dot: {
			width: 9,
			height: 4,
			borderRadius: 2,
			backgroundColor: colors.placeholder,
		},
		activeDot: {
			backgroundColor: colors.onboardingOrange,
		},





		slide: {
			width: width,
			height: '100%',
			paddingHorizontal: 20,
			justifyContent: 'flex-start',
			paddingTop: 20
		},
		title: {
			fontFamily: fonts.semiBold,
			fontSize: 20,
			color: colors.black,
			textAlign: 'center',
			lineHeight: 28,
			marginBottom: 24,
		},
		description: {
			fontFamily: fonts.medium,
			fontSize: 16,
			color: colors.onboardingTextDark,
			textAlign: 'center',
			lineHeight: 25,
		},




		btn: {
			position: 'absolute',
			bottom: insets?.bottom + 20,
			left: 0,
			width: '100%',
			alignItems: 'flex-end',
			paddingHorizontal: 35
		},
		arrowButton: {
			width: 68,
			height: 68,
			borderRadius: 28,
			backgroundColor: colors.onboardingOrange,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: colors.placeholder,
			shadowOffset: {
				width: 0,
				height: 18,
			},
			shadowOpacity: 1,
			shadowRadius: 10,
			elevation: 10,
		},
		arrowIcon: {
			width: 32,
			height: 32,
		},
		nextButton: {
			width: '100%',
			height: 56,
			backgroundColor: colors.onboardingOrange,
			borderRadius: 10,
			alignItems: 'center',
			justifyContent: 'center',
		},
		nextButtonText: {
			fontFamily: fonts.semiBold,
			fontSize: 15,
			color: colors.white,
		},

















		// slide: {
		// 	width: SCREEN_WIDTH,
		// 	height: SCREEN_HEIGHT,
		// },
		// imageContainer: {
		// 	flex: 1,
		// 	justifyContent: 'center',
		// 	alignItems: 'center',
		// 	paddingTop: 100,
		// },
		// image: {
		// 	width: 220,
		// 	height: 220
		// },
		// textContainer: {
		// 	backgroundColor: colors.white,
		// 	borderTopLeftRadius: 40,
		// 	borderTopRightRadius: 40,
		// 	paddingTop: 40,
		// 	paddingHorizontal: 35,
		// 	paddingBottom: 100,
		// 	minHeight: 360,
		// },




	});

	return { styles }
}
