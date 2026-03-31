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

import Refund from '@/components/list/Refund';

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

    useFocusEffect(
        useCallback(() => {
            setInitLoad(true);
            dataFunc(true);
        }, [])
    );

    useEffect(() => {

        if(reload || back) {
            dataFunc(true);
        }

    }, [reload, back]);

    const dataFunc = async (reset) => {

        if(load) return;
        // if(!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/refund/list');

        // setNextToken(data?.nextToken);

        setTimeout(() => {

            setList(data || []);

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
            <Refund item={item} />
        );
    };

 
    const header = {
        title: '소개팅 환불 내역',
        titleStyle: {
            fontSize: 16,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'wallet2'
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
      
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
                    
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} />
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
        header: {
            borderBottomWidth: 4,
            borderBottomColor: colors.greyE  
        },



        
    })
  
    return { styles }
}
