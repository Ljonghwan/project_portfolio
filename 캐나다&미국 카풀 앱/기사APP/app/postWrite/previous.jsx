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

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import dayjs from 'dayjs';


import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Empty from '@/components/Empty';
import Loading from '@/components/Loading';

import Post from '@/components/Item/PostPrevious';


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

import { useLang, useAlert, useEtc, usePost } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();
    const { postStart, setPostData } = usePost();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [selected, setSelected] = useState(null);

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

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            isAll: true
        }

        const { data, error } = await API.post('/v2/driver/post/list', sender);

        console.log('data', data);

        // setList(data || []);
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
            <Post 
                item={item} 
                style={{ 
                    marginHorizontal: rootStyle.side, 
                    marginBottom: 23,
                    borderColor: colors.main,
                    borderWidth: selected?.idx === item?.idx ? 1 : 0
                }} 
                onPress={() => {
                    // listRef?.current?.scrollToIndex({ index: index, animated: true, viewOffset: -100 });
                    // setSelected(item);
                    
                    let start = item?.itinerary?.[0];

                    postStart({
                        start: start,
                        end: item?.itinerary?.at(-1),
                        way: item?.itinerary?.slice(1, -1),
                        type: item?.rideType,
                        date: dayjs(`${start?.driveDate} ${start?.driveTime}`).startOf('day'),
                        time: dayjs(`${start?.driveDate} ${start?.driveTime}`),
                        seats: item?.seats,
                        desc: item?.desc,
                        pay: null,
                    })

                    router.push(routes.postWriteForm);
                    
                    // openAlertFunc({
                    //     label: lang({ id: 'load_this_post' }),
                    //     onCencleText: lang({ id: 'no' }),
                    //     onPressText: lang({ id: 'yes' }),
                    //     onPress: () => { 
                           
                    //     }
                    // })
                }}
            />
        )

    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'previous_post' })
    };

    return (

        <Layout header={header}>
            <View style={styles.root}>
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
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'no_posts' })} />
                    }

                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />

            </View>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        checkAll: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.sub_1,
            gap: 12
        },
        checkAllText: {
            fontSize: 20,
            fontFamily: fonts.extraBold,
            color: colors.main
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end'
        }
    })

    return { styles }
}