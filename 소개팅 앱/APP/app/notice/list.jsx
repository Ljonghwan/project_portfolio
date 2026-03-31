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
import { FlashList } from "@shopify/flash-list";


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

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

function ListItem({ item, index, viewables }) {

    const { styles } = useStyle();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            transform: [
                {
                    translateX: withTiming(isVisible ? 0 : 30, { duration: 300 })
                },
                {
                    scale: withTiming(isVisible ? 1 : 0.95, { duration: 300 })
                }
            ],
            opacity: withTiming(isVisible ? 1 : 0, { duration: 300 })
        }

    }, [item.idx, viewables])

    const goLink = (item) => {
        router.navigate({
            pathname: routes.noticeDetail,
            params: {
                idx: item?.idx,
            },
        });
    }

    return (
        <View 
            // style={[animatedStyle]}
        >
            <TouchableOpacity style={styles.listItem} onPress={() => { goLink(item) }}>
                <View style={[ rootStyle.flex, { justifyContent: 'space-between' } ]}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>{item?.title}</Text>
                        <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</Text>
                    </View>
                    <Image source={images.link} style={rootStyle.default} />
                </View>
            </TouchableOpacity>
        </View>
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

        setLoad(true);

        
        const { data, error } = await API.post('/v1/notice/list');
        setList(data?.list || []);

        setTimeout(() => {
            
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
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
        title: '공지사항',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_notice'
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
                {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: '#FFF' }} fixed /> )}

                <FlashList
                    ref={listRef}
                    data={list} // 여기에 담겨져 있음
                    renderItem={renderItem} // 여기서 하나하나 랜더링함
                    numColumns={1}
                    refreshing={reload}
                    
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    
                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                   
                    ListEmptyComponent={
                        <Empty msg={'공지사항이 없습니다.'} />
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
            gap: 20,
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
