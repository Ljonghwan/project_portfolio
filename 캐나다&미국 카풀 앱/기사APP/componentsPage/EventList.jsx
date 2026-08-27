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
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { useLang } from '@/libs/store';

function ListItem({ item, index, viewables }) {

    const { styles } = useStyle();
    const { country } = useLang();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            opacity: withTiming(isVisible ? 1 : 0, { duration: 150 })
        }

    }, [item.idx, viewables])

    const goLink = (item) => {
        router.push({
            pathname: routes.eventView,
            params: {
                idx: item?.idx,
            },
        });
    }

    return (
        <Animated.View 
            style={[animatedStyle]}
        >
            <TouchableOpacity style={styles.listItem} onPress={() => { goLink(item) }}>
                <Image source={consts.s3Url + item?.image?.[country]} style={styles.listItemImage}/>
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
            nextToken: reset ? null : nextToken,
            limit: 50
        }
        
        const { data, error } = await API.post('/v2/my/eventList', sender);

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
            <ListItem item={item} viewables={viewables}/>
        )
        
    };

    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };


    return (
        <View style={{ flex: 1 }}>
            {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

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
                    paddingHorizontal: rootStyle.side + 10,
                    paddingTop: 16,
                    paddingBottom: insets?.bottom,
                    flex: list?.length < 1 ? 1 : 'unset',
                    gap: 25
                }}
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={"handled"}
                
                // onEndReached={() => dataFunc()}
                // onEndReachedThreshold={0.6}
                
                ListEmptyComponent={
                    <Empty />
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

                onViewableItemsChanged={onViewableItemsChanged}
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={10}
            />

            
        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
      
        listItem: {
        },
        listItemImage: {
            width: '100%',
            aspectRatio: 330/106,
            borderRadius: 12,
            backgroundColor: colors.placeholder
        }
    })
  
    return { styles }
}
