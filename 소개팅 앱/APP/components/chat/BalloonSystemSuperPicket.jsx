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

import { imageViewer } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();

    const user = users?.find(v => v.idx !== mbData?.idx);
    
    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image source={chatImages.chat_ticket} style={[{ width: 24, height: 24 }]} transition={200} tintColor={chatTheme?.primary} />
                <Image source={chatImages.chat_ticket_star} style={[{ width: 8.35, height: 8, position: 'absolute' }]} />
            </View>

            <Text style={{...rootStyle.font(width <= 360 ? 14 : 16, colors.black, fonts.medium ), textAlign: 'center' }}>{item?.message}</Text>
            <Text style={{...rootStyle.font(width <= 360 ? 12 : 14, colors.black, fonts.regular ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>
                {item?.data?.subMessage}
            </Text>
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                router.navigate({
                    pathname: routes.chatSuperpicketInfo,
                })
            }}>
                <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                    <Image source={images.search} style={rootStyle.default20} tintColor={colors.white} transition={200}/>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium )}}>{`슈퍼 픽켓 알아보기`}</Text>
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