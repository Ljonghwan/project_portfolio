import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { Redirect, Stack, router, Slot, usePathname } from "expo-router";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import Layout from '@/components/Layout';
import Text from '@/components/Text';

import { useUser, useAlert, useSignData } from '@/libs/store';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import lang from '@/libs/lang';

import { useBackHandler } from '@/libs/utils';

export default function RootLayout() {

	const pathname = usePathname();

	const { openAlertFunc } = useAlert();
	const { mbData } = useUser();
	const { level, type, setSignData } = useSignData();

	useBackHandler(() => {
		closeFunc();
		return true;
	});

	const closeFunc = () => {
		if (pathname.includes(routes.joinSuccess)) {
			setSignData('init');
			router.dismissTo(routes.login);
			return;
		} else {
			openAlertFunc({
				label: '회원가입 취소',
				title: '회원가입을 취소하시겠어요?\n가입 취소시 첫 페이지로 이동합니다.',
				onCencleText: '닫기',
				onPressText: '가입 취소',
				onCencle: () => { },
				onPress: () => {
					setSignData('init');
					router.dismissTo(routes.login);
				}
			})
		}

	}

	// 현재 페이지에 따른 프로그레스 계산
	const getProgress = () => {
		if (pathname.includes(routes.joinNick)) return 1;
		if (pathname.includes(routes.joinEmail)) return 2;
		if (pathname.includes(routes.joinForm)) return 3;
		return 0;
	};

	const progress = getProgress();
	const progressWidth = (progress / (level === 2 ? 2 : 3) ) * 100;

	const header = {
		title: "회원가입",
		left: {
			icon: 'back',
			onPress: closeFunc
		},
	};

	const headerHometax = {
		title: "홈택스 간편인증",
		left: {
			icon: 'back',
			onPress: closeFunc
		},
	};

	const headerEnd = {
		title: "회원가입",
		right: {
			icon: 'exit',
			onPress: () => {
				router.dismissAll();
				router.replace(routes.tabs);
			}
		}
	}

	return (
		<Layout 
			header={
				pathname.includes(routes.joinSuccess) ? headerEnd 
				: header
			} 
			backgroundColor={colors.white} 
			statusBar={'dark'}
		>
			{/* 프로그레스바 */}
			{(progress > 0 && type === 'account') && (
				<Animated.View entering={FadeIn} exiting={FadeOut} style={styles.progressContainer}>
					<View style={styles.progressBar}>
						<View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
					</View>
				</Animated.View>
			)}

			<Stack screenOptions={{ headerShown: false }} />
		</Layout>
	)
}

const styles = StyleSheet.create({
	progressContainer: {
		paddingHorizontal: 28,
		paddingTop: 12,
		backgroundColor: colors.white,
	},
	progressBar: {
		height: 6,
		backgroundColor: colors.lightGray,
		borderRadius: 20,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: colors.primaryBright,
		borderRadius: 20,
	},
});
