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

import Rematch from '@/components/list/Rematch';

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
    
    const [product, setProduct] = useState([]); // 
    const [saleList, setSaleList] = useState([]); // 
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

    // useEffect(() => {
    //     dataFunc(true);
    // }, [])

    useEffect(() => {

        if(reload || back) {
            dataFunc(true);
        }

    }, [reload, back]);

    const dataFunc = async (reset) => {

        if(load) return;
        // if(!reset && !nextToken) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/rematch/list');
        // console.log('data', data);
        // setNextToken(data?.nextToken);

        setTimeout(() => {

            setProduct(data?.itemList || []);

            setSaleList(data?.list?.filter(item => item?.status !== 1 && item?.user?.status !== 9) || []);
            setList(data?.list?.filter(item => item?.status === 1 || item?.user?.status === 9) || []);

            // setSaleList([]);
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
            <Rematch isSale={item?.isSale} item={item} time={dayjs(item?.limitAt).toDate()} product={product} dataFunc={dataFunc} />
        );
    };

 
    const header = {
        title: '리매치 라운지',
        titleInfo: {
            message: '할인된 비용으로 재소개 받고 좋은 인연이 되어 보세요!\n소개 받았던 이성을 1년 이내로 다시 받을 수 있어요!'
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

                {(list?.length < 1 && saleList?.length < 1) ? (
                    <Empty msg={'내역이 없습니다.'} fixed style={{ zIndex: 1 }}/>
                ) : (
                    <FlatList
                        data={list}
                        renderItem={renderItem}
                        numColumns={1}
                        keyExtractor={(item) => (item?.isSale ? 'sale_' : 'normal_') + item?.idx}
                        refreshing={reload}
                        removeClippedSubviews
                        onRefresh={() => {
                            setReload(true);
                        }}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ 
                            paddingBottom: insets?.bottom + 20,
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}
                        nestedScrollEnabled={true}
                        decelerationRate={'normal'}
                        
                    
                        ListHeaderComponent={
                            saleList?.length > 0 ? (
                                <View style={styles.header}>
                                    {saleList?.map((item, index) => {
                                        return <Rematch key={(item?.isSale ? 'sale_' : 'normal_') + item?.idx} isSale={item?.isSale} item={item} time={dayjs(item?.limitAt).toDate()} product={product} dataFunc={dataFunc}/>
                                    })}
                                </View>
                            ) : (
                                null
                            )
                        }
                    />
                )}
                

                
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
