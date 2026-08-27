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
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import RoomItem from '@/components/Item/RoomItem';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

import { useLang, useUser } from '@/libs/store';

export default function Page({ item, jumpTo,  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const { mbData } = useUser();

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
            nextToken: reset ? null : nextToken,
            limit: 50
        }
        
        const { data, error } = await API.post('/v2/my/notiList', sender);

        setNextToken(data?.nextToken);

        const fetchData = data || [];
        // const fetchData = dummy.getBoardDummys(100);

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });
        
        // if (reset && !reload) {
        //     viewables.value = [];
        //     listRef?.current?.scrollToOffset({ offset: 0, animated: true })
        // }

        setTimeout(() => {
            
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }
    

    const renderItem = ({ item, index }) => {
        
        return (
            <RoomItem item={item}/>
        )
        
    };


    return (
        <View style={{ flex: 1 }}>
            {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

            {item?.creator?.idx === mbData?.idx ? (
                <FlashList
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
                        paddingHorizontal: rootStyle.side,
                        paddingBottom: insets?.bottom,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    
                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                    
                    ListEmptyComponent={
                        <Empty />
                    }
                />
            ) : (
                <View>
                    <Text>1111111</Text>
                </View>
            )}
            

            
        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
      
        listItem: {
            paddingVertical: 14,
            borderBottomColor: colors.sub_1,
            borderBottomWidth: 1,
            gap: 20,
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemDate: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
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
