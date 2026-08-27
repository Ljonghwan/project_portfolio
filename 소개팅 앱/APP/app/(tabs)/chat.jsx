import { useState, useEffect, useCallback, useRef } from 'react';
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
    Image as RNImage
} from 'react-native';

import { Stack, router, useFocusEffect } from "expo-router";
import { useFonts } from 'expo-font';
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import messaging from '@react-native-firebase/messaging';
import { throttle } from 'lodash';
import { FlashList } from '@shopify/flash-list';

import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Filter from '@/components/Filter';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Empty from '@/components/Empty';
import Loading from '@/components/Loading';
import InputSearch from '@/components/InputSearch';

import ChatRoom from '@/components/list/ChatRoom';

import SeasonIcon from '@/components/chatTheme/SeasonIcon';


import routes from '@/libs/routes';
import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

import { ToastMessage, badgeReload } from '@/libs/utils';

import API from '@/libs/api';

import { useUser, useAlert, useEtc } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const bottomTabHeight = useBottomTabBarHeight();
    const { width, height } = useWindowDimensions();

    const { token, mbData, login, logout, roomIdx } = useUser();
    const { openAlertFunc, avoidKeyboardLock } = useAlert();
    const { goTop, appActiveStatus } = useEtc();

    const listRef = useRef(null);
    const inputRef = useRef(null);

    const [filter, setFilter] = useState(null); // 
    const [stx, setStx] = useState('');

    const [list, setList] = useState([]); // 
    const [viewList, setViewList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [remove, setRemove] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [position, setPosition] = useState({});

    const [isFocus, setIsFocus] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setIsFocus(true);
            dataFunc(true);

            const throttledDataFunc = throttle(() => {
                dataFunc(true);
            }, 500);
    
            const unsubscribe = messaging().onMessage(async remoteMessage => {
                throttledDataFunc();
            });

            // badgeReload();
            return () => {
                unsubscribe();
                setRemove(false);
                setIsFocus(false);
            }
        }, [appActiveStatus])
    );

    // useFocusEffect(
    //     useCallback(() => {
    //         dataFunc(true);
    //     }, [appActiveStatus])
    // );

    // useEffect(() => {

    //     const throttledDataFunc = throttle(() => {
    //         dataFunc(true);
    //     }, 500);

    //     const unsubscribe = messaging().onMessage(async remoteMessage => {
    //         throttledDataFunc();
    //     });

    //     throttledDataFunc();

    //     return () => {
    //         unsubscribe();
    //     }

    // }, [filter]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
            badgeReload();
        }

    }, [reload]);

    useEffect(() => {
        if (goTop) listRef?.current?.scrollToOffset({ offset: 0, animated: true })
    }, [goTop])

    useEffect(() => {
        setViewList(list?.filter(item => (!filter || filter?.includes(item?.type) ) && item?.user?.name?.includes(stx)));
    }, [list, filter, stx]);

    const dataFunc = async (reset) => {

        if (load) return;
        // if(!reset && !nextToken) return;

        setLoad(true);

        // const sender = {
        //     type: filter
        // }

        const { data, error } = await API.post('/v1/chat/roomList');

        const fetchData = data?.list || [];

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });
        
        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)

    }


    const renderItem = ({ item, index }) => {

        return (
            <ChatRoom item={item} isCancel={[8,9]?.includes(item?.status)} remove={remove} dataFunc={() => {
                dataFunc(true);
                badgeReload();
            }}/>
        );
    };

    const onLayout = useCallback((event) => {

        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                setPosition({ top: pageY + height, right: 20 })
            },
        );

    }, []);

    const header = {
        left: {
            icon: 'logo2',
            iconStyle: {
                width: 48,
                height: 48
            },
            onPress: () => {
                // listRef?.current?.scrollTo(0)
                router.back()
            }
        },
        right: {
            bell: true
        }
    };

    return (
        <Layout header={header}>
            <View style={{ flex: 1 }} >
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <View style={styles.titleBox} collapsable={false} onLayout={onLayout}>
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <Image source={images.menu_1_on} style={[rootStyle.default32]} />
                            <Text style={{...rootStyle.font(18, colors.primary, fonts.medium)}}>메시지</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setRemove(!remove) }} hitSlop={10}>
                            <Image source={remove ? images.chat_remove_on : images.chat_remove_off} style={rootStyle.default28} transition={100}/>
                        </TouchableOpacity>
                    </View>

                    <View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 20 }]}>
                        <View style={[rootStyle.flex, { gap: 6 }]}>
                            {consts.chatOptions?.map((x, i) => {
                                return (
                                    <TouchableOpacity key={i} style={[styles.filter, filter === x?.value && { backgroundColor: colors.grey37, borderColor: colors.grey37 }]} activeOpacity={0.7} onPress={() => { setFilter(x?.value) }}>
                                        <Image source={filter === x?.value ? images.filter_check : images?.[`chat_filter_${i + 1}`]} style={rootStyle.default14} transition={200}/>
                                        <Text style={[styles.filterText, filter === x?.value && { color: colors.white }]}>{x?.title}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                        <TouchableOpacity style={styles.searchInput} onPress={() => {
                            inputRef.current?.focus();
                        }}>
                            <Text style={{...rootStyle.font(12, colors.grey6, fonts.regular), flex: 1 }}>{stx || (width <= 320 ? '이름 검색' : '이름을 입력해주세요.')}</Text>
                            <Image source={images.search} style={rootStyle.default14} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* <SeasonIcon /> */}

                {/* <Image source={images.chat_ticket} style={[rootStyle.default]} tintColor={colors.primary}/> */}

                <FlashList
                    ref={listRef}
                    data={viewList}
                    renderItem={renderItem}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    
                    contentContainerStyle={{
                        paddingBottom: bottomTabHeight + insets?.bottom + 20,
                        flex: viewList?.length < 1 ? 1 : 'unset'
                    }}
                   
                    // keyboardDismissMode={'on-drag'}
                    // keyboardShouldPersistTaps={"handled"}
                    // nestedScrollEnabled={true}
                    // decelerationRate={'normal'}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}

                    ListEmptyComponent={
                        <Empty msg={'채팅방이 없습니다.'} />
                    }
                />


                <InputSearch 
                    iref={inputRef}
                    placeholder={'이름을 입력해주세요.'} 
                    state={stx}
                    setState={setStx}
                    avoidKeyboardLock={avoidKeyboardLock || !isFocus}
                />
            </View>
        </Layout>
    )
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        titleBox: {
            paddingHorizontal: rootStyle.side,
            paddingVertical: 10,
            gap: 13,
            borderBottomWidth: 1,
            borderBottomColor: colors.greyD9,
        },
        searchInput: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: 10,
            height: 30,
            borderWidth: 0.5,
            borderColor: colors.grey6,
            flex: 1,
        },
        filter: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: 10,
            height: 30,
            borderWidth: 0.5,
            borderColor: colors.grey6,
        },
        filterText: {
            fontFamily: fonts.semiBold,
            fontSize: 12,
            color: colors.grey6,
            letterSpacing: -0.3,
        },
    })

    return { styles }
}
