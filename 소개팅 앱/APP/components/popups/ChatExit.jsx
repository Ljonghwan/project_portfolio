import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { Image } from "expo-image";
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import images from '@/libs/images';

import API from '@/libs/api';
import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';


export default function Component({ room, callback=null }) {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const handleClose = () => {
        closeAlertFunc();
    }

    const handleSubmit = async () => {

        handleClose();

        const sender = {
            roomIdx: room?.idx
        }

        const { data, error } = await API.post('/v1/chat/deleteRoom', sender);

        if (error) {
            setTimeout(() => {
                openAlertFunc({
                    icon: images.warning,
                    label: error?.message,
                    onPressText: "확인",
                })
            }, 450)
            return;
        }

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        ToastMessage('채팅방을 나갔습니다.');

        if(callback) await callback();
        else router.back();
    }


    return (
        <View
            style={[styles.root]}
        >
            <View style={{ gap: 12 }}>
                <View style={{ gap: 24, alignItems: 'center' }}>
                    <Image source={images.warning} style={rootStyle.default36} />
                    <Text style={styles.label} >{'채팅방을 나가시겠습니까?'}</Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>ㆍ채팅방을 나가면 채팅 목록에서 이 채팅방이 소멸됩니다.</Text>
                    {room?.status === 9 && <Text style={styles.infoText}>ㆍ사계로그의 모든 내용이 사라집니다.</Text>}
                </View>
            </View>
            <View style={styles.buttonBox}>
                <Button style={{ flex: 1 }} type={4} onPress={handleClose}>아니요</Button>
                <Button style={{ flex: 1 }} type={2} textStyle={{ fontSize: 16 }} onPress={handleSubmit}>나가기</Button>
            </View>
        </View >

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 24
        },
        label: {
            fontSize: 18,
            color: colors.dark,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.5
        },
        title: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey9,
            textAlign: 'center',
            letterSpacing: -0.35
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },

        infoBox: {
        },
        infoText: {
            fontSize: 12,
            lineHeight: 22,
            color: colors.text_info,
            letterSpacing: -0.35,
            textAlign: 'center'
        },

        picketBox: {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 16
        },
        picketText: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
            letterSpacing: -0.45,
            textAlign: 'center'
        },
        refundBox: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.greyD,
            paddingHorizontal: 16,
            paddingVertical: 10
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
        }
    })

    return { styles }
}
