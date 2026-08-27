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
import Layout from '@/components/Layout';

import PostTicket from '@/components/Item/PostTicket';
import CallTicket from '@/components/Item/CallTicket';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, useDebouncedTimeout } from '@/libs/utils';

import { useLang, useUser, useAlert, useEtc, useCarpool } from '@/libs/store';


export default function Page({ }) {

    const { back } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);

    const [cate, setCate] = useState('carpool');
    const [cateList, setCateList] = useState(['carpool', 'ride_share']);

    const [list, setList] = useState([]); // 
    const [list2, setList2] = useState([]); // 

    const [nextToken, setNextToken] = useState(null);

    const [boxHeight, setBoxHeight] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const viewables = useSharedValue([]);
    const setDebouncedTimeout = useDebouncedTimeout();

    // useFocusEffect(
    //     useCallback(() => {
    //         if(initLoad) getPositionFunc();
    //     }, [initLoad])
    // );
    useEffect(() => {
        dataFunc(true);
    }, []);

    useEffect(() => {
        setInitLoad(true);
        setDebouncedTimeout(() => {
            setInitLoad(false);
        }, 300); 
    }, [cate])

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v2/passenger/history/rideHistory');
        
        setList(data?.carpoolList || []);
        setList2(data?.callList || []);

        setTimeout(() => {
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        let myInfo = item?.joins?.find(x => x?.user?.idx === mbData?.idx);
        let parse = {
            ...item,
            start: item?.itinerary?.find(x => x?.idx === myInfo?.startIdx) || item?.itinerary?.[0],
            end: item?.itinerary?.find(x => x?.idx === myInfo?.endIdx) || item?.itinerary?.at(-1),
        };

        return (
            <PostTicket item={parse} style={{ marginHorizontal: rootStyle.side, marginBottom: 23 }} onPress={() => {
                router.push({
                    pathname: routes.historyPostView,
                    params: {
                        postIdx: item?.idx,
                    },
                })
            }} />
        )
    };

    const renderItemCall = ({ item, index }) => {

        return (
            <CallTicket item={item} style={{ marginHorizontal: rootStyle.side, marginBottom: 23 }} onPress={() => {
                router.push({
                    pathname: routes.historyCallView,
                    params: {
                        callIdx: item?.idx,
                    },
                })
            }} />
        )
    };

     const renderCate = ({ item, index }) => {
        
        return (
            <TouchableOpacity style={[styles.tag, { backgroundColor: item === cate ? colors.taseta : colors.taseta_sub_2 }]} onPress={() => setCate(item)}>
                <Text style={[styles.tagText, { color: item === cate ? colors.taseta_sub_2 : colors.taseta }]}>{lang({ id: item })}</Text>
            </TouchableOpacity>
        )
    };
    

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};
    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: lang({ id: 'history' }),
    };

    return (
        <Layout header={header}>
            <View style={{ flex: 1, gap: 10 }}>
                <View>
                    <FlatList
                        data={cateList}
                        renderItem={renderCate}
                        contentContainerStyle={{
                            gap: 9,
                            paddingHorizontal: rootStyle.side
                        }}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
                
                <View style={{ flex: 1 }} onLayout={onContentLayout}>
                    {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
                    
                    <FlashList
                        ref={listRef}
                        data={cate === 'carpool' ? list : list2}
                        refreshing={reload}
                        onRefresh={() => {
                            setReload(true);
                        }}
                        renderItem={cate === 'carpool' ? renderItem : renderItemCall}
                        numColumns={1}
                        keyExtractor={(item) => cate + item?.idx}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingTop: 20,
                            paddingBottom: insets?.bottom + 20,
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}

                        ListEmptyComponent={
                            <Empty style={{ height: boxHeight - (insets?.bottom + 40) }} msg={lang({ id: 'no_history' })} />
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
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 9,
            borderRadius: 1000,
            backgroundColor: colors.taseta_sub_2,
            borderWidth: 1,
            borderColor: colors.taseta
        },
        tagText: {
            fontFamily: fonts.medium,
            fontSize: 15.5,
            color: colors.taseta,
        },
    })

    return { styles }
}
