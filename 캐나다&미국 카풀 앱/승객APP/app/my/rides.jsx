// RevenueCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from "expo-router";
import { Image } from 'expo-image';

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

import { formatCompact  } from '@/libs/utils';
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

    const [containerW, setContainerW] = useState(0);

    const [category, setCategory] = useState('drive');
    const [range, setRange] = useState(1);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    const [list, setList] = useState([]);
    const [total, setTotal] = useState(0);

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
            category: category,
            type: range
        }
        const { data, error } = await API.post('/v2/my/graph', sender);

        setTimeout(() => {
            if (error) {
                ToastMessage(lang({ id: 'error?.message' }), { type: "error" });
                return;
            }

            setList(
                data?.map((v, i) => ({
                    value: v?.value,
                    label: (range === 1 ? dayjs(new Date(2025, v?.label, 1)).format("MMM") : v?.label) || "??",
                    frontColor: '#7C9971F0',      // 기본색
                    gradientColor: '#BCD4B3',   // 그라데이션 하이라이트
                    topLabelComponent: () => (
                        <Text style={{ color: colors.taseta, fontSize: 6.5, marginBottom: 6, }}>{v?.value}</Text>
                    ),
                })) || []
            )
            setTotal(data?.reduce((acc, item) => acc + item?.value, 0));
            // setTotal(999);
            // setList([]);
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
        title: lang({ id: 'my_rides' })
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
            {load && (<Loading color={colors.black} style={{ backgroundColor: colors.dimWhite }} fixed />)}

            <View style={styles.root}>
                <View style={styles.titleBox}>
                    <Text style={styles.title}>{lang({ id: 'my_rides_earnings' })}</Text>
                    <Text style={styles.subTitle}>{lang({ id: 'easily_monitor_your' })}</Text>
                </View>

                <View style={styles.card} onLayout={e => setContainerW(e.nativeEvent.layout.width)}
                >
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.label}>{range === 1 ? lang({ id: 'total_1' }) : dayjs().format("MMMM")}</Text>
                            <Text style={styles.totalText}>
                                {formatCompact(total)}
                            </Text>
                        </View>

                        {/* 아주 간단한 드롭다운 모킹 */}
                        <Select
                            state={range}
                            setState={setRange}
                            list={consts.graphOptions.map((x, i) => {
                                return { ...x, title: lang({ id: x?.title }) }
                            })}
                            style={rootStyle.default}
                        >
                            <Image source={images.filter} style={rootStyle.default} />
                            {/*                             
                            <View style={styles.dropdown}>
                                <Text style={styles.dropdownText}>{ lang({ id: consts.graphOptions.find(x => x?.idx === range)?.title }) } ▾</Text>
                            </View> */}
                        </Select>

                    </View>

                    <Chart data={list} containerW={containerW} />
                </View>

                <View style={[rootStyle.flex, { gap: 14 }]}>
                    <Button style={{ flex: 1 }} type={category === 'drive' ? 1 : 2} onPress={() => { setCategory('drive') }}>{lang({ id: 'my_rides' })}</Button>
                    <Button style={{ flex: 1 }} type={category === 'pay' ? 1 : 2} onPress={() => { setCategory('pay') }}>{lang({ id: 'earnings' })}</Button>
                </View>
            </View>

        </Layout>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: rootStyle.side,
        paddingVertical: 20,
        gap: 25,
        flex: 1
    },
    titleBox: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: rootStyle.side
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