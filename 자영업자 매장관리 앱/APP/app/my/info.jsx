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
import Profile from '@/components/Profile';

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

import { ToastMessage, getFullDateFormat, hpHypen } from '@/libs/utils';

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


    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '내 정보',
    };

    return (
        <Layout header={header} >

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 15, paddingBottom: insets?.bottom + 20, paddingHorizontal: 20 }}

            >
                <View style={{ gap: 47 }}>
                    <View style={{ alignItems: 'center' }}>
                        <Profile />
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingVertical: 14, gap: 10 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                            <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>가입 유형</Text>

                            <View style={[rootStyle.flex, {gap: 6}]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575) }}>{consts.snsTypes.find(x => x?.idx === mbData?.type)?.title}</Text>
                            </View>
                        </View>
                        
                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                            <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>이름</Text>

                            <View style={[rootStyle.flex, {}]}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575) }}>{mbData?.name}</Text>
                            </View>
                        </View>

                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                            <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>닉네임</Text>

                            <TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { gap: 6 }]} onPress={() => {
                                router.push(routes.myInfoNick)
                            }}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575) }}>{mbData?.nickname}</Text>
                                <Image source={images.link} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>

                        {mbData?.type === 'account' && (
                            <>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                                    <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>아이디</Text>

                                    <View style={[rootStyle.flex, {}]}>
                                        <Text style={{ ...rootStyle.font(14, colors.text757575) }}>{mbData?.account}</Text>
                                    </View>
                                </View>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                                    <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>비밀번호</Text>

                                    <TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { gap: 6 }]} onPress={() => {
                                        router.push(routes.myInfoPassword)
                                    }}>
                                        <Text style={{ ...rootStyle.font(14, colors.primaryBright) }}>변경하기</Text>
                                        <Image source={images.link} style={rootStyle.default} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                            <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.medium) }}>휴대폰 번호</Text>

                            <TouchableOpacity activeOpacity={0.7} style={[rootStyle.flex, { gap: 6 }]} onPress={() => {
                                router.push({
                                    pathname: routes.cert,
                                    params: {
                                        type: 'update'
                                    }
                                })
                            }}>
                                <Text style={{ ...rootStyle.font(14, colors.text757575) }}>{hpHypen(mbData?.hp)}</Text>
                                <Image source={images.link} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>

            </ScrollView>
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({


    })

    return { styles }
}