import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, user }) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const [ load, setLoad ] = useState(false);

    return (
        <View style={[styles.buttonBox]}>

            <View style={styles.itemBallonSystem}>
                <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                    <Image source={images.time_main} style={rootStyle.default20} />
                    <Text style={[styles.itemBallonSystemText, { fontFamily: fonts.medium, color: colors.main }]}>{item?.message}</Text>
                </View>
                <Text style={[styles.itemBallonSystemText, {  }]}>{item?.data?.text}</Text>
            </View>

            {/* <Button type={3} style={{ flex: 1 }}>프로필 피드백 작성하기</Button> */}
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        buttonBox: {
            maxWidth: '100%',
        },
        button: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            borderRadius: 8,
            backgroundColor: colors.main,
        },
        buttonText: {
            color: colors.white,
            textAlign: "center",
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 52,
        },
        
        itemBallonSystem: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.system,
            borderRadius: 12,
            flex: 1,
            gap: 8
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
        },
	})

  	return { styles }
}