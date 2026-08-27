import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Stack, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import { ToastMessage, setBadgeCount, deductedCount, getBadgeCount } from '@/libs/utils';

import { useUser, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { styles } = useStyle();
    const { openAlertFunc } = useAlert();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const [photo1, setphoto1] = useState('');

    useEffect( () => {
       
        // setBadgeCount(2);

    }, [])

    const testFunc = () => {
        openPhotoFunc({
            setPhoto: (v) => setphoto1(v),
            title: '프로필 사진',
            deleteButton: photo1 ? true : false,
            selectionLimit: 5
        })
    }
    return (
        <Layout backgroundColor={"#0D0E2D"} header={false} input={false} statusBar={'light'}>
            <View
                style={styles.root}
            >
                <View style={styles.container}>
                    <Image source={images.logo} style={styles.logo} />
                    
                    <View>
                        <Text style={styles.title}>소개팅은 ‘외모’가 중요하다</Text>
                        <Text style={styles.subtitle}>사소한 1% 소개팅</Text>
                    </View>
                </View>
                <Button onPress={() => { 
                    // deductedCount(2); // 뱃지 현재수 - 2로 감소
                    // testFunc();
                    router.replace(routes.login)
                }}>시작하기</Button>
            </View>
           
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            justifyContent: 'space-between',
            alignItems: "center",
            gap: 40,
            paddingHorizontal: 20,
            paddingBottom: insets?.bottom || 20
		},
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: "center",
            gap: 40,
        },
        logo: {
            height: 100,
            aspectRatio: "9/10",
        },
		title: {
            color: colors.white,
            fontSize: 24,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        subtitle: {
            color: colors.white,
            fontFamily: fonts.medium,
            fontSize: 28,
            textAlign: 'center'
        },
       
	})

  	return { styles }
}