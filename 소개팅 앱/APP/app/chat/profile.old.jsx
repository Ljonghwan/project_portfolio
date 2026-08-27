import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import CarouselProfile from '@/components/carousel/CarouselProfile';

import ListMy from '@/components/profile/ListMy';
import ListTarget from '@/components/profile/ListTarget';

import Simple from '@/components/badges/Simple';
import TopVisual from '@/components/badges/TopVisual';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';

import { numFormat } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';

export default function Page({  }) {

    const { idx, roomIdx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const [item, setItem] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(true); // 데이터 추가 로딩

    useEffect(() => {

        dataFunc()

    }, [idx]);

    const dataFunc = async () => {

        let sender = {
            userIdx: idx,
            roomIdx: roomIdx
        }
        const { data, error } = await API.post('/v1/chat/userProfile', sender);

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);
        console.log('data', data);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }

 
    const header = {
        title: '상세 프로필',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: insets?.bottom || 20, gap: 20 }}
            >
                <View style={styles.top}>
                    {item?.level === 2 && ( 
                        <View style={styles.topBadge}>
                            <TopVisual /> 
                        </View>
                    )}
                    <View style={styles.topName}>
                        <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.itemImage}/>
                        <View style={{ gap: 8 }}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 8 }]}>
                                <Text style={styles.itemName} numberOfLines={1}>{item?.name}</Text>
                                
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                                {typeof(item?.userDetail?.height) === 'number' && <Simple title={configOptions?.heightOptions?.[item?.userDetail?.height]}/>}
                                <Simple title={dayjs(item?.birth).format('YY')}/>
                            </View>
                        </View>
                    </View>

                    {item?.level === 1 && (
                        <View style={styles.topRank}>
                            <View style={styles.topRankBox}>
                                <Text style={styles.label}>순위</Text>
                                <Text style={styles.content}>{numFormat( item?.rankInfo?.rank)}</Text>
                            </View>
                            <View style={styles.topRankBox}>
                                <Text style={styles.label}>플러팅 자산</Text>
                                <View style={[ rootStyle.flex, { gap: 4 }]}>
                                    <Image source={images.flirting} style={[ rootStyle.flirting, { width: 9 } ]} />
                                    <Text style={styles.content}>{numFormat(item?.rankInfo?.cnt)}개</Text>
                                </View>
                            </View>
                            <View style={styles.topRankBox}>
                                <Text style={styles.label}>자산 클래스</Text>
                                <Image source={images?.[`class_${item?.rankInfo?.class}`] || images?.class_c} style={[ rootStyle.rankBadge, { width: 70 }]} />
                            </View>
                        </View>
                    )}
                   
                </View>

                <View style={styles.listItem}>
                    {/* <View style={styles.titleBox}>
                        <Text style={styles.listItemTitle}>프로필 사진</Text>
                    </View> */}
                    
                    <CarouselProfile pages={item?.userDetail?.photoList} />
                </View>

                <View style={{ gap: 32 }}>
                    <View style={styles.listItem}>
                        <View style={styles.titleBox}>
                            <Text style={styles.listItemTitle}>내 프로필</Text>
                        </View>
                        <View style={styles.profileList}>
                            <ListMy data={item?.userDetail}/>
                        </View>
                    </View>

                    <View style={styles.listItem}>
                        <View style={styles.titleBox}>
                            <Text style={styles.listItemTitle}>원하시는 이성</Text>
                        </View>
                        <View style={styles.profileList}>
                            <ListTarget data={item?.userMatchingDetail}/>
                        </View>
                    </View>
                </View>

            </ScrollView>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        top: {
            padding: 20,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 20,
            marginHorizontal: 20,
        },
        topName: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            
            paddingHorizontal: 8
        },
        itemImage: {
            width: 64,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemName: {
            color: colors.dark,
            fontFamily: fonts.semiBold,
            fontSize: 18,
            letterSpacing: -0.4
        },
        topRank: {
            paddingTop: 20,
            marginTop: 20,
            borderTopColor: colors.greyE,
            borderTopWidth: 1,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
        },
        topRankBox: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7
        },
        label: {
            color: colors.dark,
            fontSize: 12,
            lineHeight: 20,
            letterSpacing: -0.3
        },
        content: {
            color: colors.dark,
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
        topBadge: {
            paddingBottom: 12,
            marginBottom: 12,
            borderBottomColor: colors.greyE,
            borderBottomWidth: 1,
            flexDirection: 'row',
            alignItems: 'flex-start',
        },



        listItem: {
            gap: 20
        },
        titleBox: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            color: colors.dark,
            letterSpacing: -0.5
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
        profileList: {
            paddingHorizontal: 20
        }
    })
  
    return { styles }
}
