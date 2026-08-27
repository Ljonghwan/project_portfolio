import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { useFonts } from 'expo-font';
import { FlashList } from "@shopify/flash-list";
import { throttle, debounce } from 'lodash';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Lock from '@/components/Lock';
import Empty from '@/components/Empty';

import RoomItem from '@/components/Item/RoomItem';

import routes from '@/libs/routes';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import API from '@/libs/api';
import SocketService from '@/libs/ws';

import { useUser, useAlert, useCall, useLoader, useEtc } from '@/libs/store';

import { ToastMessage, useSound, badgeReload, useDebounce } from '@/libs/utils';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { token, mbData, pushToken, login, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);
    const [stx, setStx] = useState("");

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [boxHeight, setBoxHeight] = useState(0);

    const viewables = useSharedValue([]);

    const stxDebounce = useDebounce(stx, 200);

    const throttledDataFunc = throttle((data) => {
        badgeReload();
        dataFunc(true);
    }, 1000);


    useFocusEffect(
        useCallback(() => {
            if (appActiveStatus === 'active') {
                throttledDataFunc();
                // dataFunc(true);
            }
        }, [appActiveStatus])
    );

    useEffect(() => {
        socketConnect();
        throttledDataFunc();

    }, [])

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const socketConnect = () => {

        const socket = SocketService.getInstance();
        socket.on('chat_event', async (data) => {
            console.log("socket msg 1", Platform.OS, data)
            // 배지카운트 갱신
            // {
            // 	"chatIdx": 12, 
            // 	"createAt": "2025-09-18T09:22:32.791Z", 
            // 	"data": null, 
            // 	"idx": 240, 
            // 	"message": "12321321", 
            // 	"receiveId": null, 
            // 	"senderIdx": 13, 
            // 	"type": "message", 
            // 	"updateAt": "2025-09-18T09:22:32.791Z"
            // }
            throttledDataFunc();
        });
    }

    const socketDisconnect = () => {
        const socket = SocketService.getInstance();

        socket.off('chat_event');
    }


    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/chat/chatList');

        // setList(data || []);
        setList(data || []);

        setTimeout(() => {

            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const leaveAlert = (idx) => {

        openAlertFunc({
            label: lang({ id: 'are_you_sure_4' }),
            title: lang({ id: 'leaving_chat_will' }),
            onCencleText: lang({ id: 'close' }),
            onPressText: lang({ id: 'exit' }),
            onPress: async () => {
                const sender = {
                    chatIdx: idx
                }
                console.log('sender', sender);
                const { data, error } = await API.post('/v2/chat/leave', sender);

                if (error) {
                    console.log('error', error);
                    ToastMessage(lang({ id: error?.message }), { type: 'error' });
                }

                dataFunc(true);
            }
        })
    }

    const filterFunc = (x, i) => {
        return x?.members?.find(xx => xx?.firstName?.toLowerCase()?.includes(stxDebounce?.toLowerCase()) || xx?.lastName?.toLowerCase()?.includes(stxDebounce?.toLowerCase()));
    }

    const renderItem = ({ item, index }) => {

        return (
            <RoomItem item={item} leaveAlert={() => leaveAlert(item?.idx)} />
        )

    };

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
    };

    const header = {
        leftTitle: lang({ id: 'chat' }),
        search: {
            icon: 'search',
            state: stx,
            setState: setStx,
            placeholder: lang({ id: 'search_for_a_name' })
        },
    };

    return (
        <Layout header={header}>

            {!mbData?.passenger ? (
                <View style={styles.root}>
                    <Lock />
                </View>
            ) : (
                <View style={{ flex: 1 }} onLayout={onContentLayout}>
                    {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                    <FlashList
                        ref={listRef}
                        data={list?.filter(filterFunc)}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item?.idx}
                        refreshing={reload}
                        estimatedItemSize={90}
                        maintainVisibleContentPosition={{
                            disabled: true
                        }}
                        onRefresh={() => {
                            setReload(true);
                        }}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingBottom: insets?.bottom + rootStyle.bottomTabs.height + 20,
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}

                        // onEndReached={() => dataFunc()}
                        // onEndReachedThreshold={0.6}

                        ListEmptyComponent={
                            <Empty style={{ height: boxHeight - rootStyle.header.height }} msg={lang({ id: 'no_room' })} />
                        }
                    />


                </View>
            )}

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
            paddingVertical: 14,
            borderBottomColor: colors.sub_1,
            borderBottomWidth: 1,
            gap: 20,
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemDate: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },
        termBox: {
            borderBottomColor: '#D4D6DD',
            borderBottomWidth: 0.5,
            padding: 20,
            backgroundColor: 'rgba(217, 217, 217, 0.3)',
            flex: 1
        },
        webview: {
        }
    })

    return { styles }
}
