import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Loading from '@/components/Loading';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import BalloonImage from '@/components/chat/BalloonImage';
import BalloonVoice from '@/components/chat/BalloonVoice';
import BalloonCall from '@/components/chat/BalloonCall';

import { useUser } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import chatStyle from '@/libs/chatStyle';

import { imageViewer } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, isMe, isProfile, isTime, isVip, isLeaveStatus, chatTheme, users }) {

    const { styles } = useStyle();
    const { mbData } = useUser();

    return (
        <View style={[styles.item, { alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: !isProfile ? 4 : 20 }]}>

            {(!isMe && isProfile) && (
                <TouchableOpacity style={[styles.itemTop, { flexDirection: isMe ? 'row-reverse' : 'row' }]} onPress={() => {
                    if(isLeaveStatus !== 1) return;
                    if (!item?.sender?.profile) return;
                    imageViewer({ index: 0, list: [item?.sender?.profile] });
                }}>
                    {isVip && (
                        <Image source={item?.sender?.level === 1 ? images.vip_level_1 : images.vip_level_2} style={[{ width: 12, aspectRatio: 1, position: 'absolute', top: -1.5, left: -1.5, zIndex: 10 }]} transition={100} />
                    )}
                    <Image source={(isLeaveStatus !== 1 ? images.profile_leave : item?.sender?.profile ? consts.s3Url + item?.sender?.profile : images.profile)} style={styles.profile} />
                    <AnimatedText color={chatTheme?.balloonNameColor} style={{ fontSize: 14, fontFamily: fonts.medium }}>
                        {
                            item?.sender?.type ? item?.sender?.nickName 
                            : isLeaveStatus === 9 ? '탈퇴회원' 
                            : isLeaveStatus === 8 ? '정지회원' 
                            : item?.sender?.name
                        }
                    </AnimatedText>
                </TouchableOpacity>
            )}

            <View style={[styles.itemBottom, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>

                {item?.type === 'photo' ? (
                    <BalloonImage item={item} isMe={isMe} isProfile={isProfile} isTime={isTime} chatTheme={chatTheme} />
                ) : item?.type === 'voice' ? (
                    <BalloonVoice item={item} isMe={isMe} isProfile={isProfile} isTime={isTime} chatTheme={chatTheme} />
                ) : item?.type === 'call' ? (
                    <BalloonCall item={item} isMe={isMe} isProfile={isProfile} isTime={isTime} chatTheme={chatTheme} />
                ) : item?.senderId === mbData?.idx ? (
                    <View style={[
                        styles.itemBallonMe,
                        {
                            borderColor: isVip ? chatTheme?.balloonBorder1 : chatTheme?.balloonBackgroundColor1
                        }
                    ]}>
                        <LinearGradient
                            colors={
                                isVip ?
                                    chatTheme?.balloonGradient1
                                : [chatTheme?.balloonBackgroundColor1, chatTheme?.balloonBackgroundColor1]
                            }
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={[styles.ballonGradient, { borderTopRightRadius: 0 }]}
                        >
                            {item?.message && <Text style={[styles.itemBallonTextMe, { color: chatTheme?.balloonTextColor1 }]}>{item?.message}</Text>}
                        </LinearGradient>
                    </View>
                ) : (
                    <View style={[
                        styles.itemBallon,
                        {
                            borderColor: isVip ? chatTheme?.balloonBorder2 : chatTheme?.balloonBackgroundColor2
                        }
                    ]}>
                        <LinearGradient
                            colors={
                                isVip ?
                                    chatTheme?.balloonGradient2
                                : [chatTheme?.balloonBackgroundColor2, chatTheme?.balloonBackgroundColor2]
                            }
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={[styles.ballonGradient, { borderTopLeftRadius: 0 }]}
                        >
                            {item?.message && <Text style={[styles.itemBallonText, { color: chatTheme?.balloonTextColor2 }]}>{item?.message}</Text>}
                        </LinearGradient>
                    </View>
                )}


                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {isMe && !item?.read && <AnimatedText color={chatTheme?.balloonDateColor} style={[styles.date]}>읽지 않음</AnimatedText>}
                    {isTime && <AnimatedText color={chatTheme?.balloonDateColor} style={[styles.date]}>{dayjs(item?.createAt).format('A hh:mm')}</AnimatedText>}
                </View>
            </View>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        item: {
            flex: 1,
            gap: 8,
        },
        itemTop: {
            alignItems: 'center',
            gap: 8
        },
        itemBottom: {
            alignItems: 'flex-end',
            gap: 8,
            maxWidth: '70%'
        },
        profile: {
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.placeholder
        },
        itemBallon: {
            borderRadius: 16,
            borderTopLeftRadius: 0,
            borderWidth: 1,
            overflow: 'hidden',
        },
        itemBallonMe: {
            borderRadius: 16,
            borderTopRightRadius: 0,
            borderWidth: 1,
            overflow: 'hidden',
        },
        ballonGradient: {
            borderRadius: 15,
            padding: 16,
        },



        itemBallonText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
        },
        itemBallonTextMe: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
        },
        itemBallonSystem: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.greyF1,
            borderRadius: 12,
            flex: 1
        },
        itemBallonSystemText: {
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark
        },
        date: {
            fontSize: 12,
            color: colors.grey9
        }

    })

    return { styles }
}