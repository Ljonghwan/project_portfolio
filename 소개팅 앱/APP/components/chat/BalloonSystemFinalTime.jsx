import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';
import duration from 'dayjs/plugin/duration';
import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');
dayjs.extend(duration);

export default function Component({ item, time, user }) {

    const calculateRemaining = () => {
        const now = dayjs();
        const diffSec = Math.floor(dayjs(time * 1000).diff(now, 'second'));
        return diffSec > 0 ? diffSec : 0;
    };

    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const [remaining, setRemaining] = useState(calculateRemaining());

    const [load, setLoad] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(calculateRemaining());
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const formatTime = (ms) => {
        const hours = String(Math.floor(ms / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((ms % 3600) / 60)).padStart(2, '0');
        const seconds = String(ms % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

   
    return (
        <View style={[styles.buttonBox]}>

            <View style={styles.itemBallonSystem}>
                <View style={[{ gap: 4, flex: 1 }]}>
                    <Text style={[styles.itemBallonSystemTitle]}>{item?.message}</Text>
                    <Text style={[styles.itemBallonSystemText]}>{item?.data?.text}</Text>
                </View>

                <View style={styles.timerBox}>
                    <View style={[rootStyle.flex, { gap: 4 }]}>
                        <Image source={images.final_time} style={rootStyle.default16} />
                        <Text style={styles.timerTitle}>남은 시간</Text>
                    </View>
                    <Text style={styles.timerText}>{remaining > 0 ? formatTime(remaining) : '00:00:00'}</Text>
                </View>
            </View>

            {/* <Button type={3} style={{ flex: 1 }}>프로필 피드백 작성하기</Button> */}
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        buttonBox: {
            maxWidth: '100%',
        },
        button: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            borderRadius: 8,
            backgroundColor: colors.main,
        },
        buttonText: {
            color: colors.white,
            textAlign: "center",
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 52,
        },

        itemBallonSystem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.system,
            borderRadius: 12,
            flex: 1,
            gap: 20
        },
        itemBallonSystemTitle: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            fontFamily: fonts.medium
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey6,
        },
        timerBox: {
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.white,
            gap: 4
        },
        timerTitle: {
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: -0.3,
            color: colors.grey6,
        },
        timerText: {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.dark,
            fontFamily: fonts.medium,
            textAlign: 'center'
        }
    })

    return { styles }
}