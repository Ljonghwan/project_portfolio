import React, {useRef, useState, useEffect} from 'react';
import {
  FlatList,
  SectionList,
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
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

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

import { useAlert } from '@/libs/store';

export default function Page({  }) {


    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

	const { openAlertFunc } = useAlert();
    
    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

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

        const { data, error } = await API.post('/v1/alarm/list');

        let dataList = data || [];

        const groups = Object.entries(
            dataList.reduce((acc, item) => {
                const date = item.createAt.slice(0, 10);
                (acc[date] = acc[date] || []).push(item);
                return acc;
            }, {})
        ).flatMap(([date, items]) => [date, ...items]);

        setList(groups || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {
        if(!item?.route || !routes?.[item?.route]) return;

        let ob = {
            pathname: routes?.[item?.route],
        };

        if(item?.routeIdx) ob.params = { idx: item?.routeIdx };

        try {
            router.navigate(ob);    
        } catch (error) {
            console.log('error', error)
        }
        
    }


    const deleteAlert = () => {
        openAlertFunc({
            icon: images.warning,
            label: `알림목록을 전체 삭제하시겠습니까?`,
            onCencleText: "닫기",
            onPressText: "삭제",
            onCencle: () => {},
            onPress: () => {
                deleteFunc('all');
            }
        })
    }

    const deleteFunc = async (idx) => {

        const sender = {
            idx: idx
        }

        const { data, error } = await API.post('/v1/alarm/delete', sender);

        ToastMessage('삭제 되었습니다.');
        dataFunc();
    }
 
    const renderItem = ({ item, index }) => {

        return (
            <TouchableOpacity style={styles.listItem} activeOpacity={0.7} onPress={() => { goLink(item) }}>
                <View style={[ rootStyle.flex, { gap: 12, justifyContent: 'space-between' } ]}>
                    <View style={[rootStyle.flex, { flex: 1, gap: 12 }]}>
                        <View style={styles.alarmIcon}>
                            {
                                item?.type === 2 || item?.type === 24 || item?.type === 34 ? <Image source={images.picket} style={[rootStyle.picket, { width: 21 }]} /> 
                                : item?.type === 3 || item?.type === 35 ? <Image source={images.super_picket} style={rootStyle.default22} /> 
                                : item?.type === 10 || item?.type === 26 ? <Image source={images.alarm_refund} style={{ width: 20, aspectRatio: 20/13.57}} /> 
                                : item?.type === 25 ? <Image source={images.alarm_user_leave} style={rootStyle.default} /> 
                                : item?.type === 31 || item?.type === 32 ? <Image source={images.alarm_manager_picket} style={rootStyle.default20} /> 
                                : item?.type === 33 ? <Image source={images.alarm_note} style={rootStyle.default18} /> 
                                : item?.type === 37 ? <Image source={images.alarm_call_objection_2} style={rootStyle.default20} /> 
                                : item?.type === 38 ? <Image source={images.alarm_call_objection_1} style={rootStyle.default20} /> 

                                : <Image source={images.alarm_default} style={rootStyle.default18} />
                            }
                        </View>
                        <View style={{ gap: 5, flex: 1 }}>
                            <Text style={styles.listItemTitle} numberOfLines={2}>{item?.title}</Text>
                            <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('HH:mm')}</Text>
                        </View>
                    </View>
                    
                    {/* <TouchableOpacity hitSlop={10} activeOpacity={0.7} onPress={() => deleteFunc(item?.idx)}>
                        <Image source={images.exit_grey} style={rootStyle.default} />
                    </TouchableOpacity> */}
                </View>
            </TouchableOpacity>
        );
    };

    const header = {
        title: '알림',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'bell'
        },

        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '전체삭제',
            textStyle: styles.headerText,
            onPress: deleteAlert
        }
    };


    return (
        <Layout header={header} >

            <View style={{ flex: 1 }}>
                {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}
                
                <FlashList
                    data={list}
                    renderItem={({ item }) => {
                        if (typeof item === "string") {
                            // Rendering header
                            return (
                                <View style={[rootStyle.flex, { paddingVertical: 10, justifyContent: 'space-between', backgroundColor: colors.white, paddingHorizontal: rootStyle.side + 8 }]}>
                                    <Text style={[rootStyle.font(14, colors.text_info, fonts.regular)]}>{item}</Text>
                                </View>
                            );
                        } else {
                            // Render item
                            return renderItem({ item })
                        }
                    }}
                    getItemType={(item) => {
                        // To achieve better performance, specify the type based on the item
                        return typeof item === "string" ? "sectionHeader" : "row";
                    }}
                    stickyHeaderIndices={list?.map((item, index) => (typeof item === "string" ? index : null)).filter((index) => index !== null)}

                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    ListEmptyComponent={
                        <Empty msg={'알림이 없습니다.'} style={{ }}/>
                    }
                />

                {/* <SectionList
                    sections={list}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[rootStyle.flex, { paddingVertical: 4, justifyContent: 'space-between', backgroundColor: colors.white }]}>
                            <Text style={[rootStyle.font(14, colors.text_info, fonts.regular)]}>{title}</Text>
                        </View>
                    )}
                    renderSectionFooter={() => <View style={{ height: 20 }} />}
                    stickySectionHeadersEnabled={false}
                    numColumns={1}
                    refreshing={reload}
                    removeClippedSubviews
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 20,
                        paddingHorizontal: rootStyle.side + 8,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                   
                    ListEmptyComponent={
                        <Empty msg={'알림이 없습니다.'} />
                    }
                /> */}

                
            </View>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: colors.primary,
            textDecorationLine: 'underline'
        },
        button: {
            paddingHorizontal: 12,
            height: 36,
            backgroundColor: colors.greyE,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            alignSelf: 'flex-end'
        },
        buttonText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            fontFamily: fonts.semiBold
        },
        listItem: {
            // paddingHorizontal: 4,
            paddingHorizontal: rootStyle.side + 8,
            paddingVertical: 20,
            // borderBottomColor: colors.greyE,
            // borderBottomWidth: 1,
            gap: 20
        },
        listItemDate: {
            fontSize: 12,
            lineHeight: 20,
            color: colors.grey6
        },
        listItemTitle: {
            fontFamily: fonts.medium,
            fontSize: width <= 320 ? 14 : 16,
            lineHeight: 20,
            color: colors.dark,
            flex: 1
        },
        listItemDate: {
            fontSize: width <= 320 ? 13 : 14,
            fontFamily: fonts.pretendardRegular,
            color: '#999',
        },
        alarmIcon: {
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.primary4,
            alignItems: 'center',
            justifyContent: 'center'
        },
    })
  
    return { styles }
}
