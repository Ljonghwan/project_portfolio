import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, TouchableOpacity, Platform, AppRegistry, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

import InCallManager from 'react-native-incall-manager';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Select from '@/components/Select';

import AndroidAudioSelect from '@/components/popups/AndroidAudioSelect';


import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, regEmail, useBackHandler, checkMic, useInterval } from '@/libs/utils';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';

export default function Page() {

    const { width } = useSafeAreaFrame();
    const router = useRouter();

    const { styles } = useStyle();
    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { currentCall, callInvite, selectedDevice, audioDevices, deviceToken, hangup, setAudioDevice, toggleMute } = useTwilioVoice();

    const startTime = useRef(null);

    const [callData, setCallData] = useState(null);
    const [mute, setMute] = useState(false);
    const [time, setTime] = useState(0);
    const [status, setStatus] = useState('connecting');
    const [endLoad, setEndLoad] = useState(false);

    useBackHandler(() => {
        handleCloseAlert();
        return true;
    });

    useInterval(() => {

        const customParams = currentCall?.getCustomParameters();

        if(mbData?.idx !== customParams?.callerIdx*1) {
            setTime(dayjs().diff(dayjs(currentCall?.getInitialConnectedTimestamp()), 'second') || 0);
            
            setStatus(currentCall?.getState());

        } else {
            getCallStatus();
        }

    }, 1000);

    useEffect(() => {

        if (Platform.OS === 'android') {
            InCallManager.start({ auto: true, media: 'audio', ringback: '' });
        }

        checkMicFunc();

        return () => {
            if (Platform.OS === 'android') {
                InCallManager.stop();
            }
        }

    }, [])

    useEffect(() => {
        console.log(Platform.OS, 'selectedDevice', selectedDevice);
        console.log(Platform.OS, 'audioDevices', audioDevices);
    }, [selectedDevice, audioDevices])

    useEffect(() => {

        if (!currentCall) {
            setEndLoad(true);
            setTimeout(() => {
                router.back();
            }, 1000)
        } else {
            setCallData(currentCall?.getCustomParameters() || null);
        }
        
    }, [currentCall])

    const getCallStatus = async () => {

        const sender = {
            callSid: currentCall?.getSid()
        }
        const { data, error } = await API.post('/v1/chat/callStatus', sender);

        setStatus(data?.status === 2 ? 'connected' : 'connecting');
        setTime(dayjs().diff(dayjs(data?.acceptAt || dayjs()), 'second') || 0);
    }

    const checkMicFunc = async () => {

        const result = await checkMic();

        if (!result) {
            setTimeout(() => {
                handleClose();
            }, 1000)
        };

    }

    const handleCloseAlert = () => {

        openAlertFunc({
            icon: images.warning,
            label: `통화를 종료할까요?`,
            onCencleText: "취소",
            onPressText: "종료하기",
            onCencle: () => { },
            onPress: handleClose
        })
    }

    const handleClose = () => {
        hangup();
    }

    const muteFunc = async () => {
        const result = await toggleMute();
        setMute(result);
    }

    const androidAudioSelect = () => {

        openAlertFunc({
            alertType: 'Sheet',
            detached: true,
            component: <AndroidAudioSelect audioDevices={audioDevices} selectedDevice={selectedDevice} setAudioDevice={setAudioDevice} />
        })

    }

    return (
        <Layout >
            <View style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                paddingVertical: 120,
                paddingHorizontal: width <= 320 ? 20 : 40,
            }}>
                <View style={{ alignItems: 'center', gap: 20, marginTop: 100 }}>
                    <Image
                        source={
                            callData?.callerName === mbData?.name ?
                                (callData?.calleeProfile ? consts.s3Url + callData?.calleeProfile : images.profile)
                                :
                                (callData?.callerProfile ? consts.s3Url + callData?.callerProfile : images.profile)}
                        style={{ width: 160, aspectRatio: 1, borderRadius: 1000 }}
                    />
                    <Text style={{ ...rootStyle.font(22, colors.dark, fonts.semiBold) }}>{callData?.callerName === mbData?.name ? callData?.calleeName : callData?.callerName}</Text>
                    {endLoad ? (
                        <View style={[rootStyle.flex, { gap: 4 }]}>
                            <Text style={{ ...rootStyle.font(14, colors.dark, fonts.medium) }}>통화가 종료되었습니다.</Text>
                        </View>
                    ) : status !== 'connected' ? 
                        <View style={[rootStyle.flex, { gap: 4 }]}>
                            <Text style={{ ...rootStyle.font(14, colors.dark, fonts.medium) }}>연결 중입니다.</Text>
                            <ActivityIndicator size="small" color={colors.dark} />
                        </View>
                    : 
                        <Text>{dayjs.duration(time, 'seconds').format('mm:ss')}</Text>
                    }
                </View>

                <View style={{ alignItems: 'center', gap: 40 }}>
                    <View style={[rootStyle.flex, { width: '100%', justifyContent: 'space-between' }]}>

                        <TouchableOpacity style={styles.button} onPress={muteFunc}>
                            <Image source={mute ? images.mic_off : images.mic_on} style={{ width: 40, aspectRatio: 1 }} tintColor={colors.grey6} transition={200} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={() => Platform.OS === 'android' ? androidAudioSelect() : setAudioDevice()}>
                            <Image source={images.speaker_off} style={{ width: 40, aspectRatio: 1 }} tintColor={colors.grey6} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={!endLoad ? hangup : () => {}}>
                            <Image source={images.call_reject} style={{ width: 70, aspectRatio: 1 }} />
                        </TouchableOpacity>

                        {/* <View>
                        {audioDevices?.map((device) => (
                            <TouchableOpacity key={device.uuid} onPress={() => setAudioDevice(device)}>
                                <Text>{device.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View> */}
                    </View>
                </View>

            </View>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        button: {
            width: 70,
            borderRadius: 100,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.greyE,
        }
    })

    return { styles }
}
