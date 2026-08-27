import React, {useRef, useState, useEffect} from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  View,
  ScrollView,
  Pressable,
  Alert,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';

import { router } from "expo-router";
import dayjs from "dayjs";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import Faq from '@/components/list/Faq';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

function Filter({ item, filter, setFilter }) {

    const { styles } = useStyle();
    
    const backgroundColor = useSharedValue(styles.filterItem.backgroundColor);
    const borderColor = useSharedValue(styles.filterItem.borderColor);
    const textColor = useSharedValue(styles.filterText.color);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 200 }),
            borderColor: withTiming(borderColor.value, { duration: 200 }),
            color: withTiming(textColor.value, { duration: 200 }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 200 }),
        };
    });

    useEffect(() => {
        backgroundColor.value = filter === item?.value ? colors.primary : styles.filterItem.backgroundColor; 
        borderColor.value = filter === item?.value ? colors.primary : styles.filterItem.borderColor; 
        textColor.value = filter === item?.value ? colors.white : styles.filterText.color; 
    }, [filter])

    return (
        <AnimatedTouchable 
            style={[
                styles.filterItem,
                animatedStyle
            ]} 
            onPress={() => {
                setFilter(filter === item?.value ? null : item?.value)
            }}
        >
            <Animated.Text style={[styles.filterText, animatedTextStyle]}>{item?.title}</Animated.Text>
        </AnimatedTouchable>
    )
    
}

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const [filter, setFilter] = useState(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {

        setInitLoad(true);
        dataFunc(true);

    }, [filter]);

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
            type: filter,
            // nextToken: reset ? null : nextToken
        }
        
        const { data, error } = await API.post('/v1/faq/list', sender);

        // setNextToken(data?.nextToken);

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
            pathname: routes.noticeDetail,
            params: {
                idx: item?.idx,
            },
        });
    }

    const renderItem = ({ item, index }) => {

        return (
            <Faq item={item}/>
        );
    };

 
    const header = {
        title: 'FAQ',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_faq'
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
                {initLoad && ( <Loading entering={false} color={colors.black} style={{ marginTop: 64, backgroundColor: colors.white }} fixed /> )}

                <View style={[styles.filterBar]}>
                    {consts?.faqOptions?.map((item, index) => (
                        <Filter key={index} item={item} filter={filter} setFilter={setFilter}/>
                    ))}
                </View>

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
                        <Empty msg={'FAQ가 없습니다.'} />
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
      
        filterBar: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 10
        },
        filterItem: {
            flex: 1,
            borderRadius: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.grey6,
            backgroundColor: colors.white,
            height: 54
        },
        filterText: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.grey6,
            letterSpacing: -0.4
        },
    })
  
    return { styles }
}
