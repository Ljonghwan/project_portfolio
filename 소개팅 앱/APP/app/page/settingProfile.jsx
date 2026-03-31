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

import { router, useFocusEffect } from "expo-router";
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

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser } from '@/libs/store';

import API from '@/libs/api';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();

    const [alarm, setAlarm] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect');
            reload();
        }, [])
    );

    useEffect(() => {

        console.log('mbData', mbData?.alarm);
        setAlarm(mbData?.alarm);

    }, [mbData])

    const toggleAlarmPress = async () => {

        let sender = {
            type: 4,
            alarm: !alarm
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/user/udpateInfo', sender);

        if(error) {
            ToastMessage(error?.message);
            return;
        }

        setAlarm(!alarm);
    }


 
    const header = {
        title: '프로필',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: insets?.bottom || 20, gap: 20 }}
            >
                <View style={styles.listItem}>
                    <View style={styles.titleBox}>
                        <Text style={styles.listItemTitle}>소개팅 사진</Text>
                        <TouchableOpacity style={styles.button1} onPress={() => router.navigate(routes.profilePhoto)}>
                            <Text style={styles.button1Text}>수정</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <CarouselProfile pages={mbData?.userDetail?.photoList} />
                </View>

                <View style={{ gap: 32 }}>
                    <View style={styles.listItem}>
                        <View style={styles.titleBox}>
                            <Text style={styles.listItemTitle}>내 프로필</Text>
                            <TouchableOpacity style={styles.button1} onPress={() => router.navigate(routes.joinProfile)}>
                                <Text style={styles.button1Text}>수정</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.profileList}>
                            <ListMy data={mbData?.userDetail}/>
                        </View>
                    </View>

                    <View style={styles.listItem}>
                        <View style={styles.titleBox}>
                            <Text style={styles.listItemTitle}>원하시는 이성</Text>
                            <TouchableOpacity style={styles.button1} onPress={() => router.navigate(routes.joinTargetProfile)}>
                                <Text style={styles.button1Text}>수정</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.profileList}>
                            <ListTarget data={mbData?.userMatchingDetail}/>
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
