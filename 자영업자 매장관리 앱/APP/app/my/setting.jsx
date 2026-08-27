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
import Switch from '@/components/Switch';

import Info from '@/components/Ui/Info';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, useInterval } from '@/libs/utils';

import { useUser, useStore, useConfig, useEtc, useAlert, useLoader } from '@/libs/store';

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout, pushToken } = useUser();
    const { store } = useStore();
	const { openAlertFunc } = useAlert();
    const { appActiveStatus } = useEtc();

    const { configOptions } = useConfig();

    const [alarm, setAlarm] = useState(false);
    const [marketing, setMarketing] = useState(false);


    // useInterval(() => {
    //     reload();
    // }, 1000);
    
    useFocusEffect(
        useCallback(() => {
            checkPermission().then((enabled) => {
                setAlarm(enabled);
            });
            reload();
        }, [appActiveStatus])
    );

    const toggleAlarmPress = async () => {

        await Linking.openSettings();
        return;
    }

    const checkPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    }

    const toggleMarketingPress = async (type = 1) => {

        const sender = {
            type,
            status: type === 1 ? (!mbData?.marketing1) : (!mbData?.marketing2)
        }
        const { data, error } = await API.post('/v1/my/marketing', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        reload();
    }

    const toggleMainDevicePress = async () => {

        const sender = {
            deviceToken: pushToken
        }
        const { data, error } = await API.post('/v1/my/device', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        reload();
    }

    const logoutFunc = () => {
        openAlertFunc({
			label: '로그아웃 하시겠습니까?',
			onCencleText: '취소',
			onPressText: '로그아웃',
			onCencle: () => { },
			onPress: logout
		})
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '앱설정',
    };

    return (
        <Layout header={header} >

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 20, paddingHorizontal: 11 }}

            >
                <View style={styles.section}>
                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.medium), paddingVertical: 14.5 }}>대표 기기로 설정</Text>
                    <View style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]}>
                        
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <Info 
                                infoComponent={
                                    <View style={{ borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderGray, backgroundColor: colors.white, padding: 12 }}>
                                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.regular ), lineHeight: 20, }}>
                                            {`대표 기기란?\n- 푸시 알림을 수신하는 기기입니다.\n- 한 번에 하나의 기기만 설정할 수 있습니다.\n- 다른 기기에서 설정 시 자동으로 변경됩니다.`}
                                        </Text>
                                    </View>
                                }
                                boxStyle={{ minWidth: 260 }}
                                left={styles.section?.paddingHorizontal + 11}
                                transformOrigin={'top left'}
                            >
                                <View style={[rootStyle.flex, { gap: 4, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ ...rootStyle.font(15, colors.black) }}>이 기기에서 알림 수신</Text>
                                    <Image source={images.question} style={rootStyle.default18} tintColor={colors.black}/>
                                </View>
                            </Info>
                        </View>
                        
                        <Switch
                            value={pushToken === mbData?.deviceToken}
                            togglePress={toggleMainDevicePress}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.medium), paddingVertical: 14.5 }}>알림 설정</Text>
                    <View style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>일반 알림 설정</Text>
                        <Switch
                            value={alarm}
                            togglePress={toggleAlarmPress}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.medium), paddingVertical: 14.5 }}>마케팅 정보 수신</Text>
                    <View style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>메일 수신 동의</Text>
                        <Switch
                            value={mbData?.marketing1}
                            togglePress={() => toggleMarketingPress(1)}
                        />
                    </View>
                    <View style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>SMS 수신동의</Text>
                        <Switch
                            value={mbData?.marketing2}
                            togglePress={() => toggleMarketingPress(2)}
                        />
                    </View>
                </View>


                <View style={styles.section}>
                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.medium), paddingVertical: 14.5 }}>서비스 안내</Text>

                    {consts.terms?.filter(x => x?.type).map((x, i) => {
                        return (
                            <TouchableOpacity key={i} activeOpacity={0.7} style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]} onPress={() => {
                                router.push({
                                    pathname: routes.terms,
                                    params: {
                                        idx: x?.type
                                    }
                                });
                            }}>
                                <Text style={{ ...rootStyle.font(15, colors.black) }}>{x?.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                    
                    <View style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>버전정보</Text>
                        <Text style={{ ...rootStyle.font(13, colors.text686B70) }}>
                            {APP_ENV === 'development' ? 'local-' : APP_ENV === 'preview' ? 'D' : ''}
                            {Application.nativeApplicationVersion}
                        </Text>
                    </View>
                </View>


                <View style={styles.section}>
                    <Text style={{ ...rootStyle.font(13, colors.text686B70, fonts.medium), paddingVertical: 14.5 }}>계정관리</Text>

                   <TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]} onPress={logoutFunc}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>로그아웃</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { height: 48, justifyContent: 'space-between' }]} onPress={() => {
                        router.push(routes.myLeave);
                    }}>
                        <Text style={{ ...rootStyle.font(15, colors.black) }}>회원 탈퇴</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({

        section: {
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.eeeeef,
        }
    })

    return { styles }
}