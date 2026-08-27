import { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming, FadeIn, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListText from '@/components/ListText';
import Layout from '@/components/Layout';
import Info from '@/components/Info';
import InputFlirting from '@/components/InputFlirting';
import Button from '@/components/Button';

import OrderFlirting from '@/components/list/OrderFlirting';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import chatStyle from '@/libs/chatStyle';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { numFormat, ToastMessage, } from '@/libs/utils';
import { useUser, useConfig } from '@/libs/store';

import dayjs from 'dayjs';

export default function Component({}) {

    const { 
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const { token, mbData } = useUser();
    const { configOptions } = useConfig();
    const insets = useSafeAreaInsets();

    const [my, setMy] = useState(null);
    const [target, setTarger] = useState(null);

    const [flirting, setFlirting] = useState(0);
    const [todayFlirting, setTodayFlirting] = useState(0);

    const [data, setData] = useState([]);

    const [room, setRoom] = useState(null); // 
    const [isActive, setIsActive] = useState(false); // 픽켓전송 활성화

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [disabled, setDisabled] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침

    useFocusEffect(
        useCallback(() => {
            roomInfo(dataFunc);
        }, [roomIdx])
    );

    useEffect(() => {
        if (reload) {
            dataFunc();
            roomInfo();
        }
    }, [reload]);

    const dataFunc = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/flirting', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        setMy(data?.myInfo);
        setTarger(data?.targetUser);
        setFlirting(data?.usedCount); // 방에 확정전송된 개수
        setTodayFlirting(data?.usageCount); // 방에서 전달가능 개수


        let dataList = data?.list || [];
        const groups = Object.entries(
            dataList.reduce((acc, item) => {
                const date = item.createAt.slice(0, 10);
                (acc[date] = acc[date] || []).push(item);
                return acc;
            }, {})
        ).flatMap(([date, items]) => [date, ...items]);
        
        setData(groups || []);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }

    const roomInfo = async (callback) => {
        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/chat/roomInfo', sender);

        setRoom(data);
        setIsActive(Boolean(data?.type === 2 && data?.status === 1 && !data?.lock && !data?.isKeepOn));

        if (callback) await callback(data);
    }

    const renderItem = ({ item, index }) => {

        let title = '';
        let title2 = '';
        let abs = null;
        
        if(item?.isSuper) {
            title = `슈퍼 픽켓 ${numFormat(item?.count)}장${my?.level === 2 ? '이 추가됬어요.' : '을 추가했어요.'}`;
            abs = 'super';
        } else {
            if(my?.level === 2) {
                title2 = item?.status === 5  ? ' 다시 돌려줬어요.' : ' 받았어요.'
                abs = item?.status === 5 ? 'minus' : 'add';
            }
            if(my?.level === 1) {
                title2 = item?.status === 5  ? ' 돌려 받았어요.' : ' 전달했어요.'
                abs = item?.status === 5 ? 'add' : 'minus';
            }
            title = `픽켓 ${numFormat(item?.count)}장을 ` + title2;
        }


        return (
            <OrderFlirting item={item} title={title} abs={abs} level={mbData?.level} />
        );
    };


    const header = {
        titleStyle: {
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'picket',
            style: {
                width: 30,
            }, 
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '픽켓 내역',
            textStyle: styles.headerText,
            onPress: () => { router.navigate(routes.orderFlirting) }
        }
    };

    return (
        <Layout header={{...header, title: mbData?.level === 1 ? '전달한 픽켓' : '전달받은 픽켓'}} >

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}

            <View style={{ flex: 1 }}>
                <View style={{ gap: 30, paddingHorizontal: 20 }}>
                    <View style={styles.header} >
                        <View style={{ gap: 26 }}>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                                    <Image source={images.picket} style={[rootStyle.picket, { width: 23 }]}/>
                                    <Text style={styles.name}>상대방에게 픽켓을 이만큼 선물 { my?.level === 1 ? '했어요.' : '받았어요.'}</Text>
                                </View>
                                <Info 
                                    infoComponent={
                                        <View style={{ width: '100%', backgroundColor: colors.white }}>
                                            <View style={styles.infoBox}>
                                                <Text style={styles.infoBoxText}>{`• 픽켓은 소개팅 중 동일 인물에게 4장까지 전달 가능해요.`}</Text>
                                                <Text style={styles.infoBoxText}>{`• 1% 회원은 픽켓은 1장 기준,\n수수료를 제외한 50%의 금액으로 환전 가능합니다.`}</Text>
                                                <Text style={styles.infoBoxText}>{`• 픽켓을 상대방에게 전달 한 후 1% 회원이 6시간 동안 받기를 누르지 않으면 선택 회원님께 픽켓이 다시 돌아와요.`}</Text>
                                                <Text style={styles.infoBoxText}>{`• 픽켓 4장을 모두 전달하면 해당 기능이 슈퍼 픽켓으로 변경되며 소개팅 종료후 만남 인증시 1% 회원이 픽켓을 수령 받을 수 있습니다.`}</Text>
                                                <Text style={styles.infoBoxText}>{`• 슈퍼 픽켓은 만남 인증이 되지 않을 시 수령 받을 수 없습니다.`}</Text>
                                            </View>
                                        </View>
                                    }
                                >
                                    <Image source={images.info} style={rootStyle.default} tintColor={colors.main}/>
                                </Info>
                                
                            </View>

                            <View style={{ gap: 8 }}>
                                <InputFlirting 
                                    valid={'number'}
                                    name={'input'}
                                    state={flirting} 
                                    readOnly={true}
                                    style={{ justifyContent: 'center' }}
                                />
                            </View>

                            <View style={{ gap: 7 }}>
                                <ListText style={styles.infoBoxText2}>{`선물 ${my?.level === 1 ? '가능한' : '받을 수 있는'} 픽켓 갯수 : `}
                                    <Text style={[styles.infoBoxText2, { color: colors.dark, fontFamily: fonts.semiBold }]}>{numFormat(todayFlirting)}{`장`}</Text>
                                </ListText>
                                <ListText style={styles.infoBoxText2}>{`이번 소개팅에서 ${my?.level === 1 ? '전달한' : '받은'} 픽켓 갯수 : `}
                                    <Text style={[styles.infoBoxText2, { color: colors.dark, fontFamily: fonts.semiBold}]}>{numFormat(flirting)}{`장`}</Text>
                                </ListText>
                            </View>

                            {my?.level === 1 && isActive && (
                                <Button
                                    containerStyle={[rootStyle.flex, { gap: 8 }]}
                                    textStyle={{ fontSize: 16 }}
                                    frontIcon={'picket_send'}
                                    frontIconStyle={rootStyle.default}
                                    frontIconTintColor={colors.white}
                                    onPress={() => {
                                        router.navigate({
                                            pathname: routes.chatFlirting,
                                            params: {
                                                roomIdx: roomIdx,
                                            }
                                        })
                                    }}
                                >
                                    {'픽켓 선물하기'}
                                </Button>
                            )}
                        </View>
                    </View>
                    
                </View>

                <View style={styles.bar} />


                <FlashList
                    data={data}
                    renderItem={({ item }) => {
                        if (typeof item === "string") {
                            // Rendering header
                            return (
                                <View style={[rootStyle.flex, { height: 40, paddingHorizontal: 20, justifyContent: 'space-between', backgroundColor: colors.white }]}>
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
                    stickyHeaderIndices={data?.map((item, index) => (typeof item === "string" ? index : null)).filter((index) => index !== null)}
                    maintainVisibleContentPosition={{
                        animateAutoScrollToBottom: false
                    }}

                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: data?.length < 1 ? 1 : 'unset'
                    }}
                    ListHeaderComponent={
                        <View style={{ paddingHorizontal: rootStyle.side, marginBottom: 8 }}>
                            <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>전체 내역</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{  }}/>
                    }
                />

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

        root: {
            flex: 1,
        },

        header: {
            gap: 26,
            paddingTop: 16
        },
        title: {
            color: colors.dark,
            fontSize: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.5,
        },
        name: {
            color: colors.main,
            fontFamily: fonts.semiBold,
            fontSize: width <= 320 ? 14 : 18,
            lineHeight: 24,
            letterSpacing: -0.4
        },
        infoBox: {
            maxWidth: '100%',
            width: '100%',
            paddingVertical: 14,
            paddingHorizontal: width <= 320 ? 16 : 24,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            borderRadius: 20,
            backgroundColor: chatStyle?.chat_season_5?.systemBackgroundColor,
            gap: 15
        },
        infoBoxText: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 22,
            letterSpacing: -0.35,
        },
        infoBoxText2: {
            color: colors.text_info,
            fontSize: 14,
            lineHeight: 22,
            letterSpacing: -0.35
        },
        bar: {
            width: '100%',
            height: 14,
            backgroundColor: colors.greyD9,
            marginTop: 20
        },



    });
  
    return { styles }
}


