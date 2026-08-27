import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';

import { Image } from 'expo-image';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Loading from '@/components/Loading';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

export default function Component({ item, isMe, isProfile, isTime, sender }) {

    const { styles } = useStyle();

    return (
        <View style={[styles.item, { alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: !isProfile ? 4 : 30 }]}>
            <View style={[ rootStyle.flex, { flex: 1, alignItems: 'flex-start',  gap: 7 } ]}>
                {!isMe && (
                    <View style={{ width: 36, height: 36 }}>
                        <Image source={(sender?.profile ? consts.s3Url + sender?.profile : images.profile)} style={styles.profile} />
                    </View>
                )}
                <View style={{ gap: 7, flex: 1, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <Text style={styles.name}>{sender?.firstName} {sender?.lastName}</Text>}
                    <View style={[ rootStyle.flex, { maxWidth: '60%', flex: 1, gap: 7, justifyContent: 'flex-start', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' } ]}>
                        <View style={[isMe ? styles.itemBallonMe : styles.itemBallon]}>
                            {item?.message && <Text style={[isMe ? styles.itemBallonTextMe : styles.itemBallonText]}>{item?.message}</Text>}

                            {item?.data?.subMessage && (
                                <Text style={[
                                    isMe ? styles.itemBallonTextMe : styles.itemBallonText,
                                    { fontFamily: fonts.semiBold },
                                    item?.data?.status ? { color: isMe ? colors.yellow : colors.main } : { color: isMe ? colors.dark : colors.main }
                                ]}>
                                    {item?.data?.subMessage}
                                </Text>
                            )}
                        </View>

                        <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            {/* {isMe && !item?.read && <Text style={styles.date}>읽지 않음</Text>} */}
                            {isTime && <Text style={styles.date}>{dayjs(item?.createAt).format('h:mm A')}</Text>}
                        </View>
                    </View>
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
            width: '100%',
            height: '100%',
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemBallon: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            borderTopLeftRadius: 0,
            backgroundColor: colors.sub_3,
        },
        itemBallonMe: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            borderBottomRightRadius: 0,
            backgroundColor: colors.taseta_sub_2,
        },
        itemBallonText: {
            fontSize: 16,
            lineHeight: 22,
            letterSpacing: -0.32,
            color: colors.main,

            flexShrink: 1
        },
        itemBallonTextMe: {
            fontSize: 16,
            lineHeight: 22,
            letterSpacing: -0.32,
            color: colors.main,
            flexShrink: 1
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
            fontSize: 14,
            color: colors.sub_1,
            fontFamily: fonts.medium
        },
        name: {
            fontSize: 14,
            color: colors.main,
        }

    })

    return { styles }
}