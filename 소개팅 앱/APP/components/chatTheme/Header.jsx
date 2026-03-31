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

import HeaderBadge from '@/components/chatTheme/HeaderBadge';

import Level from '@/components/badges/Level';
import Manager from '@/components/badges/Manager';

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
    isLeaveStatus = 1,
    chatTheme,
    bg,
    leaveAlert,
    setLottie,
    onBadge
}) {
    const { presentation } = useLocalSearchParams();

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const { transparencyEnabled, appActiveStatus, setAudioId } = useEtc();

    const [view, setView] = useState(false);
    const [viewPosition, setViewPosition] = useState({});

    const paddingTop = (presentation && Platform.OS === 'ios') ? 0 : insets?.top;
    const headerHeight = rootStyle?.header?.height + ((presentation && Platform.OS === 'ios') ? 0 : insets?.top);

    const onLayout = useCallback((event) => {
        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                setViewPosition({ y: pageY + height + 10 })
            },
        );

    }, []);


    return (
        <View
            style={[
                styles.header,
                ...[
                    {
                        paddingTop: paddingTop,
                        gap: 0,
                        backgroundColor: 'transparent',

                    }
                ]
            ]}
        >
            {/* <LinearGradient
                colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']} // 위쪽은 진하게, 아래는 투명
                style={styles.gradient}
                start={{ x: 0.5, y: 0.3}}
                end={{ x: 0.5, y: 1 }}
            /> */}

            <View style={styles.container}>
                <View style={[rootStyle.flex, {}]}>
                    <TouchableOpacity style={{ marginRight: 6 }} onPress={() => router.back()}>
                        <Image source={images.back} style={rootStyle.default32} />
                    </TouchableOpacity>
                    <View style={[rootStyle.flex, { gap: 10 }]}>
                        <Text style={{ ...rootStyle.font(16, colors.dark, fonts.semiBold,) }}>
                            {
                                room?.type === 3 ? room?.user?.nickName
                                    : isLeaveStatus === 9 ? '탈퇴회원'
                                        : isLeaveStatus === 8 ? '정지회원'
                                            : room?.user?.name
                            }
                        </Text>
                        {
                            room?.type === 3 ?
                                <Manager level={room?.user?.type} />
                                : (width > 320) &&
                                <Level level={room?.isVip && room?.user?.level === 1 ? 99 : room?.user?.level} />
                        }
                    </View>
                </View>
                <View style={[rootStyle.flex, { gap: 10 }]}>
                    {room?.type === 2 && (
                        <>
                            <TouchableOpacity onPress={() => {
                                // setLottie(true) 
                                router.navigate({
                                    pathname: routes.chatToday,
                                    params: {
                                        roomIdx: room?.idx
                                    }
                                })

                            }}>
                                <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={[styles.bgbutton, { gap: 4, paddingTop: 2 }]} >
                                    <Image source={chatImages.chat_heart} style={{ width: 9.32, aspectRatio: 10.2 / 8 }} transition={200} />
                                    <Text style={{ ...rootStyle.font(14, '#FF6193', fonts.semiBold), lineHeight: 14 }}>{numFormat(room?.coupleCount)}</Text>
                                </AnimatedBackground>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => {
                                router.navigate({
                                    pathname: routes?.[`season_${room?.isKeepOn ? 5 : room?.dayCount > 4 ? 4 : room?.dayCount}`],
                                    params: {
                                        roomIdx: room?.idx
                                    }
                                })
                            }}>
                                <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={[styles.bgbutton, {}]} >
                                    <Image source={chatImages?.[`chat_season_${room?.isKeepOn ? 5 : room?.dayCount > 4 ? 4 : room?.dayCount}_fit`]} style={chatTheme?.fitIconSize || rootStyle.default} transition={200} />
                                </AnimatedBackground>
                            </TouchableOpacity>
                        </>
                    )}

                    {room?.status === 1 && (
                        <TouchableOpacity onPress={leaveAlert}>
                            <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={[styles.bgbutton]} >
                                <Image source={chatImages.chat_leave} style={rootStyle.default16} transition={200} tintColor={chatTheme?.primary} />
                            </AnimatedBackground>
                        </TouchableOpacity>
                    )}


                </View>
            </View>

            <HeaderBadge room={room} chatTheme={chatTheme} onPress={onBadge} />
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        header: {
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            paddingHorizontal: rootStyle.side,
            zIndex: 1000,
            position: 'absolute',

        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: rootStyle.header.height,
        },

        bgbutton: {
            width: 36,
            aspectRatio: 1,
            borderRadius: 8,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
        },

        gradient: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
        },



    })

    return { styles }
}
