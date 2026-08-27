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
import Post from '@/components/Item/Post';
import Layout from '@/components/Layout';


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

import { useLang, useAlert, useEtc, useCarpool } from '@/libs/store';

export default function Page({ }) {

    const { back } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { start, end, way, date, type } = useCarpool();
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
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/passenger/post/favList');

        setList(data || []);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        return (
            <Post item={item} style={{ marginHorizontal: rootStyle.side, marginBottom: 23 }} />
        )

    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'saved_posts' })
    };


    return (
        <Layout header={header}>
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
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}

                    ListHeaderComponent={
                        <View style={{ marginBottom: 23 }}>
                            <View style={{ paddingHorizontal: rootStyle.side }}>
                                <Text style={{ ...rootStyle.font(20, colors.main, fonts.medium) }}>
                                    <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{list?.length}</Text> {lang({ id: 'list' })}
                                </Text>
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'no_saved' })} />
                    }
                    // ListFooterComponent={
                    //     () => {
                    //         if(initLoad || !load || reload) return null;
                    //         return (
                    //             <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                    //                 <ActivityIndicator size="small" color={colors.black} />
                    //             </View>
                    //         )
                    //     }
                    // }

                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />

            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

    })

    return { styles }
}
