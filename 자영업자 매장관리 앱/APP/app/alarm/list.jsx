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
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, badgeReload } from '@/libs/utils';

export default function Page({ }) {


    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    // useFocusEffect(
    //     useCallback(() => {
    //         dataFunc(true);
    //     }, [])
    // );

    useEffect(() => {
        dataFunc(true);
    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/alarm/list');

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {
        if (item?.status === 1) deleteFunc(item?.idx);

        if (!item?.data?.route || !routes?.[item?.data?.route]) return;

        let ob = {
            pathname: routes?.[item?.data?.route],
        };

        if (item?.data?.idx) ob.params = { idx: item?.data?.idx };

        try {
            router.push(ob);
        } catch (error) {
            console.log('error', error)
        }

    }


    const deleteAlert = () => {
        // setList(list?.map(x => ({ ...x, read: true })));
        deleteFunc('all');
    }

    const deleteFunc = async (idx) => {

        if (list?.filter(x => x?.status === 1)?.length < 1) return;

        if (idx === 'all') openLoader(); 

        const sender = {
            idx: idx
        }

        const { data, error } = await API.post('/v1/alarm/read', sender);

        setTimeout(() => {

            closeLoader();
            dataFunc(true);
            badgeReload();

        }, idx !== 'all' ? 0 : consts.apiDelay)

    }

    const renderItem = ({ item, index }) => {

        return (
            <Animated.View
                entering={FadeInRight}
            >
                <TouchableOpacity style={[styles.listItem, { backgroundColor: item?.status === 1 ? colors.fff5e6 : colors.white }]} activeOpacity={0.7} onPress={() => { goLink(item) }}>
                    <View style={[rootStyle.flex, { gap: 8, alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 14 }]}>
                        <Image source={images.alarm_icon} style={rootStyle.default32} />
                        <View style={{ gap: 6, flex: 1 }}>
                            <Text style={styles.listItemTitle} numberOfLines={2}>{item?.title}</Text>
                            <Text style={styles.listItemSubTitle} numberOfLines={2}>{item?.comment}</Text>
                        </View>

                        <Text style={styles.listItemDate}>{getFullDateFormat(item?.createdAt)}</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const header = {
        title: '알림',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '모두 읽음',
            textStyle: styles.headerText,
            textIcon: images.check_on,
            textIconStyle: rootStyle.default18,
            onPress: deleteAlert
        }
    };


    return (
        <Layout header={header} >

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

                <FlashList
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    removeClippedSubviews
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 10,
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}

                    ListEmptyComponent={
                        <Empty msg={'알림이 없습니다.'} />
                    }
                />


            </View>

        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            color: colors.primary,
            fontSize: 12,
            fontFamily: fonts.medium
        },
        button: {
            paddingHorizontal: 12,
            height: 36,
            backgroundColor: colors.greyE,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            alignSelf: 'flex-end'
        },
        buttonText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            fontFamily: fonts.semiBold
        },
        listItem: {
            marginHorizontal: 12,
            paddingLeft: 18.5,
            paddingRight: 15.5,
            gap: 16,
            backgroundColor: colors.fff5e6,
            borderRadius: 8,
            marginBottom: 4
        },
        listItemDate: {
            fontSize: 11,
            lineHeight: 15.4,
            color: colors.text757575,
            letterSpacing: -0.275
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            color: colors.text2B2B2B,
            flex: 1,
            letterSpacing: -0.35
        },
        listItemSubTitle: {
            fontSize: 13,
            lineHeight: 19,
            color: colors.text757575,
            flex: 1,
            letterSpacing: -0.325
        },


    })

    return { styles }
}
