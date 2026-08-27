import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';

import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import HiddenText from '@/components/HiddenText';
import Loading from '@/components/Loading';

import Simple from '@/components/badges/Simple';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useAlert, useUser } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import chatStyle from '@/libs/chatStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';

import API from '@/libs/api';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { mbData } = useUser();

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={images.chat_today} style={[rootStyle.default26]} transition={200} tintColor={chatTheme?.primary} />

            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(16, chatTheme?.primary, fonts.medium )}}>
                {`최종 커플 `}
                <AnimatedText color={chatTheme?.primary} style={{ fontFamily: fonts.semiBold, fontSize: 16 }}>{`“${item?.data?.count}”호`}</AnimatedText>
                {`가 탄생했어요!`}
            </AnimatedText>

            <View style={{ gap: 8 }}>
                <View style={[rootStyle.flex, { gap: 4, }]}>
                    <Image source={chatImages.chat_season_5_report_1} style={rootStyle.default20} tintColor={chatTheme?.primary}/>
                    <AnimatedText color={chatTheme?.primary} style={{ fontSize: 14, fontFamily: fonts.medium }}>선택회원</AnimatedText>
                </View>
                <HiddenText 
                    text={`“${item?.data?.userMessage || '작성 대기 중입니다'}”`}
                    color={colors.dark} 
                    style={{ width: 260 }} 
                    align={'center'}
                />
            </View>

            <View style={{ gap: 8 }}>
                <View style={[rootStyle.flex, { gap: 4, }]}>
                    <Image source={chatImages.chat_season_5_report_8} style={{ width: 18, height: 20 }} tintColor={chatTheme?.primary}/>
                    <AnimatedText color={chatTheme?.primary} style={{ fontSize: 14, fontFamily: fonts.medium }}>1% 회원</AnimatedText>
                </View>
                <HiddenText 
                    text={`“${item?.data?.visualMessage || '작성 대기 중입니다'}”`}
                    color={colors.dark} 
                    style={{ width: 260 }} 
                    align={'center'}
                />
            </View>

            
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                router.navigate({
                    pathname: routes.chatToday,
                    params: {
                        roomIdx: room?.roomIdx
                    }
                })
            }}>
                <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>{`오늘의 최종 커플 확인하기`}</Text>
                    <Image source={images.link_white} style={rootStyle.default} transition={200}/>
                </AnimatedBackground>
            </TouchableOpacity>
            

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