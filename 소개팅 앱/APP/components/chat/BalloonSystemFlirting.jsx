import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    runOnUI
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useConfig, useUser } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({ item, users, lottiePlay }) {

    const { styles } = useStyle();

    const { mbData } = useUser();

    const { configOptions } = useConfig();

    const [view, setView] = useState(true);
    const [load, setLoad] = useState(false);

    const shake = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shake.value }],
    }));

    const handlePress = () => {

        lottiePlay();

        setTimeout(() => {
            shake.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-8, { duration: 50 }),
                withTiming(8, { duration: 50 }),
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }, 100)
        

    };

    const handleReceive = async () => {

        if (load) return;

        setLoad(true);

        let sender = {
            historyIdx: item?.data?.historyIdx
        }

        const { data, error } = await API.post('/v1/chat/receiveFlirting', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            handlePress();
            ToastMessage('플러팅을 선물받았습니다.', { type: 'chat' })

        }, consts.apiDelay)

    }

    const user = users?.find(v => v.idx === item?.data?.userIdx);

    return (
        <View style={[styles.root]}>

            <View style={styles.itemBallonSystem}>


                <AnimatedTouchable style={[rootStyle.flex, animatedStyle]} onPress={handlePress}>
                    <Image source={images.flirting} style={[rootStyle.flirting, { width: 48 }]} />
                </AnimatedTouchable>

                <Text style={[styles.itemBallonSystemText, {}]}>{item?.message}</Text>

                <View style={[rootStyle.flex, { gap: 5, alignItems: 'center' }]}>
                    <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={styles.profile} />
                    <Text style={[styles.message, { flexShrink: 1 }]}>{item?.data?.text}</Text>
                </View>

                {user?.idx === mbData?.idx ? (
                    <Button type={11} style={{ flex: 1 }}>플러팅을 보냈습니다.</Button>
                ) : (
                    <Button type={5} style={{ flex: 1 }} onPress={handleReceive} load={load}>받기</Button>
                )}

            </View>

        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            width: '65%',
            alignSelf: 'center',
        },
        itemBallonSystem: {
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            paddingTop: 30,
            backgroundColor: colors.system,
            borderRadius: 12,
            flex: 1,
            gap: 20
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            fontFamily: fonts.semiBold
        },
        profile: {
            width: 24,
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        message: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            textAlign: 'center'
        },

        motion: {
            position: 'absolute',
            width: 600,
            aspectRatio: 6 / 3,
            zIndex: 10
        }
    })

    return { styles }
}