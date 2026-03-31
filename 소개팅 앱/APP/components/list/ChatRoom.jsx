import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { FadeIn } from 'react-native-reanimated';
import dayjs from 'dayjs';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import Text from '@/components/Text';

import Simple from '@/components/badges/Simple';
import Manager from '@/components/badges/Manager';

import SeasonIcon from '@/components/chatTheme/SeasonIcon';

import HeartSend from '@/components/popups/HeartSend';
import ChatExit from '@/components/popups/ChatExit';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import chatStyle from '@/libs/chatStyle';
import chatImages from '@/libs/chatImages';
import API from '@/libs/api';

import { useConfig, useAlert, useUser, useRoom } from '@/libs/store';

import { numFormat, getFullDateFormat, ToastMessage } from '@/libs/utils';

export default function Component({
    item = null,
    isCancel = false,
    remove = false,
    dataFunc = () => { }
}) {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { resetVipMessage } = useRoom();

    const deleteAlert = () => {

        openAlertFunc({
            component: <ChatExit room={item} callback={dataFunc} />
        })
        return;

        openAlertFunc({
            icon: images.warning,
            label: "정말 채팅방을 나가시겠습니까?",
            onCencleText: "아니요",
            onPressText: "나가기",
            onCencle: () => { },
            onPress: async () => {
                let sender = {
                    roomIdx: item?.idx
                };

                const { data, error } = await API.post('/v1/chat/deleteRoom', sender);

                if (error) {
                    setTimeout(() => {
                        openAlertFunc({
                            icon: images.warning,
                            label: error?.message,
                            onPressText: "확인",
                        })
                    }, 400)
                    return;
                }

                ToastMessage('채팅방을 나갔습니다.');
                dataFunc();
            }
        })
    }

    const chatTheme = chatStyle?.[`chat_season_${item?.isKeepOn ? 5 : item?.dayCount > 4 ? 4 : item?.dayCount}`];

    const isLeaveStatus = item?.user?.status;

    return (
        <LinearGradient
            colors={item?.isVip ? [
                'rgba(255, 193, 7, 0.20)',
                'rgba(255, 255, 255, 0.20)',
                'rgba(255, 193, 7, 0.20)',
            ] : [colors.white, colors.white, colors.white]}
            locations={[0.0006, 0.3607, 0.9994]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: '100%' }}
        >
            <View style={styles.item} >
                <TouchableOpacity style={[rootStyle.flex, { width: '100%', gap: width <= 320 ? 8 : 12 }]} activeOpacity={1} onPress={() => {
                    if(!item?.isVip) {
                        resetVipMessage(item?.idx);
                    }
                    
                    router.navigate({
                        pathname: item?.type === 1 ? routes.chatPreviewRoom : routes.chatRoom,
                        params: {
                            idx: item?.idx,
                        }
                    })
                }}>
                    <View >
                        {item?.isVip && (
                            <Image source={item?.user?.level === 1 ? images.vip_level_1 : images.vip_level_2} style={[{ width: 16, aspectRatio: 1, position: 'absolute', top: -3, left: -3, zIndex: 10 }]} transition={100}/>
                        )}
                        <Image source={(isLeaveStatus !== 1 && item?.type !== 3 ? images.profile_leave : item?.user?.profile ? (consts.s3Url + item?.user?.profile) : images.profile)} style={styles.profile} />
                        {item?.badgeCount > 0 && (
                            <View style={styles.count}>
                                <Text style={{ ...rootStyle.font(12, colors.white, fonts.medium) }}>{numFormat(item?.badgeCount, 99)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ gap: width <= 320 ? 6 : 12, flex: 1 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5, flex: 1 }]}>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 14 : 16, colors.dark, fonts.medium), lineHeight: 20, flexShrink: 1 }} numberOfLines={1}>
                                    {
                                        item?.type === 3 ? item?.user?.nickName
                                        : isLeaveStatus === 9 ? '탈퇴회원' 
                                        : isLeaveStatus === 8 ? '정지회원' 
                                        : item?.user?.name
                                    }
                                </Text>
                                {item?.type === 3 ? <Manager level={item?.user?.type} /> : <SeasonIcon season={item?.isKeepOn ? 5 : item?.dayCount > 4 ? 4 : item?.dayCount} />}
                            </View>

                            {item?.type !== 3 && !remove && (
                                <View style={[rootStyle.flex, { gap: 5 }]}>
                                    {item?.isVip && <Image source={images.vip_badge} style={[{ width: 52, aspectRatio: 52 / 20 }]} transition={100}/>}

                                    <Image source={images.picket} style={[rootStyle.picket, { width: 18 }]} tintColor={isCancel ? colors.grey6 : chatTheme?.primary} />
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 12 : 14, isCancel ? colors.grey6 : chatTheme?.primary, fonts.medium), lineHeight: 16 }}>{numFormat(item?.flirtingCount)}장</Text>
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 12 : 14, isCancel ? colors.grey6 : chatTheme?.primary, fonts.medium), lineHeight: 16 }}>|</Text>

                                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={chatImages.chat_ticket} style={[{ width: 20, height: 20 }]} transition={100} tintColor={isCancel ? colors.grey6 : item?.isVip ? chatTheme?.primary : colors.grey6 } />
                                        <Image source={chatImages.chat_ticket_star} style={[{ width: 7, height: 6.66, position: 'absolute' }]} transition={100} tintColor={isCancel ? colors.white : item?.isVip ? null : colors.white }/>
                                    </View>
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 12 : 14, isCancel ? colors.grey6 : item?.isVip ? chatTheme?.primary : colors.grey6, fonts.medium), lineHeight: 16 }}>{numFormat(item?.superFlirtingCount)}장</Text>
                                </View>
                            )}

                        </View>

                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            <Text style={[styles.message, { color: isCancel ? colors.red2 : colors.text_sub }]} numberOfLines={1}>{item?.lastMessage?.replace(/\n/g, ' ') || "메시지 없음"}</Text>
                            {!remove && <Text style={styles.date}>{getFullDateFormat(item?.lastMessageAt, 2)}</Text>}
                        </View>
                    </View>


                    {remove && item?.type >= 2 && (
                        <TouchableOpacity style={{ gap: 8, alignItems: 'center' }} onPress={deleteAlert}>
                            <Image source={images.chat_room_leave} style={rootStyle.default} />
                            <Text style={{ ...rootStyle.font(12, colors.primary, fonts.medium), lineHeight: 16 }}>채팅방 나가기</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>


                {item?.status === 8 && item?.leavingUserIdx !== mbData?.idx && item?.visualIdx === mbData?.idx && !item?.refundNoteSent && (
                    <TouchableOpacity 
                        style={styles.sendButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            openAlertFunc({
                                component: <HeartSend user={item?.user} roomIdx={item?.idx} onSubmit={dataFunc}/>,
                                input: 200
                            })   
                        }}
                    >
                        <Image source={images.chat_heart_send2} style={rootStyle.default16} />
                        <Text style={{...rootStyle.font(13, colors.white)}}>상대방에게 마음전하기!</Text>
                    </TouchableOpacity>
                )}

                {item?.status === 8 && item?.userIdx === mbData?.idx && item?.refundNoteSent && (
                    <TouchableOpacity 
                        style={styles.sendButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            router.navigate({
                                pathname: item?.type === 1 ? routes.chatPreviewRoom : routes.chatRoom,
                                params: {
                                    idx: item?.idx,
                                }
                            }) 
                        }}
                    >
                        <Image source={images.chat_heart_send2} style={rootStyle.default16} />
                        <Text style={{...rootStyle.font(13, colors.white)}}>{item?.user?.name}님으로부터 새로운 쪽지가 날아왔어요!</Text>
                    </TouchableOpacity>
                )}
                                
            
            </View>

        </LinearGradient>
    );
}


const useStyle = () => {

    const { width, height } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        item: {
            gap: width <= 320 ? 8 : 15,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.greyD9,
            paddingHorizontal: rootStyle.side,
        },
        profile: {
            width: width <= 320 ? 40 : 48,
            aspectRatio: 1 / 1,
            borderRadius: 16,
            backgroundColor: colors.placeholder
        },
        count: {
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            backgroundColor: colors.red4,
            position: 'absolute',
            bottom: 0,
            right: 0,
            paddingHorizontal: 2,
        },
        countText: {
            fontSize: 10,
            lineHeight: 14,
            color: colors.white,
            letterSpacing: -0.25
        },
        message: {
            fontSize: width <= 320 ? 12 : 13,
            color: colors.text_sub,
            letterSpacing: -0.325,
            fontFamily: fonts.light,
            flex: 1
        },
        date: {
            fontSize: width <= 320 ? 11 : 12,
            color: colors.text_sub,
            letterSpacing: -0.3,
            fontFamily: fonts.light,
        },
        sendButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            backgroundColor: colors.ff81a9,
            borderRadius: 15,
            height: 35,
            gap: 10
        }
    });

    return { styles }
}


