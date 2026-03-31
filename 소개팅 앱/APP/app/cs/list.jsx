import React, {useRef, useState, useEffect, useCallback} from 'react';
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

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import Cs from '@/components/list/Cs';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

export default function Page({  }) {

    const { styles } = useStyle();

    const { back } = useLocalSearchParams();

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    // useFocusEffect(
    //     useCallback(() => {
    //         setInitLoad(true);
    //         dataFunc(true);
    //     }, [])
    // );

    useEffect(() => {
        dataFunc(true);
    }, [])

    useEffect(() => {

        if(reload || back) {
            dataFunc(true);
        }

    }, [reload, back]);

    const dataFunc = async (reset) => {

        if(load) return;
        if(!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            nextToken: reset ? null : nextToken
        }
        
        const { data, error } = await API.post('/v1/suport/list', sender);

        setNextToken(data?.nextToken);

        setTimeout(() => {

            const fetchData = data?.list || [];
            setList(prev => {
                return reset ? fetchData : [...prev, ...fetchData]
            });
            // setList([]);
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {
        router.navigate({
            pathname: routes.csDetail,
            params: {
                idx: item?.idx,
            },
        });
    }

    const renderItem = ({ item, index }) => {

        return (
            <Cs item={item} />
        );
    };

 
    const header = {
        title: '1:1문의',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_cs'
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            icon: 'pen',
            iconTintColor: colors.text_link,
            onPress: () => {
                router.setParams({
                    back: false
                });
                router.navigate(routes.csWrite);
            }
        }
    };


    return (
        <Layout header={header} >

            <View style={{ flex: 1 }}>
                {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

                <FlatList
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    keyExtractor={(item) => item?.idx}
                    refreshing={reload}
                    removeClippedSubviews
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
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    
                    onEndReached={() => dataFunc()}
                    onEndReachedThreshold={0.6}
                   
                    ListEmptyComponent={
                        <Empty msg={'문의내역이 없습니다.'} />
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
        button1: {
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 12,
            backgroundColor: colors.mainOp5,
            borderRadius: 8
        },
        button1Text: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.main,
        },
        button2: {
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 12,
            backgroundColor: colors.greyE,
            borderRadius: 8
        },
        button2Text: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.grey6,
        },
    })
  
    return { styles }
}
