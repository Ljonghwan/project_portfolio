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

import { router } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, SequencedTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Manager from '@/components/badges/Manager';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

function ListItem({ item, index, unLock=()=>{}, layout = null }) {

    const { styles } = useStyle();

    return (
        <View >
            <View style={styles.listItem}>
                <View style={[rootStyle.flex, { gap: 20, justifyContent: 'space-between' }]}>
                    <View style={[rootStyle.flex, { flex: 1,gap: 16 }]}>
                        <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.profile} />
                        <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 5 }]}>
                            <Text style={styles.listItemTitle} numberOfLines={1}>{item?.nickName}</Text>
                            {item?.type === 'manager' && (
                                <View style={ styles.listItemManagerBox }>
                                    <Text style={styles.listItemManager}>매니저</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity hitSlop={10} activeOpacity={0.7} onPress={() => unLock(item?.idx)}>
                        <Image source={images.unblock} style={rootStyle.default64} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

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
    const [deleteLoad, setDeleteLoad] = useState(false); // 목록삭제 로딩

    const viewables = useSharedValue([]);

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

        const { data, error } = await API.post('/v1/block/list');
        console.log('data', data)
        setList(data || []);

        setTimeout(() => {

            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setDeleteLoad(false);

        }, consts.apiDelay)
    }


    const unLock = async (idx) => {
        setDeleteLoad(true);

        let sender = {
            idx: idx,
        }
        console.log('sender', sender);

        const { data, error } = await API.post('/v1/block/delete', sender);

        if (error) {
            ToastMessage(error?.message);
        }

        dataFunc(true);
    }

    const renderItem = ({ item, index }) => {

        return (
            <ListItem item={item} unLock={unLock} />
        )

    };


    const header = {
        title: '차단 목록',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_block'
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

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: '#FFF' }} fixed />)}

                <FlatList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}

                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom + 20,
                        paddingHorizontal: rootStyle.side + 5,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    ListEmptyComponent={
                        <Empty msg={'차단한 유저가 없습니다.'} />
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />


            </View>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        listItem: {
            paddingVertical: 10,
            borderBottomColor: colors.grey6,
            borderBottomWidth: 0.3,
            gap: 20,
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: width <= 320 ? 13 : 16,
            lineHeight: 20,
            color: colors.dark,
            flexShrink: 1,
        },

        listItemManagerBox: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 100,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        listItemManager: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.primary,
        },
      
        profile: {
            width: 48,
            height: 48,
            borderRadius: 100
        }
    })

    return { styles }
}
