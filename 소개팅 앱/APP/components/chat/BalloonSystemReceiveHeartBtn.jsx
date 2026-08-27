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

import HeartReceive from '@/components/popups/HeartReceive';

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
        openAlertFunc({
            component: (
                <HeartReceive 
                    user={users?.find(v => v?.idx !== mbData?.idx)} 
                    message={item?.data?.noteContent} 
                    onSubmit={onSubmit}
                    status={item?.data?.status || room?.status !== 8}
                />
            ),
        })   
    }

    const onSubmit = async () => {

        if(item?.data?.status) return;

        const sender = {
            roomIdx: room?.idx,
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/chat/resumeChat', sender);

        console.log('data', data, error);

        if (error) {
            ToastMessage(error?.message);
            return;
        }
    }


    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={images.chat_heart_send} style={[rootStyle.default32]} transition={200} tintColor={chatTheme?.primary} />

            <AnimatedText color={chatTheme?.primary} style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{item?.message}</AnimatedText>
           
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={onPress}>
                <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                    <Text style={{ ...rootStyle.font(16, colors.white, fonts.medium), letterSpacing: -0.5 }}>{`마음 확인하기`}</Text>
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
            gap: 8,
            borderRadius: 16,
            width: '100%',
            height: 52,
        },



    })

    return { styles }
}