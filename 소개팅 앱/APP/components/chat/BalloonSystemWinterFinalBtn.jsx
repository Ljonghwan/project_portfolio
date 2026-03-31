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

import { useCountdown } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();

    const user = users?.find(v => v.idx !== mbData?.idx);
    
    const countdown = useCountdown(dayjs((item?.data?.time) * 1000).toISOString());

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={chatImages.chat_winter_icon1} style={rootStyle.default26} transition={200} tintColor={chatTheme?.primary}/>

            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(16, colors.black, fonts.medium )}}>{item?.message}</AnimatedText>


            <View style={[ rootStyle.flex, { width: '100%', gap: 5, backgroundColor: colors.white, height: 36, borderRadius: 8 }]}>
                <Image source={chatImages.chat_time} style={{ width: 16, height: 18 }} transition={200} tintColor={chatTheme?.primary} />
                <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(14, chatTheme?.primary, fonts.regular )}}>남은 시간</AnimatedText>
                <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(14, chatTheme?.primary, fonts.medium )}}>
                    {(room?.userAccept !== 1 && room?.visualAccept !== 1) ? '00:00:00' : countdown?.formatted}
                </AnimatedText>
            </View>

            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>
                {item?.data?.text}
            </AnimatedText>
            

            {countdown?.isFinished || (mbData?.level === 1 && room?.userAccept !== 1) || (mbData?.level === 2 && room?.visualAccept !== 1) ? (
                <AnimatedBackground bg={colors.grey6} style={styles.button}>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>
                        {`이미 선택이 완료 됐습니다.`}
                    </Text>
                </AnimatedBackground>
            ) : (
                <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                    router.navigate({
                        pathname: routes.chatFinal,
                        params: {
                            roomIdx: item?.roomIdx,
                            superPicket: room?.superPicket || 0
                        }
                    })
                }}>
                    <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                        <Text style={{...rootStyle.font(14, colors.white, fonts.medium )}}>{`선택하러 가기`}</Text>
                        <Image source={images.link_white} style={rootStyle.default} transition={200}/>
                    </AnimatedBackground>
                </TouchableOpacity>
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