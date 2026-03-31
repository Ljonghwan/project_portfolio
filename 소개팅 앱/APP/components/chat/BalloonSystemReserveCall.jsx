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

import { useConfig, useAlert, useUser } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';

import API from '@/libs/api';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { mbData } = useUser();

    const user = users?.find(v => v.level === 2);

    const rejectAlert = () => {
        openAlertFunc({
            icon: images.warning,
            title: '정말 픽켓을 거절하시겠습니까?',
            onCencleText: "한번 더 생각할게요",
            onPressText: "거절하기",
            onCencle: () => { },
            onPress: () => {
                submitFunc(false)
            }
        })
    }

    const submitFunc = async (status=true) => {

        let sender = {
            chatIdx: item?.idx,
            historyIdx: item?.data?.historyIdx,
            isReceived: status
        }


        const { data, error } = await API.post('/v1/chat/receiveFlirting', sender);
        
        if (error) {
            ToastMessage(error?.message);
            return;
        }

        // ToastMessage('픽켓 거절이 완료되었습니다.');
        // router.back();

    }

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={chatImages.chat_reserve_call} style={[rootStyle.default]} transition={200} tintColor={chatTheme?.primary} />

            <View style={{ gap: 4, alignItems: 'center' }}>
                <Text style={{...rootStyle.font(14, colors.text_info, fonts.regular )}}>{dayjs(item?.data?.reservationAt).format('YYYY-MM-DD HH:mm')}</Text>
                <Text style={{...rootStyle.font(14, colors.black, fonts.medium )}}>{item?.message}</Text>
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
            gap: 24,
            borderWidth: 1,
            alignItems: 'center',
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 16,
            width: '100%',
            height: 48,
        },
     
     
      
	})

  	return { styles }
}