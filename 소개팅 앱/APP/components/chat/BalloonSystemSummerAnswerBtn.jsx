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

            <Image source={chatImages.chat_season_2} style={rootStyle.default} transition={200}/>

            <Text style={{...rootStyle.font(16, colors.black, fonts.medium )}}>{item?.message}</Text>
            <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>{item?.data?.subMessage}</Text>
            <Text style={{ ...rootStyle.font(12, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>• 해당 컨텐츠는 가을(3일차)에 확인 할 수 있습니다.</Text>
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                // router.navigate({
                //     pathname: routes.chatSuperpicketInfo,
                // })
                // return;

                router.navigate({
                    pathname: routes.season_2,
                    params: {
                        roomIdx: item?.roomIdx,
                        mode: 'answer'
                    }
                })
            }}>
                <AnimatedBackground bg={chatTheme?.primary} style={styles.button}>
                    <Image source={images.chat_write} style={rootStyle.default} transition={200}/>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium )}}>{`질문에 답변하기`}</Text>
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