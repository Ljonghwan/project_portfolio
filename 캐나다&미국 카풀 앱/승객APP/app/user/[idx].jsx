import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

import Report from '@/components/Popup/Report';

import UserInfo from '@/componentsPage/UserInfo';
import CarInfo from '@/componentsPage/CarInfo';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert } from '@/libs/store';

import { ToastMessage, regPhone } from '@/libs/utils';

const routesTab = [
    { key: 'profile', title: lang({ id: 'profile' }) },
    { key: 'vehicle', title: lang({ id: 'vehicle_details' }) }
];
export default function Page() {

    const { idx, back, startIndex, endIndex } = useLocalSearchParams();
    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();

    const [index, setIndex] = useState(0);

    const [item, setItem] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const renderScene = ({ route, jumpTo }) => {
        switch (route.key) {
            case 'profile':
                return <UserInfo item={item} reload={reload} setReload={setReload} jumpTo={jumpTo} dataFunc={dataFunc} />;
            case 'vehicle':
                return <CarInfo item={item?.driverInfo} reload={reload} setReload={setReload} jumpTo={jumpTo} dataFunc={dataFunc}/>;
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

    useEffect(() => {
        dataFunc(true);
    }, [idx]);

    useEffect(() => {
        if (reload || back) dataFunc(true);
    }, [reload, back]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        let sender = {
            userIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/info/userInfo', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        // setItem(data);
       
        setItem(data);

        setTimeout(() => {

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
                label: lang({ id: item?.activeType === 'driver' ? 'block_this_driver' : 'block_this_passenger' }),
                title: item?.activeType === 'driver' && lang({ id: 'blocked_drivers_wont' }),
                onPressText: lang({ id: 'block' }),
                onCencleText: lang({ id: 'no' }),
                onPress: blockFunc
            })
        }
    }

    const blockFunc = async () => {
        let sender = {
            idx: idx
        }

        const { data, error } = await API.post('/v2/my/lock', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        router.back();
        ToastMessage(lang({ id: 'this_user_has_been_blocked' }))

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        
    };

    return (
        <Layout header={{
            ...header,
            title: item && (item?.activeType === 'driver' ? lang({ id: 'driver_info' }) : lang({ id: 'passenger_info' })),
            filter: item?.idx !== mbData?.idx && {
                list: [
                    { idx: 2, title: lang({ id: 'block' }) },
                ],
                onPress: filterPress
            }
        }}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
                {item?.activeType === 'driver' ? (
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
                    />
                ) : (
                    <UserInfo item={item} reload={reload} setReload={setReload} dataFunc={dataFunc} />
                )}

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