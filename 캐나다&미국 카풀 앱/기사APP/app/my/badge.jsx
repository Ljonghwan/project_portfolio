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

import { formatCompact, numFormat, getTreeBadge } from '@/libs/utils';
import { useUser, useAlert, useConfig } from '@/libs/store';


export default function Page() {

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions(); 
    const { styles } = useStyle();

    const { mbData } = useUser();
    const { badges } = useConfig();

    const listRef = useRef(null);

    const [mode, setMode] = useState(1);

    const [treeBadge, setTreeBadge] = useState(null);
    const [selected, setSelected] = useState(null);

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {

        dataFunc();

    }, []);

    useEffect(() => {

        if(selected) {
            let index = list?.findIndex(x => x?.idx === selected?.idx);
            listRef?.current?.scrollToIndex({ index: index < 0 ? 0 : index, viewOffset: (width / 2) - (styles.badge.width / 2) });
        }

    }, [selected, list])

    const dataFunc = async (reset) => {
        
        setList(badges?.filter(x => x?.type === 1) || []); // 뱃지 리스트

        setTimeout(() => {
            
            const myBadge = getTreeBadge({ badges: badges, userBadges: mbData?.badges });

            setTreeBadge(myBadge);
            setSelected(myBadge);
            
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        const lock = !treeBadge || item?.idx > treeBadge?.idx;

        return (
            <Pressable onPress={() => { setSelected(item) }}>
                <Image source={lock ? images.badge_lock : consts.s3Url + item?.imgPath} style={styles.badge} />
            </Pressable>
        )
    };


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'badge' })
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
                <View style={{ gap: 30 }}>
                    <FlatList
                        ref={listRef}
                        data={list}
                        renderItem={renderItem}
                        contentContainerStyle={{
                            gap: 20,
                            paddingHorizontal: rootStyle.side,
                        }}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScrollToIndexFailed={({ index })=>{
                            // listRef?.current?.scrollToIndex({ index: index, viewOffset: (width / 2) - (styles.badge.width / 2) });
                        }}
                    />
                    <View style={{ gap: 5, paddingHorizontal: rootStyle.side * 2, alignItems: 'center' }}>
                        <Text style={{ ...rootStyle.font(20, colors.taseta, fonts.semiBold), textAlign: 'center' }}>{lang({ id: 'my_trees' })} {numFormat(mbData?.treeCount)}</Text>
                        {!treeBadge || selected?.idx > treeBadge?.idx ? (
                            <>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), textAlign: 'center' }}>{lang({ id: 'badges_locked' })}</Text>
                                <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: 'drive_taseta_earn' })}</Text>
                            </>    
                        ) : (
                            <>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), textAlign: 'center' }}>{lang({ id: selected?.title })}</Text>
                                <Text style={{ ...rootStyle.font(16, colors.taseta, fonts.medium), textAlign: 'center' }}>{lang({ id: selected?.requirement })}</Text>
                                <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: selected?.desc })}</Text>
                            </>
                        )}
                        
                    </View>
                </View>

                <View style={{ gap: 45, paddingHorizontal: rootStyle.side }}>
                    <Text style={{ ...rootStyle.font(16, colors.taseta_1, fonts.medium), textAlign: 'center', lineHeight: 22 }}>{lang({ id: !treeBadge || selected?.idx > treeBadge?.idx ? 'grow_your_green_journey' : 'youre_embracing_your' })}</Text>
                    <Button onPress={() => { router.push(routes.myTree) }}>{lang({ id: 'tree_journey' })}</Button>
                </View>
            </View>
          

        </Layout>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingBottom: insets?.bottom + 20,
            justifyContent: 'space-between'
        },
        badge: {
            width: 95,
            aspectRatio: 1 / 1,
            borderRadius: 12
        }

    })

    return { styles }
}
