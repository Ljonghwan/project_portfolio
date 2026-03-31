import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, Linking } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';

import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';


import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import TextInput from '@/components/TextInput';

import Tab from '@/components/Ui/Tab';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat, regNick } from '@/libs/utils';

import { useUser, useStore, useConfig, useEtc, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout } = useUser();
    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { appActiveStatus } = useEtc();

    const { configOptions } = useConfig();

	const iref = useRef();

    const [nickname, setNickname] = useState("");

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {

        const isValid = regNick.test(nickname);
        console.log('isValid', isValid);
        setDisabled(!(isValid && mbData?.nickname !== nickname));

    }, [mbData, nickname])

    const handleSubmit = async () => {

        Keyboard.dismiss();

        setLoad(true);

        const sender = {
            type: 'nickname',
            nickname: nickname
        }

        const { data, error } = await API.post('/v1/my/updateInfo', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('닉네임이 변경되었습니다.');
            setNickname("");
            reload();
            router.back();

        }, consts.apiDelay)

    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '닉네임',
    };

    return (
        <Layout header={header}>

            <Pressable style={{ flex: 1, paddingTop: 20, paddingHorizontal: 35, gap: 20 }} onPress={() => {
                Keyboard.dismiss();
            }}>

                <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(24, colors.text2B2B2B, fonts.bold), lineHeight: 34 }}>닉네임을 입력해 주세요</Text>
                    <Text style={{ ...rootStyle.font(14, colors.text757575) }}>닉네임은 1달에 1번만 변경 가능</Text>
                </View>

                <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>닉네임</Text>

                    <TextInput
                        iref={iref}
                        autoFocus
                        label={'닉네임'}
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="닉네임을 입력해주세요."
                        maxLength={10}
                        style={{
                            fontSize: 14
                        }}
                    />

                </View>

            </Pressable>

            {dayjs().isBefore(dayjs(mbData?.nickAt).add(30, 'day')) ? (
                <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={true} >{dayjs(mbData?.nickAt).add(30, 'day').format('YY년 MM월 DD일')} 이후 변경가능</Button>
            ) : (
                <Button bottom style={{ position: 'absolute', bottom: 0 }} load={load} disabled={disabled} onPress={handleSubmit}>변경</Button>
            )}

            
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({


    })

    return { styles }
}