import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

import Report from '@/components/Popup/Report';

import PostCarpool from '@/componentsPage/PostCarpool';
import PostStatus from '@/componentsPage/PostStatus';
import PostChat from '@/componentsPage/PostChat';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useLang, useAlert, useLoader } from '@/libs/store';

import { ToastMessage, regPhone } from '@/libs/utils';

const routesTab = [
    { key: 'carpool', title: lang({ id: 'carpool' }) },
    { key: 'status', title: lang({ id: 'offers' }) },
    // { key: 'chat', title: lang({ id: 'chat' }) },
];
export default function Page() {

    const { idx, back, startIndex, endIndex } = useLocalSearchParams();
    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { country } = useLang();

    const [index, setIndex] = useState(0);

    const [item, setItem] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    const renderScene = ({ route, jumpTo }) => {
        switch (route.key) {
            case 'carpool':
                return <PostCarpool item={item} reload={reload} setReload={setReload} jumpTo={jumpTo} dataFunc={dataFunc}/>;
            case 'status':
                return <PostStatus item={item} reload={reload} setReload={setReload} jumpTo={jumpTo} dataFunc={dataFunc}/>;
            // case 'chat':
            //     return <PostChat item={item} jumpTo={jumpTo}/>;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            // style={{ backgroundColor: colors.white,  marginHorizontal: 30, }}
            style={{ backgroundColor: colors.white }}
            indicatorStyle={{ backgroundColor: colors.taseta }}
            tabStyle={{ height: 45, }}

        />
    );

    useFocusEffect(
        useCallback(() => {
            if(idx) dataFunc(true);
        }, [idx])
    );

    // useEffect(() => {
    //     dataFunc(true);
    // }, [idx]);

    useEffect(() => {
        if (reload || back) dataFunc(true);
    }, [reload, back]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        let sender = {
            postIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/passenger/post/detail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            // setList([]);
            router.setParams({ 
                idx: idx,
                back: '',
                startIndex: startIndex,
                endIndex: endIndex
            });

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const filterPress = (type) => {
        console.log('type', type);
        if (type === 1) {
            openAlertFunc({
                input: 200,
                component: <Report idx={idx} />
            })
        } else if (type === 2) {
            openAlertFunc({
                label: lang({ id: 'block_this_driver' }),
                title: lang({ id: 'blocked_drivers_wont' }),
                onPressText: lang({ id: 'block' }),
                onCencleText: lang({ id: 'no' }),
                onPress: blockFunc
            })
        }
    }

    const blockFunc = async () => {
        console.log('Block This Driver !!');

        let sender = {
            idx: item?.creator?.idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/lock', sender);
        console.log({ data, error });

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        router.back();
        ToastMessage(lang({ id: 'this_driver_has_been_blocked' }))

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'post_info' }),
        filter: {
            list: [
                { idx: 1, title: lang({ id: 'report' }) },
                { idx: 2, title: lang({ id: 'block' }) },
            ],
            onPress: filterPress
        }
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
                <TabView
                    renderTabBar={renderTabBar}
                    navigationState={{ index, routes: routesTab }}
                    onIndexChange={setIndex}
                    initialLayout={{ width: width }}
                    renderScene={renderScene}
                    lazy={false}
                    commonOptions={{
                        labelAllowFontScaling: false,
                        // labelStyle={styles.tabText}
                        label: ({ route, labelText, focused, color }) => (
                            <Text style={focused ? styles.tabTextActive : styles.tabText}>{labelText ?? route.name}</Text>
                        )
                    }}
                    options={{
                        chat: {
                            badge: ({ route }) => (
                                <View style={styles.count}>
                                    {/* <Text style={{ ...rootStyle.font(16, colors.white) }}>1222</Text> */}
                                </View>
                            )
                        }
                    }}
                />

            </View>

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            // borderTopColor: colors.sub_1,
            // borderTopWidth: 1,
            // paddingHorizontal: rootStyle.side
        },
        tabText: {
            color: colors.sub_1,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,

        },
        tabTextActive: {
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,
        },
        count: {
            top: 8,
            right: '200%',
            
            borderRadius: 1000,
            width: 8,
            height: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.text_popup
        }
    })

    return { styles }
}