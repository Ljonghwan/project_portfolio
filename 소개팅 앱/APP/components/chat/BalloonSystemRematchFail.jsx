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
    

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={chatImages.chat_system_rematch_fail} style={[rootStyle.default36]} transition={200} tintColor={chatTheme?.primary} />

            <Text style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{item?.message}</Text>
            <Text style={{ ...rootStyle.font(width <= 320 ? 12 : 14, colors.black, fonts.regular), lineHeight: 20, textAlign: 'center' }}>{`상대방과의 대화가 최종적으로 마무리되었습니다.`}</Text>
{/*            
            <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={onPressExit}>
                <View style={styles.button}>
                    <Text style={{ ...rootStyle.font(16, colors.white, fonts.medium), letterSpacing: -0.5 }}>{`채팅방 나가기`}</Text>
                </View>
            </TouchableOpacity> */}
            
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
            backgroundColor: colors.grey6,
        },



    })

    return { styles }
}