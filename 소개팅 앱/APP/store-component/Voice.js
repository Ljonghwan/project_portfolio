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

import {
    useAudioPlayer,
    useAudioPlayerStatus,
    useAudioRecorder,
    useAudioRecorderState,
    RecordingPresets,
    setAudioModeAsync,
    AudioModule,
} from 'expo-audio';

import { File } from 'expo-file-system/next';

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

// Player 컴포넌트
function Player({ audioSource }) {
    const { styles } = useStyle();

    const [initLoad, setInitLoad] = useState(true);

    // expo-audio 훅 사용
    const player = useAudioPlayer(audioSource);
    const status = useAudioPlayerStatus(player);

    // 초기 로딩 완료 처리
    useEffect(() => {
        if (status.isLoaded) {
            setTimeout(() => {
                setInitLoad(false);
            }, 500);
        }
    }, [status.isLoaded]);

    // 재생 완료 시 처음으로 되돌리기 (expo-audio는 자동으로 안 됨)
    useEffect(() => {
        if (status.didJustFinish) {
            player.seekTo(0);
        }
    }, [status.didJustFinish]);

    const play = async () => {
        await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'doNotMix',
        });

        player.play();
    };

    const pause = () => {
        player.pause();
    };

    // 밀리초로 변환 (dayjs 포맷용)
    const currentDurationMs = (status.currentTime || 0) * 1000;
    const durationMs = (status.duration || 0) * 1000;

    return (
        <View style={styles.timerBox}>
            {initLoad && (
                <Loading style={{ position: 'absolute', backgroundColor: colors.dim, zIndex: 1 }} />
            )}

            {status.playing ? (
                <Icon img={images.voice_pause} imgStyle={rootStyle.default} onPress={pause} />
            ) : (
                <Icon img={images.voice_play} imgStyle={rootStyle.default} onPress={play} />
            )}
            <Text style={styles.timerText}>
                {dayjs(currentDurationMs || durationMs).format('mm:ss')}
            </Text>
        </View>
    );
}

export default function Voice({ onSend }) {

    const { styles } = useStyle();

    const { closeAlertFunc } = useAlert();

    const [isEnd, setIsEnd] = useState(false);
    const [lastDurationMillis, setLastDurationMillis] = useState(0);

    // expo-audio 녹음 훅 사용
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder);

    // 1분 제한 체크
    useEffect(() => {
        if (recorderState.durationMillis > 60000) {
            ToastMessage('음성메시지는 최대 1분까지 녹음 가능합니다.');
            stopRecording();
        }
    }, [recorderState.durationMillis]);

    // 권한 요청
    useEffect(() => {
        (async () => {
            const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
            if (!permissionStatus.granted) {
                ToastMessage('마이크 권한이 필요합니다.');
            }
        })();
    }, []);

    const record = async () => {
        try {
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            await recorder.prepareToRecordAsync();
            recorder.record();
        } catch (error) {
            ToastMessage('마이크 호출에 실패했습니다.');
            console.log('error', error);
        }
    };

    const stopRecording = async () => {
        // 현재 녹음 시간 저장
        setLastDurationMillis(recorderState.durationMillis);

        await recorder.stop();

        const uri = recorder.uri;
        if (uri) {
            const file = new File(uri);
            setIsEnd(file?.uri);
        }
    };

    const sendFunc = async () => {
        const file = new File(isEnd);
        console.log('sendFunc', lastDurationMillis);
        
        closeAlertFunc();
        onSend(
            file?.exists ? {
                file: {
                    base: "data:audio/x-m4a;base64," + file?.base64(),
                    ext: "m4a",
                },
                duration: lastDurationMillis
            } : null
        );
    };

    return (
        <View style={styles.root}>
            <View 
                style={[styles.top]}
            >
                <View style={styles.voiceBox}>
                    <Text style={styles.title}>음성 메시지</Text>

                    {isEnd ? (
                        <Player audioSource={isEnd} />
                    ) : (
                        <View style={styles.timerBox}>
                            <Text style={styles.timerText}>
                                {dayjs(recorderState.durationMillis || 0).format('mm:ss')}
                            </Text>
                        </View>
                    )}

                    {isEnd ? (
                        <TouchableOpacity style={styles.recordButton} onPress={sendFunc}>
                            <Image source={images.voice_send} style={rootStyle.default40} />
                        </TouchableOpacity>
                    ) : (
                        recorderState.isRecording ? (
                            <TouchableOpacity style={styles.recordButton} onPress={stopRecording}>
                                <Image source={images.voice_end} style={rootStyle.default48} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.recordButton} onPress={record}>
                                <Image source={images.voice_start} style={rootStyle.default48} />
                            </TouchableOpacity>
                        )
                    )}
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