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

            <Image source={images.picket} style={[rootStyle.picket, { width: 26 }]} transition={200} tintColor={chatTheme?.primary} />

            <Text style={{...rootStyle.font(16, colors.black, fonts.medium )}}>{item?.message}</Text>
            <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>
                {mbData?.level === 1 && item?.data?.receiveStatus !== 1 && `${user?.name}님이 `}
                <Text style={{ fontFamily: fonts.semiBold }}>픽켓 {item?.data?.count}장</Text>
                {item?.data?.receiveStatus === 2 ? '을 수령했습니다.' : item?.data?.receiveStatus === 3 ? `을 거절했습니다.` : `을 전달했습니다.`}
            </Text>
            
            {
                item?.data?.receiveStatus !== 1 ? (
                    <AnimatedBackground bg={colors.grey6} style={styles.button}>
                        <Image source={images.alert_info} style={rootStyle.default} transition={200} tintColor={colors.white} />
                        <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>
                            {item?.data?.receiveStatus === 2 ? `이미 받은 픽켓입니다.` : `${user?.name}님이 거절했어요.`}
                        </Text>
                    </AnimatedBackground>
                ) : (

                    mbData?.level === 1 ? (
                        <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                            <Image source={images.picket} style={[rootStyle.picket, { width: 17 }]} transition={200} tintColor={colors.white}/>
                            <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>
                                {`${user?.name}님이 결정중입니다.`}
                            </Text>
                        </AnimatedBackground>
                    ) : (
                        <View style={[ rootStyle.flex, { width: '100%', gap: 13 }]}>
                            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => submitFunc(true)}>
                                <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                                    <Image source={images.picket} style={[rootStyle.picket, { width: 17 }]} transition={200} tintColor={colors.white}/>
                                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>{`픽켓 ${item?.data?.count}장 받기`}</Text>
                                </AnimatedBackground>
                            </TouchableOpacity>
        
                            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={rejectAlert}>
                                <AnimatedBackground bg={colors.grey6} style={styles.button}>
                                    <Image source={images.chat_picket_reject} style={rootStyle.default16} transition={200} tintColor={colors.white}/>
                                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>{`거절하기`}</Text>
                                </AnimatedBackground>
                            </TouchableOpacity>
                        </View>
                    )
                    
                )
            }


            
            

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
            gap: 6,
            borderRadius: 16,
            width: '100%',
            height: 48,
        },
     
     
      
	})

  	return { styles }
}