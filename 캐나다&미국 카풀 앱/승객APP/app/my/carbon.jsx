// RevenueCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from "expo-router";
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';
import { BarChart } from 'react-native-gifted-charts';

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


function Chart({ data = [], containerW }) {

    const maxValue = Math.max(...data.map(item => item?.value || 0));
    // 최대값 자리수 계산
    const digits = Math.floor(Math.log10(maxValue)); // 예: 278 -> 2
    // 10^digits 단위로 올림
    const roundedMax = Math.ceil(maxValue / Math.pow(10, digits)) * Math.pow(10, digits);

    return (
        <BarChart
            data={data}
            width={undefined}                 // 부모 너비에 맞춤
            height={180}
            barWidth={16}
            spacing={8}
            barBorderRadius={2.5}
            noOfSections={5}
            maxValue={roundedMax * 1.1}                   // y축 최대값(예시에 맞춤)
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            showGradient
            initialSpacing={0}
            endSpacing={0}

            curved                      // 상단 둥근 모양 강조
            hideRules={false}
            rulesType="dashed"           // ← 점선
            rulesColor={"#EEE"}
            rulesLength={Math.max(0, containerW - 70)}
            rulesThickness={1}
            dashWidth={6}                // 점선 길이
            dashGap={4}                  // 점선 간격
        />
    );
}

export default function RevenueCard() {

    const insets = useSafeAreaInsets();

    const [item, setItem] = useState(null);

    const [category, setCategory] = useState('drive');
    const [range, setRange] = useState(1);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useEffect(() => {

        dataFunc(true);

    }, [range, category]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {
       
        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
        }
        const { data, error } = await API.post('/v2/my/statTotal', sender);

        setTimeout(() => {
            if (error) {
                ToastMessage(lang({ id: 'error?.message' }), { type: "error" });
                return;
            }
            setItem(data);

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'carbon_savings' })
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <ScrollView style={styles.root} contentContainerStyle={{ paddingHorizontal: rootStyle.side, paddingBottom: insets?.bottom + 20, gap: 20 }}>

                <View style={{ alignItems: 'center' }}>
                    <Image source={images.carbon} style={rootStyle.carbon} />
                </View>

                <View style={styles.titleBox}>
                    <Text style={styles.title}>{lang({ id: 'smart_ecofriendly_ca' })}</Text>
                    <Text style={styles.subTitle}>{lang({ id: 'share_ride_reduce' })}</Text>
                </View>

                <View style={{ alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: colors.sub_1, paddingBottom: 20 }}>
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'total_carbon_savings' })}</Text>
                    <Image source={images.down_arrow} style={rootStyle.default} />
                    <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}>{formatCompact(item?.data1)} {lang({ id: 'kg' })}</Text>
                </View>
                
                <View style={{ alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: colors.sub_1, paddingBottom: 20  }}>
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'carbon_savings_this' })}</Text>
                    <Image source={images.down_arrow} style={rootStyle.default} />
                    <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}>{formatCompact(item?.data2)} {lang({ id: 'kg' })}</Text>
                </View>

                <View style={{ alignItems: 'center', gap: 5 }}>
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'my_carbon_savings' })}</Text>
                    <Image source={images.down_arrow} style={rootStyle.default} />
                    <Text style={{ ...rootStyle.font(18, colors.taseta, fonts.semiBold) }}>{formatCompact(item?.data3)} {lang({ id: 'kg' })}</Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <Button onPress={() => { router.push(routes.myCarbonGraph) }}>{lang({ id: 'view_carbon_savings' })}</Button>
                </View>
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