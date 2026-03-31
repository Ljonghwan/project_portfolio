import React, { useEffect, useRef, useState, useCallback } from 'react';

import {
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Platform,
    StatusBar,
    ImageBackground,
    Dimensions,
    Pressable,
} from 'react-native';

import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { LinearGradient } from 'expo-linear-gradient';


import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Bell from '@/components/Bell';
import Help from '@/components/Help';
import ListText from '@/components/ListText';

import Level from '@/components/badges/Level';

import { AnimatedText, AnimatedBackground } from '@/components/chatTheme/AnimatedColorComponents';


import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import chatStyle from '@/libs/chatStyle';

import { useEtc } from '@/libs/store';

import consts from '@/libs/consts';
import routes from '@/libs/routes';

import { numFormat } from '@/libs/utils';

export default function Header({
    room = {},
    chatTheme,
    seasonLog = false,
    onPress = () => { }
}) {
    const { presentation } = useLocalSearchParams();

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const { transparencyEnabled, appActiveStatus, setAudioId } = useEtc();

    const isCancel = [8, 9]?.includes(room?.status);

    return (
        <View style={styles.headerBottom}>
            {/* 컴포넌트로 프리뷰 챗 or 일반 챗 */}
            {room?.type === 2 && (
                <Shadow
                    distance={6}
                    startColor="rgba(255, 189, 189, 0.15)"
                    offset={[0, 0]}
                    style={{ width: '100%' }}
                    disabled={room?.dayCount !== 1}
                >
                    <TouchableOpacity style={[styles.headerBadge]} activeOpacity={1} onPress={onPress}>
                        <AnimatedBackground bg={(seasonLog && (room?.dayCount > 3 && !room?.isKeepOn)) ? chatTheme?.iconBackgroundColor : chatTheme?.badgeBackgroundColor} style={[styles.headerBadgeView, {}]} >
                            <View style={[rootStyle.flex, { gap: room?.isKeepOn ? 4 : 8 }]}>
                                <Image source={chatImages?.[`chat_season_${room?.isKeepOn ? 5 : room?.dayCount > 4 ? 4 : room?.dayCount}`]} style={[room?.isKeepOn ? rootStyle.default20 : rootStyle.default16]} transition={200} />
                                <AnimatedText color={chatTheme?.primary} style={{}}>지금은 {chatTheme?.title}이에요.</AnimatedText>
                                {width > 320 && !room?.isKeepOn && (
                                    <View style={[styles.headerDay, { borderColor: chatTheme?.primary, paddingHorizontal: room?.isKeepOn ? 14 : 8 }]}>
                                        <AnimatedText color={chatTheme?.primary} style={{ fontSize: 12, letterSpacing: -0.3 }}>{`${room?.dayCount > 4 ? 4 : room?.dayCount}일차`}</AnimatedText>
                                    </View>
                                )}

                            </View>
                            <View style={[rootStyle.flex, { gap: 5 }]}>
                                <Image source={images.picket} style={[rootStyle.picket, { width: 17 }]} tintColor={isCancel ? colors.grey6 : chatTheme?.primary} transition={200} />
                                <AnimatedText color={isCancel ? colors.grey6 : chatTheme?.primary} style={{ fontSize: 14, lineHeight: 16, fontFamily: fonts.semiBold }}>{numFormat(room?.flirtingCount)}장</AnimatedText>
                                <AnimatedText color={isCancel ? colors.grey6 : chatTheme?.primary} style={{ fontSize: 14, lineHeight: 16, fontFamily: fonts.semiBold, lineHeight: 16 }}>|</AnimatedText>
                                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={chatImages.chat_ticket} style={[{ width: 20, height: 20 }]} tintColor={isCancel ? colors.grey6 : room?.isVip ? chatTheme?.primary : colors.grey6} transition={200} />
                                    <Image source={chatImages.chat_ticket_star} style={[{ width: 7, height: 6.66, position: 'absolute' }]} tintColor={isCancel ? colors.white : room?.isVip ? null : colors.white} />
                                </View>
                                <AnimatedText color={isCancel ? colors.grey6 : room?.isVip ? chatTheme?.primary : colors.grey6} style={{ fontSize: 14, lineHeight: 16, fontFamily: fonts.semiBold, lineHeight: 16 }}>{numFormat(room?.superPicket)}장</AnimatedText>
                            </View>
                        </AnimatedBackground>

                    </TouchableOpacity>
                </Shadow>
            )}
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        headerBottom: {
            width: '100%',
            paddingTop: 0,
            paddingBottom: 6,
            zIndex: 10,
            // position: 'absolute',
            // top: 0,
            // zIndex: 1000,
        },
        headerBadge: {
            borderRadius: 16,
            overflow: 'hidden',
            width: '100%',
        },
        headerBadgeView: {
            paddingHorizontal: rootStyle.side,
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerDay: {
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: colors.greyD,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: colors.white,
        },

    })

    return { styles }
}
