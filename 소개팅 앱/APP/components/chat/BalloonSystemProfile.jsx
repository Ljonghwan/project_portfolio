import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
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

            <Image source={chatImages.chat_question} style={rootStyle.default36} tintColor={chatTheme?.primary} transition={200}/>

            <Text style={{...rootStyle.font(16, colors.black, fonts.medium )}}>{item?.message}</Text>
            <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular ), textAlign: 'center' }}>{item?.data?.subMessage}</Text>
            
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                if(user?.status !== 1) return;
                // router.navigate({
                //     pathname: routes.chatSuperpicketInfo,
                // })
                // return;

                router.navigate({
                    pathname: routes.chatProfile,
                    params: {
                        idx: user?.idx,
                        roomIdx: item?.roomIdx
                    }
                })
            }}>
                <AnimatedBackground bg={chatTheme?.primary} style={styles.profileBox}>
                    <Image source={user?.status !== 1 ? images.profile_leave : user?.profile ? consts.s3Url + user?.profile : images.profile} style={styles.profile}/>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium )}}>{`“${user?.name}”님 더 알아보기`}</Text>
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
            gap: 13,
            borderWidth: 1,
            alignItems: 'center',
        },
        profileBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 16,
            width: '100%',
            height: 48,
        },
        profile: {
            width: 24,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        name: {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            flex: 1
        }
      
	})

  	return { styles }
}