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

function ListItem({ item, unLock = () => { }, layout=null, style }) {

    const { styles } = useStyle();

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            // 레이아웃 바뀔 때 애니메이션
            layout={layout}
        >
            <View style={[styles.listItem, style]} >
                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                    <Image source={item?.target?.profile ? (consts.s3Url + item?.target?.profile) : images.profile} style={styles.profile} />
                    <View style={{ gap: 4, alignItems: 'flex-start' }}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>{item?.target?.firstName} {item?.target?.lastName}</Text>
                        <LevelTag level={item?.target?.level || 1} />
                    </View>
                </View>
                <Button type={8} style={{ width: 'auto' }} onPress={() => unLock(item?.idx)}>{lang({ id: 'unblock' })}</Button>
            </View>
        </Animated.View>
    );
}

export default function Page({ }) {

    const pathname = usePathname();
    const { type, sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [deleteLoad, setDeleteLoad] = useState(false); // 목록삭제 로딩

    useEffect(() => {

        dataFunc(true);

    }, [type, sdate, edate]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            nextToken: reset ? null : nextToken,
            limit: 50
        }
        const { data, error } = await API.post('/v2/my/lockList', sender);

        setNextToken(data?.nextToken);

        const fetchData = data || [];
        // const fetchData = [];
        // const fetchData = dummy.getBoardDummys(100);

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setDeleteLoad(false);

        }, consts.apiDelay)
    }

    const unLock = async (idx) => {
        setDeleteLoad(true);
        listRef.current?.prepareForLayoutAnimationRender();

        let sender = {
            idx: idx,
        }
        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/unBlock', sender);
        
        if(error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        }

        dataFunc(true);
    }

    const renderItem = ({ item, index }) => {

        return (
            <ListItem item={item} unLock={unLock} layout={deleteLoad ? SequencedTransition : null} style={{ borderBottomWidth: index === list?.length - 1  ? 0 : 1 }}/>
        )
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'blocked_list' })
    };


    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <FlashList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    keyExtractor={(item) => item?.idx?.toString()}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom,
                        paddingHorizontal: rootStyle.side,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                    // stickyHeaderIndices={[0]}
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'no_history' })} />
                    }
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

        profile: {
            width: 50,
            height: 50,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },

        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBlockColor: colors.sub_1
        },
        listItemTitle: {
            fontFamily: fonts.medium,
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
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },

    })

    return { styles }
}
