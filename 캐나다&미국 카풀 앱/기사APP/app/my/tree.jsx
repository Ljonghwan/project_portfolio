import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, Pressable, useWindowDimensions } from 'react-native';

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
import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Page() {

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { styles } = useStyle();

    const { mbData } = useUser();
    const { badges, configOptions } = useConfig();

    const [mode, setMode] = useState(1);

    const [km, setKm] = useState(0);
    const [treeBadge, setTreeBadge] = useState(null);

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useEffect(() => {

        dataFunc();

    }, []);

    const dataFunc = async (reset) => {

        let kmCalc = Math.floor(mbData?.driveDistance / 1000 % 200) || 0;
        // let kmCalc = Math.floor(76) || 0;

        setKm(kmCalc); // 내 여행 km

        setList(configOptions?.treeInfo || []); // km당 나무 스텝 리스트

        const myBadge = configOptions?.treeInfo?.find(x => (kmCalc >= x?.min && kmCalc <= x?.max)) || null;
        // const myBadge = badges?.find(x => x?.idx === 5 && x?.type === 1) || null;

        setTreeBadge(myBadge); // 현재 내 나무 스텝 단계

        setTimeout(() => {

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
        title: lang({ id: 'tree_journey' })
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            {mode === 1 ? (
                <Animated.View key={'mode1'} entering={FadeIn} style={styles.root}>
                    <View style={{ gap: 12, paddingHorizontal: rootStyle.side }}>
                        <View style={{ gap: 5, alignItems: 'center', paddingHorizontal: rootStyle.side }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), textAlign: 'center' }}>{lang({ id: 'forest_grown_from' })}</Text>
                            <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center', lineHeight: 22 }}>{lang({ id: 'your_ecofriendly_jou' })}</Text>
                        </View>
                        <View style={{ gap: 5, alignItems: 'center' }}>
                            <Text style={{ ...rootStyle.font(20, colors.taseta, fonts.semiBold), textAlign: 'center' }}>{lang({ id: 'my_trees' })} {numFormat(mbData?.treeCount)}</Text>
                            <Text style={{ ...rootStyle.font(16, colors.taseta, fonts.medium), textAlign: 'center' }}>{lang({ id: 'your_journey' })} {`${numFormat(km)} ${lang({ id: 'km' })}`}</Text>
                        </View>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={consts.s3Url + treeBadge?.img} style={{ ...styles.badge, width: 180 }} />
                    </View>

                    <View style={{ gap: 10, paddingHorizontal: rootStyle.side }}>
                        <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center', lineHeight: 22 }}>{lang({ id: treeBadge?.title })}</Text>
                        <Button type={2} onPress={() => { setMode(2) }}>{lang({ id: 'how_can_i' })}</Button>
                    </View>
                </Animated.View>
            ) : (
                <Animated.View key={'mode2'} entering={FadeIn} style={{ flex: 1 }}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: rootStyle.side, paddingTop: 20, paddingBottom: insets?.bottom + 20, gap: 20 }}>
                        <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium), textAlign: 'center', lineHeigth: 22 }}>{lang({ id: 'more_you_ride' })}</Text>

                        <View style={{ gap: 35 }}>
                            {list?.map((x, i) => {
                                return (
                                    <View key={i} style={styles.list}>
                                        <Image source={consts.s3Url + x?.img} style={styles.badge} />
                                        <View style={{ flex: 1, gap: 9 }}>
                                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{`${numFormat(x?.min)}${lang({ id: 'km' })}`} ~ {`${numFormat(x?.max)}${lang({ id: 'km' })}`}</Text>
                                            <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium), lineHeight: 22 }}>{lang({ id: x?.title })}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>

                        <Button style={{ marginTop: 20 }} type={2} onPress={() => { setMode(1) }}>{lang({ id: 'tree_journey' })}</Button>
                    </ScrollView>
                </Animated.View>
            )}

        </Layout>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingTop: 20,
            paddingBottom: insets?.bottom + 20,
            justifyContent: 'space-between'
        },
        badge: {
            width: 55,
            aspectRatio: 1 / 1,
            borderRadius: 12
        },
        list: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15
        }

    })

    return { styles }
}
