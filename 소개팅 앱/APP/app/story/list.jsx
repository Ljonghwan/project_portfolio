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
    ActivityIndicator,
    Pressable
} from 'react-native';

import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import dayjs from "dayjs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Order from '@/components/Order';

import Story from '@/components/list/Story';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const viewables = useSharedValue([]);

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset = false) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            nextToken: reset ? null : nextToken
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v1/story/list', sender);

        setNextToken(data?.nextToken || null);

        const fetchData = data?.list || [];

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });

        if (reset && !reload) {
            viewables.value = [];
            listRef?.current?.recomputeViewableItems();
            listRef?.current?.scrollToOffset({ offset: 0, animated: true })
        }

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {
        return (
            <Story item={item} index={index} viewables={viewables} />
        );
    };

    const onViewableItemsChanged = ({ viewableItems }) => {
        console.log('viewableItems.map((item) => item?.item?.idx)', viewableItems.map((item) => item?.item.idx)?.join(","))
        viewables.value = viewableItems.map((item) => item.item.idx);
    };

 
    const header = {
        title: '실시간 만남 스토리',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >

            <View style={{ flex: 1 }}>

                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                {list?.length < 1 && (
                    <Empty msg={'만남 스토리가 없습니다.'} fixed />
                )}

                <FlashList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={2}
                    refreshing={reload}
                    keyExtractor={(item, index) => item.idx}

                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: insets?.bottom + 20,
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    decelerationRate={'normal'}

                    onEndReached={() => dataFunc()}
                    onEndReachedThreshold={0.6}

                    // ListEmptyComponent={
                    //     <Empty msg={'피드 스퀘어가 없습니다.'} style={{ height: height }} fixed/>
                    // }
                    // ListFooterComponent={
                    //     () => {
                    //         if (initLoad || !load || reload) return null;
                    //         return (
                    //             <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                    //                 <ActivityIndicator size="small" color={colors.black} />
                    //             </View>
                    //         )
                    //     }
                    // }

                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{
                        viewAreaCoveragePercentThreshold: 5,
                        minimumViewTime: 20
                    }}
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
        listItem: {
            padding: 20,
            borderBottomColor: colors.greyE,
            borderBottomWidth: 1,
            gap: 20
        },
        listItemDate: {
            fontSize: 12,
            lineHeight: 20,
            color: colors.grey6
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 20,
            color: colors.dark,
        },
        listItemDate: {
            fontSize: 14,
            fontFamily: fonts.pretendardRegular,
            color: '#999',
        },



        filterBar: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 10
        },
        filterItem: {
            flex: 1,
            borderRadius: 100,
            gap: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.main,
            height: 36
        },
        filterImage: {
            width: 17,
            height: 16
        },
        filterText: {
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35



        },

    })

    return { styles }
}
