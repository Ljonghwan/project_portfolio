import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, FlatList, useWindowDimensions, Image as RNImage, Platform, BackHandler, Keyboard } from 'react-native';
import { Image, ImageBackground } from 'expo-image';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from "expo-router";

import Animated, { ReducedMotionConfig, ReduceMotion, FadeIn, FadeOut } from 'react-native-reanimated';
import { OverKeyboardView } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import { useConfig, useRoom } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage, useBackHandler } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ room }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { vipMessage, setVipMessage } = useRoom();

    const [load, setLoad] = useState(true);
    const [visible, setVisible] = useState(false);

    useBackHandler(() => {
        handleClose();
        return true;
    });

    useEffect(() => {
        setTimeout(() => {
            setVisible(true);
        }, 500);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setVipMessage(room?.idx);
    };


    return (
        <>
            <OverKeyboardView visible={visible}>
                <GestureHandlerRootView style={{ }}>
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <View style={{...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backgroundColor: colors.dim }}/>
                        <View style={styles.main}>
                            <ImageBackground
                                source={images.popup_vip_bg}
                                style={styles.popup}
                                contentFit="contain"
                            >
                                <View style={{ width: '100%', marginTop: 100, gap: 30, }}>
                                    <Text style={styles.title}>{`이제부터\nVIP채팅방으로 전환됩니다!`}</Text>
                                    <Button containerStyle={{ width: '100%' }} onPress={handleClose}>확인</Button>
                                </View>

                            </ImageBackground>
                        </View>
                    </Animated.View>
                </GestureHandlerRootView>
            </OverKeyboardView>
        </>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        main: {
            width: 320,
            aspectRatio: 372 / 318,
        },
        popup: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20
        },
        
        title: {
            fontSize: 18,
            lineHeight: 24,
            color: colors.white,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.5,
        }
    })

    return { styles }
}