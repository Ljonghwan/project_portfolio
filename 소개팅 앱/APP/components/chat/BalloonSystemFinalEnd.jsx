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

import ChatExit from '@/components/popups/ChatExit';

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

import { imageViewer, ToastMessage, numFormat, formatTime } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { mbData } = useUser();

    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.root, { borderColor: chatTheme?.primary }]}>

            {item?.data?.isPenalty && (
                <TouchableOpacity style={[styles.topButton, { borderBottomColor: chatTheme.primary }]} hitSlop={10} onPress={() => {
                    router.navigate({
                        pathname: routes.chatCallObjection,
                        params: {
                            roomIdx: room?.idx,
                        }
                    })
                }}>
                    <AnimatedText color={chatTheme.primary} style={{ ...rootStyle.font(11, colors.black, fonts.medium), lineHeight: 20 }}>전화 소명하기</AnimatedText>
                </TouchableOpacity>
            )}
            

            <Image source={chatImages.chat_system_end} style={[rootStyle.default36]} transition={200} tintColor={chatTheme?.primary} />

            <Text style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{item?.message}</Text>

            {item?.data?.subMessage && (
                <View>
                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.regular), lineHeight: 20, textAlign: 'center' }}>{item?.data?.subMessage}</Text>
                </View>
            )}

            {item?.data?.penaltyMessage && (
                <Text style={{ ...rootStyle.font(11, colors.red, fonts.light), textAlign: 'center', lineHeight: 20 }}>{item?.data?.penaltyMessage}</Text>
            )}

            <AnimatedText color={chatTheme.primary} style={{ ...rootStyle.font(16, colors.black, fonts.medium), textAlign: 'center', lineHeight: 20 }}>{`최종 전달 픽켓 : ${numFormat(item?.data?.picketCount)}장`}</AnimatedText>
            
            <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={[styles.refundBox, { borderColor: chatTheme?.primary }]}>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={images.picket} style={[rootStyle.picket, { width: 21 }]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(14, colors.black), lineHeight: 20 }}>{`선물받은 픽켓 : ${numFormat(item?.data?.receiveCount)}장`}</Text>
                </View>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={chatImages.chat_season_5_report_4} style={[rootStyle.default20]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(14, colors.black), lineHeight: 20 }}>{`전화 : ${formatTime(item?.data?.callTime)}`}</Text>
                </View>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    <Image source={chatImages.chat_system_end_status} style={[rootStyle.default20]} transition={200} tintColor={chatTheme?.primary}/>
                    <Text style={{ ...rootStyle.font(width <= 340 ? 12 : 14, colors.black), lineHeight: 20 }}>{`종료상태 : ${item?.data?.endStatus}`}</Text>
                </View>
              
            </AnimatedBackground>

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
            backgroundColor: colors.grey6,
        },

        refundBox: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.greyD,
            padding: 16,
            paddingVertical: 20,
            width: '100%',
            gap: 18,
            // backgroundColor: colors.white,
        },
        refundText: {
            fontSize: 12,
            color: colors.grey5,
        },
        refundTextRed: {
            fontSize: 15,
            color: colors.red,
            fontFamily: fonts.semiBold,
        },
        bar: {
            width: '100%',
            height: 0.5,
            backgroundColor: colors.greyD9,
            marginVertical: 12
        },
        topButton: {
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 14,
            right: 17,
            zIndex: 1000,
            height: 21,
            borderBottomWidth: 1,
        }

    })

    return { styles }
}