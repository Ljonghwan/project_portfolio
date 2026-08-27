import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { TabView, TabBar } from 'react-native-tab-view';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import Board from '@/componentsPage/Board';

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


    const [index, setIndex] = useState(0);

    const renderScene = ({ route }) => {
        return <Board cate={route.idx} page={'my'} />
    };

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            // style={{ backgroundColor: colors.white,  marginHorizontal: 30, }}
            style={{ backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 }}
            indicatorStyle={{ backgroundColor: colors.primaryBright, }}
            tabStyle={{ height: 48, elevation: 0 }}
        />
    );

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '내 활동',
    };

    return (
        <Layout header={header} >
            <TabView
                style={{  }}
                navigationState={{ index, routes: [
                    { key: '1', idx: 1, name: '내가 쓴 글'},
                    { key: '2', idx: 2, name: '저장한 글'}
                ] }}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: width }}
                commonOptions={{
                    labelAllowFontScaling: false,
                    // labelStyle={styles.tabText}
                    label: ({ route, labelText, focused, color }) => (
                        <Text style={focused ? styles.tabTextActive : styles.tabText}>{labelText ?? route.name}</Text>
                    )
                }}
                renderScene={renderScene}
                lazy={true}
            />

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