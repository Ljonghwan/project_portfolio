import React, { useRef, useState, useEffect, useCallback } from 'react';

import {
    StyleSheet,
    Pressable,
    View
} from 'react-native';

import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import dayjs from 'dayjs';

export default function Component({ children }) {

    const [isAppReady, setAppReady] = useState(false);
    const [isSplashAnimationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        if (isAppReady) {
           
        }
    }, [isAppReady]);

    const onAnimationLoaded = useCallback(async () => {
        try {
            await SplashScreen.hideAsync();
            // Load stuff
            await Promise.all([]);
        } catch (e) {
            // handle errors
        } finally {
            setTimeout(() => {
                setAppReady(true);
            }, 3000)
        }
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            {isAppReady && children}
            {!isSplashAnimationComplete && (
                <Animated.View exiting={FadeOut} style={{ ...StyleSheet.absoluteFill, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                        autoPlay
                        loop={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: colors.white,
                        }}
                        source={{ uri: consts.s3Url + `/images/splash.json?v=${dayjs().format('YYYYMMDDHHmm')}` }}
                        onAnimationLoaded={onAnimationLoaded}
                        onAnimationFinish={() => {
                            setAnimationComplete(true);
                        }}
                        onAnimationFailure={(err) => {
                            console.log('err', err);
                        }}
                    />
                </Animated.View>
            )}
        </View>
    );
}
