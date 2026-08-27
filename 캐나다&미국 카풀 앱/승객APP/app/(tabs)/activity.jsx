import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    Dimensions,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Lock from '@/components/Lock';

import PostTicket from '@/components/Item/PostTicket';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, getPosition } from '@/libs/utils';

import { useUser, useAlert, useEtc, useCarpool } from '@/libs/store';

export default function Page({ }) {

    const { back } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();


    const { mbData } = useUser();
    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [radius, setRadius] = useState(10); // 반경

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const viewables = useSharedValue([]);


    // useFocusEffect(
    //     useCallback(() => {
    //         if(initLoad) getPositionFunc();
    //     }, [initLoad])
    // );

    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/passenger/history/onRide');

        setList(data?.carpoolList?.filter(x => x?.status < 4) || []);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        let myInfo = item?.joins?.find(x => x?.user?.idx === mbData?.idx);
        let parse = {
            ...item,
            start: item?.itinerary?.find(x => x?.idx === myInfo?.startIdx) || item?.itinerary?.[0],
            end: item?.itinerary?.find(x => x?.idx === myInfo?.endIdx) || item?.itinerary?.at(-1),
        };

        return (
            <PostTicket item={parse} style={{ marginHorizontal: rootStyle.side, marginBottom: 23 }} />
        )

    };

    const header = {
        leftTitle: lang({ id: 'activity' }),
    };
    return (
        <Layout header={header}>
            {!mbData?.passenger ? (
                <View style={styles.root}>
                    <Lock />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                    <FlashList
                        ref={listRef}
                        data={list}
                        refreshing={reload}
                        onRefresh={() => {
                            setReload(true);
                        }}
                        renderItem={renderItem}
                        numColumns={1}
                        keyExtractor={(item) => item?.idx}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingTop: 20,
                            paddingBottom: insets?.bottom + rootStyle.bottomTabs.height + 20,
                            flex: list?.length < 1 ? 1 : 'unset',
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}

                        ListEmptyComponent={
                            <Empty msg={lang({ id: 'no_activity' })} />
                        }
                    />
                </View>
            )}
        </Layout>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: rootStyle.side,
            paddingBottom: rootStyle.bottomTabs.height + insets.bottom,
            gap: 20
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 60,
            paddingHorizontal: rootStyle.side,
            backgroundColor: colors.white
        },
        sectionBar: {
            width: '100%',
            height: 8,
            backgroundColor: colors.sub_3
        },
        sticky: {
            position: 'absolute',
            bottom: 20,
            left: 0,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: rootStyle.side
        },
        stickyButton: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 1000,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        }
    })

    return { styles }
}
