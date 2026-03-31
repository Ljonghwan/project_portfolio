import React, {useRef, useState, useEffect} from 'react';
import {
  FlatList,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
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

import { ToastMessage, imageViewer, numFormat } from '@/libs/utils';

export default function Page({  }) {

    const { styles } = useStyle();
    const { data, rank } = useLocalSearchParams();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const [item, setItem] = useState(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useEffect(() => {
        console.log('data', data);
        setItem( data ? JSON.parse(data) : null );
    }, [data])
 
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.root}>
                <View style={styles.top}>
                    <View style={styles.topName}>
                        <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.itemImage}/>
                        <Text style={styles.itemName} numberOfLines={1}>{item?.nickName}</Text>
                    </View>
                    <View style={styles.topRank}>
                        <View style={styles.topRankBox}>
                            <Text style={styles.label}>순위</Text>
                            <Text style={styles.content}>{rank}</Text>
                        </View>
                        <View style={styles.topRankBox}>
                            <Text style={styles.label}>플러팅 자산</Text>
                            <View style={[ rootStyle.flex, { gap: 4 }]}>
                                <Image source={images.flirting} style={[ rootStyle.flirting, { width: 9 } ]} />
                                <Text style={styles.content}>{numFormat(item?.cnt)}개</Text>
                            </View>
                        </View>
                        <View style={styles.topRankBox}>
                            <Text style={styles.label}>자산 클래스</Text>
                            <Image source={images?.[`class_${item?.class}`] || images?.class_c} style={[ rootStyle.rankBadge, { width: 70 }]} />
                        </View>
                    </View>
                </View>

                {item?.profileLarge && (
                    <Pressable style={styles.bottom} onPress={() => { imageViewer({ index: 0, list: [item?.profileLarge] }) }}>
                        <Image source={item?.profileLarge ? consts.s3Url + item?.profileLarge : images.profile} style={styles.profile}/>
                    </Pressable>
                )}
                
            </ScrollView>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            padding: 20,
            gap: 20
        },
        top: {
            padding: 20,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 20
        },
        topName: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 20,
            marginBottom: 20,
            borderBottomColor: colors.greyE,
            borderBottomWidth: 1,
            paddingHorizontal: 8
        },
        itemImage: {
            width: 50,
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
        profile: {
            width: '100%',
            aspectRatio: 1/1,
            borderRadius: 8,
            backgroundColor: colors.placeholder
        }

        
    })
  
    return { styles }
}
