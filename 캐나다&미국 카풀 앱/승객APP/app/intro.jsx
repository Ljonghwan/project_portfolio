import { useEffect } from 'react';
import { ScrollView, StyleSheet, View, ImageBackground } from 'react-native';

import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image';
import lodash from 'lodash';

import Button from '@/components/Button';
import Layout from '@/components/Layout';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import consts from '@/libs/consts';


import { startBackgroundGps } from '@/libs/utils';

import { useConfig, useAlert, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();

    const { introComment } = useConfig();
    const { openAlertFunc } = useAlert();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();
    
    useEffect(() => {
        setTimeout(() => {
            router.replace(routes.login)
        }, 2000)
    }, [])

    const testFunc = () => {
        startBackgroundGps();
        return;
        
        openAlertFunc({
            label: `소개팅 종료`,
            title: `채팅방을 나가면 대화내용이\n모두 삭제되고 채팅목록에서도 사라집니다.`,
            onCencleText: "닫기",
            onPressText: "확인",
            onCencle: () => {},
            onPress: () => {}
        })
        return;
        
    }

    return (
        <Layout statusBar={'light'}>

            <ImageBackground source={images.intro} resizeMode="cover" style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Text style={styles.comment}>{introComment}</Text>
                </View>
            </ImageBackground>
            
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		
        container: {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: "center",
            paddingHorizontal: 32,
            paddingBottom: 62
        },
        comment: {
            color: colors.sub_3,
            fontSize: 30,
            lineHeight: 50,
            wordWrap: 'wrap'
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