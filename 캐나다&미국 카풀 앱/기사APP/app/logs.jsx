import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SequencedTransition, FadeIn, FadeInRight, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import dayjs from 'dayjs';
import { Stack, router, useFocusEffect } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Lock from '@/components/Lock';
import Empty from '@/components/Empty';

import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import API from '@/libs/api';

import { useUser, useAlert, useCall, useLoader, useEtc, useLog } from '@/libs/store';

import { ToastMessage, useSound, badgeReload, useDebounce } from '@/libs/utils';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';


function ListItem({ item, style, layout = null, deleteFunc = () => { } }) {

    const { styles } = useStyle();

    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            // 레이아웃 바뀔 때 애니메이션
            layout={layout}
            style={{ paddingHorizontal: rootStyle.side }}
        >
            <Pressable style={[styles.listItem, style]} >
               
                <View style={{ gap: 5, flex: 1 }}>
                    <Text numberOfLines={3} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.url}</Text>
                    <Text style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>{dayjs(item?.date).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </View>

            </Pressable>
        </Animated.View>
    );
}


export default function Page() {

    const { styles } = useStyle();

    const insets = useSafeAreaInsets();

    const { token, mbData, pushToken, login, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { api, setApi } = useLog();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);
    const [stx, setStx] = useState("");

    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [deleteLoad, setDeleteLoad] = useState(false); // 목록삭제 로딩

    const [boxHeight, setBoxHeight] = useState(0);


    useEffect(() => {
        // setApi('reset');
    }, [])

    const renderItem = ({ item, index }) => {

        return (
            <ListItem item={item} layout={deleteLoad ? SequencedTransition : null} />
        )

    };

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: lang({ id: 'logs' }),
    };

    return (
        <Layout header={header}>

            <View style={{ flex: 1 }} onLayout={onContentLayout}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <FlashList
                    ref={listRef}
                    data={api}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item?.idx}
                    refreshing={reload}
                    maintainVisibleContentPosition={{
                        disabled: true
                    }}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 20,
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}

                    ListEmptyComponent={
                        <Empty style={{ height: boxHeight - rootStyle.header.height }} msg={lang({ id: 'no_message' })} />
                    }
                />


            </View>

        </Layout>
    )
}

const useStyle = () => {

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
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.sub_1
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 1000,
            backgroundColor: colors.text_popup
        }
    })

    return { styles }
}
