import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OverKeyboardView } from 'react-native-keyboard-controller';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    FadeOut,
    runOnJS,
    FadeIn,
} from "react-native-reanimated";

import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import consts from '@/libs/consts';
import colors from './libs/colors';

const { width, height } = Dimensions.get("window");


export default function SplashVideo({ onStart, onEnd }) {

    const opcacity = useSharedValue(0);

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opcacity.value
        };
    });

    const player = useVideoPlayer(consts.splashVideo, player => {
        player.loop = false;
        player.muted = true;
        player.staysActiveInBackground = true;

        player.play();

    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player?.playing });
    const { status, error } = useEvent(player, 'statusChange', { status: player.status });
    
    useEventListener(player, 'playToEnd', () => {
        console.log("end play!!!!!");
        onEnd();
    });

    const { styles } = useStyle();


    useEffect(() => {

        if (isPlaying) {

        }

    }, [isPlaying])


    useEffect(() => {
        console.log('status, error ', isPlaying, status, error);

        if(error) {
            onEnd();
            setTimeout(() => {
                onStart();
            }, 300)
            return;
        }

        if (status === "readyToPlay") {
            if (isPlaying) {
                onStart();
                opcacity.value = withTiming(1, {
                    duration: 300,
                });
            } else {
                // onEnd();
            }
        }

    }, [isPlaying, status])

    return (

        <OverKeyboardView visible={true}>
            <GestureHandlerRootView style={{ flex: 1 }}>
            
                <Animated.View exiting={FadeOut} style={[{ flex: 1, backgroundColor: colors.white }, containerStyle]}>
                    <VideoView style={styles.video} player={player} contentFit={'cover'} nativeControls={false} surfaceType='textureView'/>
                </Animated.View>

            </GestureHandlerRootView>
        </OverKeyboardView>

    )
}

const useStyle = () => {

    const styles = StyleSheet.create({
        content: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: 'red'
        },

        video: {
            flex: 1,
        },


        overlay: {
            ...StyleSheet.absoluteFillObject,
            flex: 1,
            borderRadius: 10000,
            backgroundColor: "black",
        }
    })

    return { styles }
}

