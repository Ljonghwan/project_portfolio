import React, { useRef, useState, useEffect } from 'react';
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

import { router, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { SequencedTransition, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import LevelTag from '@/components/LevelTag';

import Application from '@/components/Item/Application';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat } from '@/libs/utils';

import { useLang, useAlert } from '@/libs/store';

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();
    const { country } = useLang();

    const listRef = useRef(null);
    const [cate, setCate] = useState([]);

    const [cateList, setCateList] = useState([]);
    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset, idx) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/auth/driverApply');

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {
        return (
            <Application item={item} style={{ marginBottom: 20 }} onPress={() => {
                router.push({
                    pathname: routes.applicationView,
                    params: {
                        idx: item?.idx
                    }
                })
            }} />
        )
    };


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'my_driver_applications' }),
        longTitle: true
    };


    return (
        <Layout header={header}>
            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <View style={{ flex: 1 }}>
                    <FlashList
                        ref={listRef}
                        data={list}
                        renderItem={renderItem}
                        refreshing={reload}

                        onRefresh={() => {
                            setReload(true);
                        }}
                        numColumns={1}
                        keyExtractor={(item) => item?.idx?.toString()}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingTop: 20,
                            paddingBottom: insets?.bottom + 20,
                            paddingHorizontal: rootStyle.side,
                            flex: list?.length < 1 ? 1 : 'unset'
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}

                        // onEndReached={() => dataFunc()}
                        // onEndReachedThreshold={0.6}
                        // stickyHeaderIndices={[0]}
                        ListEmptyComponent={
                            <Empty msg={lang({ id: 'no_application' })} />
                        }
                    />
                </View>



            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        tag: {
            height: 25,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 9,
            borderRadius: 13,
            backgroundColor: colors.taseta_sub_2
        },
        tagText: {
            fontFamily: fonts.medium,
            fontSize: 15.5,
            color: colors.taseta,
        },

        listContainer: {
            flex: 1,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBlockColor: colors.sub_1
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemValue: {
            fontFamily: fonts.extraBold,
            fontSize: 20,
            color: colors.main,
            letterSpacing: -0.4
        },
        listItemDate: {
            fontSize: 16,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.32
        },

        bottom: {
            marginTop: 20,
            gap: 20
        },
        answer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
        },
        dataText: {
            color: colors.sub_1,
            fontFamily: fonts.medium,
            fontSize: 16,
            letterSpacing: -0.32,
        },
        hidden: {
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
        },

    })

    return { styles }
}
