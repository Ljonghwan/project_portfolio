import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Image } from 'expo-image';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, isMe, isProfile, isTime, chatTheme }) {

    const { styles } = useStyle();
    
    const { audioId, setAudioId } = useEtc();

    const [isPlay, setIsPlay] = useState(false);

    // expo-audio 훅 사용
    const player = useAudioPlayer(
        item?.data?.file ? { uri: consts.s3Url + item?.data?.file } : null
    );
    const status = useAudioPlayerStatus(player);

    // 다른 음성메시지가 재생되거나, 재생 완료 시 정지
    useEffect(() => {
        if (audioId !== item?.idx) {
            // 다른 메시지가 재생 중이면 현재 플레이어 정지
            if (status.playing) {
                player.pause();
                player.seekTo(0);
            }
            setIsPlay(false);
        }
    }, [audioId, item?.idx]);

    // 재생 완료 감지
    useEffect(() => {
        if (status.didJustFinish) {
            player.pause();
            player.seekTo(0);
            setIsPlay(false);
        }
    }, [status.didJustFinish]);

    // 실제 재생 상태와 동기화
    useEffect(() => {
        if (!status.playing && isPlay) {
            // 외부 요인으로 정지된 경우
            setIsPlay(false);
        }
    }, [status.playing]);

    const play = async () => {
        if (!item?.data?.file) {
            ToastMessage('음성메시지 읽기에 실패했습니다.');
            return;
        }

        if (!status.isLoaded) {
            // 아직 로딩 중이면 대기
            return;
        }

        // 현재 재생 중인 오디오 ID 설정
        setAudioId(item?.idx);

        await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            interruptionMode: 'duckOthers',
        });

        // 처음부터 재생
        player.loop = false;
        await player.seekTo(0);
        player.play();
        setIsPlay(true);
    };

    const pause = () => {
        player.pause();
        setIsPlay(false);
    };

    return (
        <AnimatedBackground bg={isMe ? chatTheme?.balloonBackgroundColor1 : chatTheme?.balloonBackgroundColor2} style={[isMe ? styles.itemBallonMe : styles.itemBallon]}>
            <Pressable 
                style={styles.voiceBox} 
                onPress={() => isPlay ? pause() : play()} 
                hitSlop={16}
            >
                {isPlay ? (
                    <Image 
                        source={isMe ? images.voice_pause_white : images.voice_pause} 
                        style={rootStyle.default16}
                        tintColor={isMe ? chatTheme?.balloonTextColor1 : chatTheme?.balloonTextColor2}
                        transition={200}
                    />
                ) : (
                    <Image 
                        source={isMe ? images.voice_play_white : images.voice_play} 
                        style={rootStyle.default16} 
                        tintColor={isMe ? chatTheme?.balloonTextColor1 : chatTheme?.balloonTextColor2}
                        transition={200}
                    />
                )}
                
                <AnimatedText color={isMe ? chatTheme?.balloonTextColor1 : chatTheme?.balloonTextColor2} style={[isMe ? styles.itemBallonTextMe : styles.itemBallonText]}>
                    {dayjs(item?.data?.duration || 0).format('mm:ss')}
                </AnimatedText>
            </Pressable>
        </AnimatedBackground>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
       
        itemBallon: {
            padding: 16,
            borderRadius: 20,
            borderTopLeftRadius: 0,
            backgroundColor: colors.greyF6
        },
        itemBallonMe: {
            padding: 16,
            borderRadius: 20,
            borderTopRightRadius: 0,
            backgroundColor: colors.chat1
        },
        itemBallonText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark
        },
        itemBallonTextMe: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.white
        },
        voiceBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
      
    });

    return { styles };
};