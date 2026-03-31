import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import Tab from '@/components/Ui/Tab';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { store } = useStore();

    const { configOptions } = useConfig();

    const [list, setList] = useState([]); // 
    const [viewList, setVeiwList] = useState([]); // 

    const [active, setActive] = useState(''); // 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

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

    useEffect(() => {
        setVeiwList(active ? list?.filter(x => x?.status === active) : list);
    }, [list, active])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const sender = {
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/my/feedback', sender);

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '피드백 센터',
    };

    return (
        <Layout header={header} >
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <Tab
                type={1}
                style={styles.tabContainer}
                tabs={[
                    { key: '', title: `전체문의 ${list?.length}` },
                    { key: 2, title: `답변완료 ${list?.filter(x => x?.status === 2)?.length}` },
                    { key: 1, title: `답변대기 ${list?.filter(x => x?.status === 1)?.length}` },
                ]}
                active={active}
                setActive={setActive}
            />

            {viewList?.length < 1 ? (
                <Empty style={{ flex: 1 }} />
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 100, paddingHorizontal: 35 }}
                    refreshControl={
                        <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                    }
                >
                    {viewList?.map((x, i) => {
                        return (
                            <Feedback key={x?.idx} item={x} />
                        )
                    })}
                </ScrollView>
            )}


            <Button bottom style={{ position: 'absolute', bottom: 0 }} onPress={() => {
                router.push({
                    pathname: routes.myFeedbackForm,
                })
            }} >문의하기</Button>

        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        tabText: {
            color: colors.text6C7072,
            fontSize: 14,
            overflow: 'hidden',
            flexShrink: 1,
        },
        tabTextActive: {
            color: colors.primaryBright,
            fontSize: 14,
            overflow: 'hidden',
            flexShrink: 1,
        },

    })

    return { styles }
}