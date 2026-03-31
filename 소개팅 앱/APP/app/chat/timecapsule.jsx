import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Platform,
    Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeInRight, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

// component
import Loading from '@/components/Loading';
import InputFlirting from '@/components/InputFlirting';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import FreeView from '@/componentsPage/timecapsule/FreeView';
import First from '@/componentsPage/timecapsule/First';
import Meter from '@/componentsPage/timecapsule/Meter';
import End from '@/componentsPage/timecapsule/End';
import Flirting from '@/componentsPage/timecapsule/Flirting';

import Body from '@/componentsPage/timecapsule/Body';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';

const routesTab = [
    { key: 'free', title: '프리뷰챗' },
    { key: 'first', title: '첫인상' },
    { key: 'meter', title: '러브미터' },
    { key: 'end', title: '결정의날' },
    { key: 'flirting', title: '플러팅' },
];


export default function Page({ item }) {

    const {
        roomIdx,
        active = 0
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const iref = useRef(null);


    const [index, setIndex] = useState(active * 1);

    const [room, setRoom] = useState(null);
    const [dots, setDots] = useState({});

    const [input, setInput] = useState("");
    const [comment, setComment] = useState("");
    const [commentDesc, setCommentDesc] = useState("");

    const [toggle, setToggle] = useState(false);


    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState(null);


    useEffect(() => {
        roomInfo();
        tabNewFunc();
    }, [roomIdx])

    useEffect(() => {

        setError("");


    }, [input])

    useEffect(() => {

        setDisabled(!(input && (comment || (!comment && commentDesc))));

    }, [input, comment, commentDesc, error])

    const roomInfo = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/roomInfo', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setRoom(data);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay);
    }

    const tabNewFunc = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/tabNew', sender);

        setDots(data || {});
        console.log('roominfo', data);

    }


    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'free':
                return <FreeView roomIdx={room?.idx} prevRoomIdx={room?.prevRoomIdx} tabNewFunc={tabNewFunc}/>;
            case 'first':
                return <First roomIdx={room?.idx} tabNewFunc={tabNewFunc}/>;
            case 'meter':
                return <Meter roomIdx={room?.idx} tabNewFunc={tabNewFunc}/>;
            case 'end':
                return <End roomIdx={room?.idx} room={room} tabNewFunc={tabNewFunc}/>;
            case 'flirting':
                return <Flirting roomIdx={room?.idx} tabNewFunc={tabNewFunc}/>;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            style={{ backgroundColor: colors.white }}
            indicatorStyle={{ backgroundColor: colors.main }}
            tabStyle={{ height: 50 }}
        />
    );

    const header = {
        title: '타임캡슐',
        titleIcon: {
            icon: 'time_black'
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            {/* {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />} */}

            <TabView
                renderTabBar={renderTabBar}
                navigationState={{ index, routes: routesTab }}
                onIndexChange={setIndex}
                initialLayout={{ width: width }}
                renderScene={renderScene}
                lazy={true}
                renderLazyPlaceholder={() => {
                    return <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />
                }}
                commonOptions={{
                    labelAllowFontScaling: false,
                    // labelStyle={styles.tabText}
                    label: ({ route, labelText, focused, color }) => (
                        <Text style={focused ? styles.tabTextActive : styles.tabText}>{labelText ?? route.name}</Text>
                    ),
                    badge: ({ route }) => {
                        <View style={styles.dot}>
                            <Text>{route}</Text>
                        </View>
                    }
                }}
                options={{
                    free: {
                        badge: ({ route }) => (
                            dots?.freeChat ? <View style={styles.dot} /> : <></>
                        )
                    },
                    first: {
                        badge: ({ route }) => (
                            dots?.firstComment ? <View style={styles.dot} /> : <></>
                        )
                    },
                    meter: {
                        badge: ({ route }) => (
                            dots?.love ? <View style={styles.dot} /> : <></>
                        )
                    },
                    end: {
                        badge: ({ route }) => (
                            dots?.finishDay ? <View style={styles.dot} /> : <></>
                        )
                    }
                }}
            />

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        tabText: {
            color: colors.grey9,
            fontSize: width <= 340 ? 12 : 14,
            letterSpacing: -0.35,
            overflow: 'hidden',
            flexShrink: 1,
        },
        tabTextActive: {
            color: colors.dark,
            fontSize: width <= 340 ? 12 : 14,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35,
            overflow: 'hidden',
            flexShrink: 1,
        },
        dot: {
            top: 8,
            right: 0,

            borderRadius: 1000,
            width: 5,
            height: 5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary
        }
    })

    return { styles }
}
