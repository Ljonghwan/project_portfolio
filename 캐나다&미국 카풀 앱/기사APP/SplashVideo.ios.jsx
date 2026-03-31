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

import colors from './libs/colors';


const { width, height } = Dimensions.get("window");

const maxRadius = Math.hypot(width / 2, height / 2);
const maxDiameter = maxRadius * 2;

export default function SplashVideo({ onStart, onEnd }) {

    const diameter = useSharedValue(0);
    const opcacity = useSharedValue(1);
    // maskElement로 사용할 애니메이트된 원 스타일
    const maskStyle = useAnimatedStyle(() => {
        const d = diameter.value;
        return {
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: "black", // 마스크는 alpha(불투명 부분이 보임) 사용
            // 중앙 정렬을 위해 transform으로 중앙 위치 보정
            transform: [
                { translateX: (width / 2) - d / 2 },
                { translateY: (height / 2) - d / 2 },
            ],
        };
    });

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
        // opcacity.value = withTiming(0, {
        //     duration: 1000,
        // });

        diameter.value = withTiming(0, {
            duration: 500,
            easing: Easing.in(Easing.exp),
        },  (finished) => {
            if (finished) {
                // 3️⃣ 애니메이션 끝나면 메인으로 이동
                runOnJS(onEnd)();
            }
        });
    });

    const { styles } = useStyle();
    const { appActiveStatus } = useEtc();


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
                // 0 -> 화면을 덮는 지름까지 애니메이션
                diameter.value =
                    withTiming(maxDiameter, {
                        duration: 800,
                        easing: Easing.out(Easing.exp),
                    })

            } else {
                // onEnd();
            }
        }

    }, [isPlaying, status])

    return (

        <OverKeyboardView visible={true}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* MaskedView: maskElement로 정의한 원이 보이는 부분 */}
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    androidRenderingMode={'software'}
                    maskElement={
                        // maskElement는 화면 전체를 채우는 요소여야 함
                        <Animated.View style={[StyleSheet.absoluteFill]}>
                            {/* 검은 사각(투명하게 보일 부분 없음) 위에 중앙 원(불투명 -> 보여짐) */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="none" />
                            <Animated.View style={maskStyle} pointerEvents="none" />
                        </Animated.View>
                    }
                >
                    {/* 여기에 '보여져야 할 화면'을 넣는다.
            이 전체 블록은 maskElement의 불투명 부분(원)만 보인다 */}
                    <Animated.View style={[{ flex: 1, backgroundColor: colors.white }, containerStyle]}>
                        <VideoView style={styles.video} player={player} contentFit={'cover'} nativeControls={false} />
                    </Animated.View>
                </MaskedView>

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

