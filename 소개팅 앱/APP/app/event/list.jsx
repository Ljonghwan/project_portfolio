import React, {useRef, useState, useEffect} from 'react';
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
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';


function ListItem({ item, index, viewables }) {

    const { styles } = useStyle();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            transform: [
                
                {
                    scale: withTiming(isVisible ? 1 : 0.9, { duration: 300 })
                }
            ],
            opacity: withTiming(isVisible ? 1 : 0, { duration: 300 })
        }

    }, [item.idx, viewables])

    const goLink = (item) => {
        router.navigate({
            pathname: routes.eventDetail,
            params: {
                idx: item?.idx,
            },
        });
    }

    return (
        <Animated.View 
            style={[animatedStyle]}
        >
            <TouchableOpacity key={index} style={styles.page} activeOpacity={1} onPress={() => goLink(item) }>
                <Image source={consts.s3Url + item.photo} style={styles.pageImage} />
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function Page({  }) {

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

        if(reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if(load) return;
        if(!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            nextToken: reset ? null : nextToken
        }
        
        const { data, error } = await API.post('/v1/event/list', sender);

        setNextToken(data?.nextToken);

        //  let testArr = [...Array(50)]?.map((x, i) => { return { 
        //     ...data?.list?.[0],
        //     idx: i, 
        // }})
        // setList(testArr || []);

        const fetchData = data?.list || [];
        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });
        

        if (reset && !reload) {
            viewables.value = [];
            listRef?.current?.scrollToOffset({ offset: 0, animated: true })
        }

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {
        router.navigate({
            pathname: routes.eventDetail,
            params: {
                idx: item?.idx,
            },
        });
    }

    const renderItem = ({ item, index }) => {
        
        return (
            <ListItem item={item} viewables={viewables}/>
        )
        
    };

    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };

    const header = {
        title: '이벤트',
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
                {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: '#FFF' }} fixed /> )}

                <FlatList
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    removeClippedSubviews
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset',
                        gap: 12
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    
                    onEndReached={() => dataFunc()}
                    onEndReachedThreshold={0.6}
                   
                    ListEmptyComponent={
                        <Empty msg={'이벤트가 없습니다.'} />
                    }
                    ListFooterComponent={
                        () => {
                            if(initLoad || !load || reload) return null;
                            return (
                                <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator size="small" color={colors.black} />
                                </View>
                            )
                        }
                    }

                    onViewableItemsChanged={onViewableItemsChanged}
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
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
        
        page: {
            paddingHorizontal: 20
        },
        pageImage: {
    
            // marginHorizontal: rootStyle.side,
            // width: 330,
            // height: 100,
            width: '100%',
            // height: '100%',
            aspectRatio: 360/120,
            backgroundColor: colors.placeholder,
            borderRadius: 8,
        },

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
        termBox: {
            borderBottomColor: '#D4D6DD',
            borderBottomWidth: 0.5,
            padding: 20,
            backgroundColor: 'rgba(217, 217, 217, 0.3)',
            flex: 1
        },
        webview: {
        }
    })
  
    return { styles }
}
