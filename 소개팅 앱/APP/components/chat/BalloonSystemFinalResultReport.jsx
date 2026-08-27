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
import chatStyle from '@/libs/chatStyle';

import { numFormat, formatTime } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();

    return (
        <AnimatedBackground bg={item?.data?.status ? chatStyle?.chat_season_4?.finalResultReport : chatStyle?.chat_season_4?.systemBackgroundColor} style={[styles.root, { borderColor: chatStyle?.chat_season_4?.primary }]}>

            <Image source={chatImages.chat_system_final_report2} style={rootStyle.default36} transition={200} tintColor={chatTheme?.primary} />

            <Text style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center' }}>{item?.message}</Text>

            <AnimatedText color={chatTheme.primary} style={{ ...rootStyle.font(14, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{`최종 전달 픽켓 : ${numFormat(item?.data?.picket)}장`}</AnimatedText>

            <AnimatedBackground bg={item?.data?.status ? chatStyle?.chat_season_5?.reviewHpButton : chatStyle?.chat_season_4?.finalResultReport} style={[styles.refundBox, {  }]}>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={images.picket} style={[rootStyle.picket, { width: 21 }]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(14, colors.black), lineHeight: 20 }}>{`선물받은 픽켓 : ${numFormat(item?.data?.picket)}장`}</Text>
                </View>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={chatImages.chat_season_5_report_4} style={[rootStyle.default20]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(14, colors.black), lineHeight: 20 }}>{`전화 : ${formatTime(item?.data?.callTime)}`}</Text>
                </View>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={chatImages.chat_system_end_status} style={[rootStyle.default20]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(width <= 340 ? 12 : 14, colors.black), lineHeight: 20 }}>{`종료상태 : ${item?.data?.endStatus}`}</Text>
                </View>
            </AnimatedBackground>
        </AnimatedBackground>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            padding: 12,
            borderRadius: 24,
            gap: 12,
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
        refundBox: {
            borderRadius: 16,
            padding: 16,
            paddingVertical: 20,
            width: '100%',
            gap: 18,
            // backgroundColor: colors.white,
        },


    })

    return { styles }
}