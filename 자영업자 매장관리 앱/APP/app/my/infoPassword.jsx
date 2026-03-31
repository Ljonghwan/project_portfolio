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

import { ToastMessage, getFullDateFormat, regPassword } from '@/libs/utils';

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
    const confirmPasswordRef = useRef(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        const isPasswordValid = regPassword.test(password);
        const isConfirmPasswordValid = regPassword.test(confirmPassword) && password === confirmPassword;

        setDisabled(!(isPasswordValid && isConfirmPasswordValid));
    }, [password, confirmPassword])

    const handleSubmit = async () => {

        Keyboard.dismiss();

        setLoad(true);

        const sender = {
            type: 'password',
            password: password,
        }

        const { data, error } = await API.post('/v1/my/updateInfo', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('비밀번호가 변경되었습니다.');
            reload();
            router.back();

        }, consts.apiDelay)

    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '비밀번호 재설정',
    };

    return (
        <Layout header={header}>

            <Pressable style={{ flex: 1, paddingTop: 20, paddingHorizontal: 35, gap: 20 }} onPress={() => {
                Keyboard.dismiss();
            }}>

                {/* <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(24, colors.text2B2B2B, fonts.bold), lineHeight: 34 }}>닉네임을 입력해 주세요</Text>
                    <Text style={{ ...rootStyle.font(14, colors.text757575) }}>닉네임은 1달에 1번만 변경 가능</Text>
                </View> */}

                <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>비밀번호</Text>

                    <TextInput
                        iref={iref}
                        autoFocus
                        value={password}
                        onChangeText={setPassword}
                        placeholder="8자 이상 영문/숫자/특수문자 조합"
                        secureTextEntry
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        maxLength={30}
                        style={{
                            fontSize: 14
                        }}
                    />
                </View>

                <View style={{ gap: 8 }}>
                    <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>비밀번호 확인</Text>

                    <TextInput
                        iref={confirmPasswordRef}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="비밀번호 재입력"
                        secureTextEntry
                        maxLength={30}
                        style={{
                            fontSize: 14
                        }}
                    />
                </View>



            </Pressable>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} load={load} disabled={disabled} onPress={handleSubmit}>비밀번호 변경</Button>


        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({


    })

    return { styles }
}