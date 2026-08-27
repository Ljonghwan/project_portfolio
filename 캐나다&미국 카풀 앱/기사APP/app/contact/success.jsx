import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { mbData, login } = useUser();

    return (
        <View
            style={styles.root}
        >
            <View style={{ gap: 11 }}>
                <Text style={styles.title}>{lang({ id: 'your_inquiry_has' })}</Text>
                <Text style={styles.subTitle}>{lang({ id: 'our_support_team' })}</Text>
            </View>
            
            <View style={{ gap: 14, width: '100%' }}>
                <Button onPress={() => { router.dismissTo(routes.my) }}>{lang({ id: 'my_page' })}</Button>
                <Button onPress={() => { router.replace(routes.contact) }}>{lang({ id: 'support_history' })}</Button>
            </View>
        </View>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: rootStyle.side,
            gap: 52,
		},
        title: {
            color: colors.main,
            fontSize: 40,
            fontFamily: fonts.goudy,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
            textAlign: 'center'
        },
       
	})

  	return { styles }
}