import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';

import { Image } from 'expo-image';

import dayjs from "dayjs";
import Animated, { FadeInRight } from 'react-native-reanimated';


import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';
import { useAlert } from '@/libs/store';

const typeOrder = ['earpiece', 'speaker', 'bluetooth'];

export default function Component ({ audioDevices=[], selectedDevice, setAudioDevice }) {

    const { styles } = useStyle();

    const { closeAlertFunc } = useAlert();

    return (
        <View style={styles.root}>
            <View 
                style={[styles.top]}
            >
                <View style={styles.voiceBox}>
                    <Text style={styles.title}>오디오 기기</Text>

                    <View style={{ gap: 20 }}>
                        {[...audioDevices].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) )?.map((device, i) => (
                            <TouchableOpacity key={i} style={[rootStyle.flex, { width: '90%', justifyContent: 'space-between' }]} hitSlop={10} onPress={() => {
                                setAudioDevice(device);
                                closeAlertFunc();
                            }}>
                                <View style={[rootStyle.flex, { flex: 1, gap: 12, justifyContent: 'flex-start' }]}>
                                    <Image source={device?.type === 'earpiece' ? images.earpiece : device?.type === 'speaker' ? images.speaker : images.bluetooth} style={rootStyle.default20} tintColor={colors.text_info}/>
                                    <Text style={{ ...rootStyle.font(14, colors.text_info, fonts.medium), lineHeight: 20 }}>
                                        {device?.type === 'earpiece' ? '휴대전화' : device?.type === 'speaker' ? '스피커' : device?.name}
                                    </Text>
                                </View>
                                <Image source={selectedDevice?.uuid === device?.uuid ? images.radio_on : images.radio_off} style={rootStyle.default20} transition={200} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View >

            <View style={styles.bottom}>
                <Button type={'7'} containerStyle={{ height: 64 }} textStyle={{ fontSize: 16 }} onPress={closeAlertFunc}>취소</Button>
            </View>
        </View>

        
    );
}

const useStyle = () => {
    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            gap: 8,
        },
        top: {
            backgroundColor: colors.white,
            borderRadius: 24,
            overflow: 'hidden',
        },
        bottom: {
            borderRadius: 12,
            overflow: 'hidden',
        },


        voiceBox: {
            paddingVertical: 20,
            paddingHorizontal: 12,
            paddingBottom: 36,
            gap: 30,
            alignItems: 'center',
            backgroundColor: colors.white,
        },
        title: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
            textAlign: 'center'
        },
        timerBox: {
            width: 160,
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.greyF1,
            borderRadius: 12,
            overflow: 'hidden',
            gap: 8
        },
        timerText: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
        },
        recordButton: {
            width: 80,
            aspectRatio: 1/1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.inputBorder,
            borderRadius: 1000,
        }
    });

    return { styles };
};