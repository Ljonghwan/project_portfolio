import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';

import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import ListText from '@/components/ListText';
import Loading from '@/components/Loading';

import Simple from '@/components/badges/Simple';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useEtc, useUser } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { imageViewer, numFormat } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, room, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={item?.data?.status ? images.final_accept : images.final_sad} style={rootStyle.default26} transition={200} tintColor={chatTheme?.primary}/>

            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(16, colors.black, fonts.medium ), lineHeight: 20 }}>{item?.message}</AnimatedText>
            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(14, colors.black, fonts.regular ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>{item?.data?.subMessage}</AnimatedText>


            {item?.data?.status && (
                <View style={{ width: '100%', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: chatTheme?.primary, paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.white }}>
                    <Text style={{...rootStyle.font(16, chatTheme?.primary, fonts.semiBold ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>만남 인증 시 전달되는 슈퍼 픽켓</Text>

                    <View style={[rootStyle.flex, { gap: 4 }]}>
                        <Image source={images.super_picket} style={rootStyle.default20} transition={200}/>
                        <Text style={{...rootStyle.font(18, chatTheme?.primary, fonts.semiBold ) }}>{numFormat(room?.superPicket)}장</Text>
                    </View>
                </View>
            )}
          
        </AnimatedBackground>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        root: {
            padding: 12,
            borderRadius: 24,
            gap: 16,
            borderWidth: 1,
            alignItems: 'center',
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 16,
            width: '100%',
            height: 48,
        },
     
     
      
	})

  	return { styles }
}