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

            <Image source={images.chat_system_leave} style={[rootStyle.default36]} transition={200} tintColor={chatTheme?.primary} />

            <Text style={{...rootStyle.font(16, colors.black, fonts.medium ), textAlign: 'center', lineHeight: 20 }}>{item?.message}</Text>
            <View>
                <Text style={{ ...rootStyle.font(11, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>{item?.data?.subMessage}</Text>
                {/* <Text style={{ ...rootStyle.font(11, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>{`• 12시간의 종료대기 시간이 주어졌습니다.\n해당 시간이 초과되면 최종적으로 소개팅이 종료됩니다.`}</Text>
                <Text style={{ ...rootStyle.font(11, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center'  }}>{`• 환불은 영업일 기준 3일 이내, 오후 18시까지 순차적으로 완료됩니다.`}</Text> */}
            </View>

            {mbData?.level === 1 && item?.data?.refundIdx && (
                <TouchableOpacity style={{ width: '100%' }} activeOpacity={1} onPress={() => {
                    if (item?.data?.status) return;

                    router.navigate({
                        pathname: routes.refundDetail,
                        params: {
                            idx: item?.data?.refundIdx
                        }
                    })
                }}>
                    <AnimatedBackground bg={item?.data?.status ? colors.grey6 : chatTheme?.primary} style={styles.button}>
                        <Text style={{...rootStyle.font(16, colors.white, fonts.medium )}}>{item?.data?.status ? `환불 정보 입력완료` : `환불 정보 입력하기`}</Text>
                    </AnimatedBackground>
                </TouchableOpacity>
            )}
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
            height: 52,
        },
     
     
      
	})

  	return { styles }
}