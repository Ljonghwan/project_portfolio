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

import HeartSend from '@/components/popups/HeartSend';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useEtc, useUser, useAlert } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { imageViewer, ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { mbData } = useUser();
    
    const onPress = () => {
        if(item?.data?.status) return;

        openAlertFunc({
            component: <HeartSend user={users?.find(v => v?.idx !== mbData?.idx)} roomIdx={room?.idx} />,
            input: 200
        })   
    }
    
    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={images.chat_heart_send} style={[rootStyle.default32]} transition={200} tintColor={chatTheme?.primary} />

            <AnimatedText color={chatTheme?.primary} style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{item?.message}</AnimatedText>
            <Text style={{ ...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular), lineHeight: 20, textAlign: 'center' }}>{`진심 어린 메시지를 전달해 보세요.\n상대방의 마음을 돌릴 수 있는 마지막 기회에요!`}</Text>

            <View>
                <Text style={{ ...rootStyle.font(11, colors.text_info, fonts.regular), lineHeight: 20, textAlign: 'center' }}>{item?.data?.subMessage}</Text>
            </View>

            <View style={[rootStyle.flex, { width: '100%', gap: 13 }]}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onPress}>
                    <AnimatedBackground bg={item?.data?.status ? colors.grey6 : chatTheme?.primary} style={styles.button}>
                        <Image source={images.heart2} style={[rootStyle.default18]} transition={200} tintColor={colors.white} />
                        <Text style={{ ...rootStyle.font(14, colors.white, fonts.medium), letterSpacing: -0.5 }}>{ item?.data?.status ? `마음 전하기 완료` : `마음 전하기`}</Text>
                    </AnimatedBackground>
                </TouchableOpacity>

                {/* <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onPressExit}>
                    <AnimatedBackground bg={colors.grey6} style={[styles.button, { gap: 2 }]}>
                        <Image source={images.chat_system_leave} style={rootStyle.default} transition={200} tintColor={colors.white} />
                        <Text style={{ ...rootStyle.font(14, colors.white, fonts.medium), letterSpacing: -0.5 }}>{`나가기`}</Text>
                    </AnimatedBackground>
                </TouchableOpacity> */}
            </View>

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
            gap: 8,
            borderRadius: 16,
            width: '100%',
            height: 52,
        },



    })

    return { styles }
}