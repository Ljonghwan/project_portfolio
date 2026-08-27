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
    useWindowDimensions,
    Pressable,
    Linking,
    ActivityIndicator
} from 'react-native';

import { router, usePathname, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { SequencedTransition, FadeIn, FadeInRight, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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

import { ToastMessage, hpHypen } from '@/libs/utils';

import { useLang, useUser, useAlert } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

function ListItem({ item, style, layout = null, mode, deleteFunc }) {

    const { call } = useLocalSearchParams();

    const { mbData } = useUser();
    const { styles } = useStyle();

    const onPress = async () => {
        if (call) {
            let url = `tel:+1${item?.hp}`;
            try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                }
            } catch (error) {
                console.log('error', error);
                ToastMessage(lang({ id: 'your_request_failed' }), { type: 'error' });
            }
        } else {
            router.push({
                pathname: routes.emergencyView,
                params: {
                    idx: item?.idx,
                    item: JSON.stringify(item)
                }
            })
        }
    };

    return (
        <AnimatedTouchable
            entering={FadeIn}
            exiting={FadeOut}
            // 레이아웃 바뀔 때 애니메이션
            layout={layout}
            onPress={onPress}
            style={[{ borderBottomColor: colors.sub_1 }, style]}
        >
            <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 14 }]} >

                <View style={[{ flex: 1, gap: 5 }]}>
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{item?.name}</Text>
                    <Text numberOfLines={2} style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>{item?.memo}</Text>
                    <Text style={{ ...rootStyle.font(18, colors.main, fonts.semiBold) }}>{hpHypen(mbData?.country, item?.hp)}</Text>
                </View>

                {mode ? (
                    <Animated.View key={`1_${item?.idx}`} entering={FadeInRight}>
                        <Button type={8} style={{ width: 'auto' }} onPress={() => deleteFunc(item?.idx)}>{lang({ id: 'delete' })}</Button>
                    </Animated.View>
                ) : (
                    <Animated.View key={`2_${item?.idx}`} entering={FadeInRight}>
                        <Image source={images.link} style={rootStyle.default} />
                    </Animated.View>
                )}
            </View>
        </AnimatedTouchable>
    );
}

export default function Page({ }) {

    const { call } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [mode, setMode] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [deleteLoad, setDeleteLoad] = useState(false); // 목록삭제 로딩


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

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/my/contactList');

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setDeleteLoad(false);

        }, consts.apiDelay)
    }

    const deleteFunc = async (idx) => {

        setDeleteLoad(true);
        listRef.current?.prepareForLayoutAnimationRender();

        let sender = {
            idx: idx,
        }
        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/contactDelete', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
        }

        dataFunc(true);
    }


    const renderItem = ({ item, index }) => {

        return (
            <ListItem item={item} style={{ borderBottomWidth: 1 }} layout={deleteLoad ? SequencedTransition : null}  deleteFunc={deleteFunc} mode={mode} />
        )
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'emergency_contact' }),
        right: {
            text: lang({ id: mode ? 'cancel' : 'edit' }),
            onPress: () => setMode(prev => !prev)
        }
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
                        <Empty msg={lang({ id: 'no_search' })} />
                    }
                />


            </View>

            <View style={styles.sticky}>
                <TouchableOpacity style={[styles.stickyButton, { backgroundColor: colors.main }]} activeOpacity={0.7} onPress={() => {
                    router.push({
                        pathname: routes.emergencyView,
                        params: {
                            idx: 0
                        }
                    })
                }}>
                    <Image source={images.add_post} style={rootStyle.addPost} />
                </TouchableOpacity>
            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        sticky: {
            position: 'absolute',
            bottom: insets.bottom + 20,
            left: 0,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingHorizontal: rootStyle.side,
            zIndex: 10
        },
        stickyButton: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 1000,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        }
    })

    return { styles }
}
