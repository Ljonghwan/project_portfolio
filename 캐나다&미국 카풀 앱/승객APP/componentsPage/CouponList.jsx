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

import UseCoupon from '@/components/Popup/UseCoupon';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

import { useLang, useAlert } from '@/libs/store';

function ListItem({ item, index, viewables }) {

    const { styles } = useStyle();
    const { country } = useLang();
    const { openAlertFunc } = useAlert();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            opacity: withTiming(isVisible ? 1 : 0, { duration: 150 })
        }

    }, [item.idx, viewables])

    const useFunc = () => {
        openAlertFunc({
            component: <UseCoupon item={item} />
        })
        
    }
    
    const isAvailable = (!item?.isUsed && !item?.isExpired);

    return (
        <Animated.View 
            style={[animatedStyle]}
        >
            <TouchableOpacity style={[styles.listItem, { borderColor: isAvailable ? colors.sub_1 : colors.sub_2 }]} activeOpacity={isAvailable ? 0.7 : 1} onPress={isAvailable ? useFunc : () => { }}>
                <View style={[ rootStyle.flex, { justifyContent: 'space-between' } ]}>
                    <View style={{ flex: 1, gap: 5 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={[styles.listItemTitle, { color: isAvailable ? colors.main : colors.sub_1 }]} numberOfLines={1}>{item?.title?.[country || 'en']}</Text>
                            
                            {isAvailable ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{lang({ id: 'active' })}</Text>
                                </View>
                            ) : (
                                <View style={[styles.tag, { backgroundColor: colors.sub_2 }]}>
                                    <Text style={[styles.tagText, { color: colors.main }]}>{lang({ id: item?.isUsed ? 'used' : 'expired' })}</Text>
                                </View>
                            )}
                            
                        </View>
                        
                        <Text style={styles.listItemDate}>{lang({ id: 'valid_until' })}: {dayjs(item?.createAt).format('MMMM/DD/YYYY A h:mm')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

     const { openAlert } = useAlert();
    
    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const viewables = useSharedValue([]);

    useEffect(() => {

        dataFunc(true);

    }, [openAlert]);

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
        
        const { data, error } = await API.post('/v2/my/couponList', sender);

        setNextToken(data?.nextToken);

        const fetchData = data || [];
        console.log('data', data);
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
                keyExtractor={(item) => item?.idx}

                onRefresh={() => {
                    setReload(true);
                }}
                style={{ flex: 1 }}
                contentContainerStyle={{ 
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 20,
                    paddingBottom: insets?.bottom,
                    flex: list?.length < 1 ? 1 : 'unset',
                    gap: 20
                }}
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={"handled"}
                
                // onEndReached={() => dataFunc()}
                // onEndReachedThreshold={0.6}
                
                ListEmptyComponent={
                    <Empty msg={lang({ id: 'no_coupons' })}/>
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
            paddingVertical: 14,
            paddingHorizontal: 34,
            borderRadius: 12,
            borderColor: colors.sub_1,
            borderWidth: 1,
            backgroundColor: colors.sub_3,
            gap: 20,
        },
        listItemTitle: {
            flexShrink: 1,
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemDate: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },
        tag: {
            height: 21,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 9,
            borderRadius: 13,
            backgroundColor: colors.taseta
        },
        tagText: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.taseta_sub_2,
        },
    })
  
    return { styles }
}
