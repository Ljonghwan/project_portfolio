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
import lang from '@/libs/lang';

import API from '@/libs/api';

import { ToastMessage, regName, regPhone, regPassword, numFormat } from '@/libs/utils';

import { useUser, useLang } from '@/libs/store';

function ListItem({ item, index, viewables, isDayLabel }) {

    const { styles } = useStyle();
    const { country } = useLang();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            opacity: withTiming(isVisible ? 1 : 0, { duration: 150 })
        }

    }, [item.idx, viewables])

    return (
        <Animated.View 
            style={[animatedStyle]}
        >
            <View style={styles.listItem} >
                {isDayLabel && (
                    <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('MMMM / YYYY')}</Text>
                )}
                <View style={{ flex: 1, gap: 7 }}>
                    <View style={[ rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>{lang({ id: item?.type === 'add' ? 'earned' : 'used'})} - {lang({ id: item?.title })}</Text>
                        <Text style={[styles.listItemValue, { color: item?.type === 'add' ? colors.taseta : colors.main }]}>{item?.type === 'add' ? '+' : '-'}{numFormat(item?.mileage)} {lang({ id: 'mileage' })}</Text>
                    </View>
                    <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('MMMM/DD/YYYY A h:mm')}</Text>
                </View>
            </View>
        </Animated.View>
    );
}

export default function Page({  }) {

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
        
        const { data, error } = await API.post('/v2/my/mileageList', sender);
        console.log('data', data);
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
        const prev = list?.[index - 1];

        let curDay = dayjs(item?.createAt).format("YYYY.MM");
        let prevDay = dayjs(prev?.createAt).format("YYYY.MM");

        let isDayLabel = (!prev || prevDay !== curDay);

        return (
            <ListItem item={item} isDayLabel={isDayLabel} viewables={viewables}/>
        )
        
    };

    const onViewableItemsChanged = ({ viewableItems }) => {
        viewables.value = viewableItems.map((item) => item.item.idx);
    };


    return (
        <View style={{ flex: 1 }}>
            {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}
            
            <View style={{ paddingHorizontal: rootStyle.side, paddingVertical: 16, gap: 27 }}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>{lang({ id: 'mileage_possession' })}</Text>
                    <Text style={styles.headerText}><Text style={{fontFamily: fonts.extraBold, fontSize: 30 }}>{numFormat(mbData?.mileage)} </Text>{lang({ id: 'mileage' })}</Text>
                </View>
                <Text style={styles.headerText}>{lang({ id: 'mileage_history' })}</Text>
            </View>
            
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
                    paddingHorizontal: rootStyle.side,
                    paddingBottom: insets?.bottom,
                    flex: list?.length < 1 ? 1 : 'unset',
                    gap: 15
                }}
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={"handled"}
                
                // onEndReached={() => dataFunc()}
                // onEndReachedThreshold={0.6}
                
                ListEmptyComponent={
                    <Empty msg={lang({ id: 'no_history' })}/>
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
        header: {
            borderWidth: 1,
            borderColor: colors.main,
            borderRadius: 12,
            backgroundColor: colors.white,
            paddingHorizontal: 34,
            paddingVertical: 17,
            gap: 3
        },
        headerText: {
            fontFamily: fonts.medium,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItem: {
            paddingVertical: 14,
            gap: 15
        },
        listItemTitle: {
            flexShrink: 1,
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
