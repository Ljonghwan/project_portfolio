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
import chatStyle from '@/libs/chatStyle';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { imageViewer } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();

    const user = users?.find(v => v.idx === item?.data?.userIdx);
    const isMe = user?.idx === mbData?.idx;
    return (
        <View 
            style={[
                styles.root, 
                { 
                    backgroundColor: isMe ? chatStyle?.chat_season_5?.reviewWait : chatStyle?.chat_season_5?.reviewWait2,
                    borderTopLeftRadius: isMe ? 20 : 0,
                    borderTopRightRadius: isMe ? 0 : 20,
                    flexDirection: isMe ? 'row-reverse' : 'row',
                }
            ]}
        >
            <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: colors.greyD9 }} transition={200}/>

            <View style={{ flex: 1 }}>
                <Text style={{...rootStyle.font(14, isMe ? colors.black : colors.white, fonts.regular ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>{item?.message}</Text>
            </View>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 12,
            paddingVertical: 16,
            borderRadius: 20,
            gap: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
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