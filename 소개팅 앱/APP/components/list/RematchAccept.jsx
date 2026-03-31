import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import dayjs from 'dayjs';

import Text from '@/components/Text';

import Rematch from '@/components/popups/Rematch';
import RematchAccept from '@/components/popups/RematchAccept';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import { numFormat, elapsedTime } from '@/libs/utils';

import { useAlert } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({
    style,
    item=null,
    time=null,
    dataFunc=()=>{},
    viewables
}) {

    const { openAlertFunc } = useAlert();

    const calculateRemaining = () => {
        const now = dayjs();
        const diffSec = Math.floor(dayjs(time).diff(now, 'second'));
        return diffSec > 0 ? diffSec : 0;
    };

    const [remaining, setRemaining] = useState(calculateRemaining());


    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            transform: [
                {
                    translateX: withTiming(isVisible ? 0 : 30, { duration: 300 })
                },
                {
                    scale: withTiming(isVisible ? 1 : 0.95, { duration: 300 })
                }
            ],
            opacity: withTiming(isVisible ? 1 : 0, { duration: 300 })
        }

    }, [item.idx, viewables])


    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(calculateRemaining());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (ms) => {
        const hours = String(Math.floor(ms / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((ms % 3600) / 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const rematchAlert = () => {
        if(item?.status !== 2 ) return;

        openAlertFunc({
            component: <RematchAccept item={item} time={formatTime(remaining)} dataFunc={dataFunc}/>,
            componentStyle: { padding: 0, paddingTop: 0 },
            input: 150
        })
    }

    return (
        <AnimatedTouchable style={[{ paddingHorizontal: 20 }]} onPress={rematchAlert}>
            <View style={[styles.item, style]}>
                <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={styles.itemImage}/>
                
                <View style={[rootStyle.flex, { flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                            <Text style={styles.itemName}>{item?.user?.name}</Text>

                            {remaining > 0 && (
                                <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                                    <Image source={images.clock} style={rootStyle.default} />
                                    <Text style={styles.itemTime}>{formatTime(remaining)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.itemName}>
                            <Text style={styles.itemSpan}>지난 소개 </Text>
                            {dayjs(item?.prevCreateAt).format('YYYY.MM.DD')}
                        </Text>
                        <Text style={styles.itemName}>
                            <Text style={styles.itemSpan}>총 소개 횟수 </Text>
                            {numFormat(item?.count)}회
                        </Text>
                    </View>

                    <View style={[rootStyle.flex, { gap: 8, alignItems: 'flex-end' }]}>
                        <TouchableOpacity style={styles.timecapsule} onPress={() => {
                            router.navigate({
                                pathname: routes.chatTimecapsule,
                                params: {
                                    roomIdx: item?.prevRoomIdx
                                }
                            })
                        }}>
                            <Image source={images.chat_header_time} style={{ width: '100%', height: '100%' }} />
                            <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={styles.capsuleProfile}/>
                        </TouchableOpacity>

                        {item?.status === 2 ? (
                            <View style={{ gap: 8, alignItems: 'center' }}>
                                <View style={styles.dot}/>
                                <Text style={[styles.itemName, { color: colors.main }]}>결정하기</Text>
                            </View>
                        ) : item?.status === 3 ? (
                            <View style={{ gap: 8, alignItems: 'flex-end' }}>
                                <Text style={[styles.itemName, { color: colors.main }]}>수락됨</Text>

                                <TouchableOpacity style={[styles.button, { backgroundColor: colors.main }]} onPress={() => {
                                    router.navigate({
                                        pathname: routes.chatRoom,
                                        params: {
                                            idx: item?.roomIdx,
                                        }
                                    })
                                }}>
                                    <Text style={[styles.buttonText, { color: colors.white }]}>채팅방</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ gap: 8, alignItems: 'center' }}>
                                <View style={[styles.dot, { backgroundColor: colors.red }]}/>
                                <Text style={[styles.itemName, { color: colors.red }]}>거절되었습니다</Text>
                            </View>
                        )}
                        

                    </View>
                </View>
            </View>
              
        </AnimatedTouchable>
    );
}

const styles = StyleSheet.create({
    item: {
        flex: 1,
        paddingVertical: 16,
        borderBottomColor: colors.greyE,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    itemImage: {
        width: 48,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
    },
    
    itemName: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
        fontFamily: fonts.semiBold,
    },
    itemSpan: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.grey9,
        fontFamily: fonts.semiBold,
    },
    itemTime: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
    },
    itemLeave: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.greyC,
        fontFamily: fonts.semiBold
    },


    timecapsule: {
        width: 40,
        aspectRatio: 1/1,
        borderRadius: 1000,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    capsuleProfile: {
        width: 14,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder,
        position: 'absolute',
        right: 6,
        bottom: 6,
        borderWidth: 1.5,
        borderColor: colors.main
    },


    button: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.mainOp5
    },
    buttonText: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.main,
        fontFamily: fonts.semiBold,
    },

    dot: {
        width: 12,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.main
    }
});
