import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OverKeyboardView } from 'react-native-keyboard-controller';
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    FadeOut,
    runOnJS,
} from "react-native-reanimated";

import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import consts from '@/libs/consts';
import { useEtc } from '@/libs/store';
import colors from '@/libs/colors';

export default function SplashScreen({ onStart, children }) {

    const player = useVideoPlayer({ uri: consts.splashVideo }, player => {
        console.log('player', player);
        player.loop = false;
        player.muted = true;
        player.staysActiveInBackground = true;

        player.play();
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player?.playing });
    const { status, error } = useEvent(player, 'statusChange', { status: player.status });
    
    useEventListener(player, 'playToEnd', () => {
        console.log("end play!!!!!");
        setAnimationComplete(true);
    });

    const { styles } = useStyle();
    const { appActiveStatus } = useEtc();

    const [isAppReady, setAppReady] = useState(false);
    const [isSplashAnimationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        console.log('status, error ', isPlaying, status, error);
    
        if (error) {
            onStart();
            setAppReady(true);
            setAnimationComplete(true);
            return;
        }
    
    }, [status, isPlaying]);

    useEffect(() => {
        if (status === "readyToPlay" && isPlaying) {
            onStart();
            setTimeout(() => {
                setAppReady(true);
            }, 3000)
        }

    }, [isPlaying, status])

    return (

        <View style={{ flex: 1, backgroundColor: colors.white }}>
            {isAppReady && children}
            {!isSplashAnimationComplete && (
                <Animated.View exiting={FadeOut} style={styles.content}>
                    <VideoView style={styles.video} player={player} contentFit={'cover'} nativeControls={false} surfaceType='textureView'/>
                </Animated.View>
            )}
        </View>
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
            backgroundColor: colors.white,
        },

        video: {
            flex: 1,
            width: "100%",
            height: "100%",
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

