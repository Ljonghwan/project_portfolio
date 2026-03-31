// RevenueCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from "expo-router";
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';

import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import Select from '@/components/Select';
import Text from '@/components/Text';
import Button from '@/components/Button';

import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import consts from '@/libs/consts';
import fonts from '@/libs/fonts';

import API from '@/libs/api';
import lang from '@/libs/lang';

import { formatCompact, numFormat } from '@/libs/utils';
import { useUser, useAlert, useGps } from '@/libs/store';


export default function RevenueCard() {

    const insets = useSafeAreaInsets();

    const [containerW, setContainerW] = useState(0);

    const [mode, setMode] = useState(1);

    const [idInfo, setIdInfo] = useState(null);
    const [backgroundInfo, setBackgroundInfo] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    const [list, setList] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        const { data, error } = await API.post('/v2/auth/info');


        setIdInfo(data?.idInfo);
        setBackgroundInfo(data?.backgroundInfo);
       
    }


     const criminalFunc = async () => {
        Alert.alert(lang({ id: 'criminal_record_verify2' }));

        const sender = {

        };

        const { data, error } = await API.post('/v2/auth/passengerApplyBackground', sender);
        console.log(data, error);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        dataFunc(true);
        ToastMessage(lang({ id: 'success_code_application' }));

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'additional_informati' })
    };

    return (
        <Layout header={header}>

            <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: rootStyle.side, paddingBottom: insets?.bottom + 20, gap: 55 }}>

                <View style={{ gap: 25 }}>
                    <View style={{ gap: 11 }}>
                        <Text style={{ ...rootStyle.font(30, colors.main, fonts.extraBold) }}>{lang({ id: 'id_verification' })}</Text>
                        <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{lang({ id: 'complete_verificatio' })}</Text>
                    </View>
                    
                    {idInfo?.status < 3 ? (
                        <Button type={2} disabled>{lang({ id: 'in_progress' })}</Button>
                    ) : (
                        <Button onPress={() => { router.push(routes.idVerification) }}>{lang({ id: 'verify_id' })}</Button>
                    )}
                </View>

                <View style={{ gap: 25 }}>
                    <View style={{ gap: 11 }}>
                        <Text style={{ ...rootStyle.font(24, colors.main, fonts.extraBold) }}>{lang({ id: 'criminal_record_verify' })}</Text>
                        <Text style={{ ...rootStyle.font(14, colors.sub_1, fonts.medium) }}>{lang({ id: 'complete_verificatio' })}</Text>
                    </View>

                    {backgroundInfo?.status < 3 ? (
                        <Button type={2} disabled>{lang({ id: 'in_progress' })}</Button>
                    ) : (
                        <Button onPress={criminalFunc}>{lang({ id: 'criminal_record_verify2' })}</Button>
                    )}

                </View>

                 {/* <View style={{ gap: 25 }}>
                    <View style={{ gap: 11 }}>
                        <Text style={{ ...rootStyle.font(30, colors.main, fonts.extraBold) }}>{lang({ id: 'driver_verification' })}</Text>
                        <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{lang({ id: 'complete_verificatio_1' })}</Text>
                    </View>
                    
                    <Button onPress={() => { router.push(routes.myCarbonGraph) }}>{lang({ id: 'verify_id' })}</Button>
                </View>

                 <View style={{ gap: 25 }}>
                    <View style={{ gap: 11 }}>
                        <Text style={{ ...rootStyle.font(30, colors.main, fonts.extraBold) }}>{lang({ id: 'id_verification' })}</Text>
                        <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium) }}>{lang({ id: 'complete_verificatio' })}</Text>
                    </View>
                    
                    <Button onPress={() => { router.push(routes.myCarbonGraph) }}>{lang({ id: 'verify_id' })}</Button>
                </View> */}
           
            </ScrollView>

        </Layout>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1
    },
    titleBox: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    title: {
        fontSize: 20,
        fontFamily: fonts.extraBold,
        color: colors.main,
        textAlign: 'center'
    },
    subTitle: {
        fontSize: 16,
        fontFamily: fonts.medium,
        color: colors.sub_1,
        letterSpacing: -0.64,
        textAlign: 'center'
    },



    card: {
        borderRadius: 16,
        backgroundColor: colors.white,
        padding: 16,
        // soft shadow
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#7A7A7A',
        fontSize: 14,
        fontFamily: fonts.medium,
        letterSpacing: 0.5
    },
    totalText: {
        fontSize: 30,
        lineHeight: 34,
        fontFamily: fonts.semiBold,
        color: colors.main,
        letterSpacing: -2
    },

    axisText: {
        fontSize: 10,
        color: colors.main
    },
});