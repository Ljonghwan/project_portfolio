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
  ActivityIndicator,
  Platform
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import * as Linking from 'expo-linking';
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Switch from '@/components/Switch';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser, useEtc } from '@/libs/store';

import API from '@/libs/api';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();
    const { appActiveStatus } = useEtc();

    const [alarm, setAlarm] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useFocusEffect(
        useCallback(() => {
            checkPermission().then((enabled) => {
                setAlarm(enabled);
            });
            reload();
        }, [appActiveStatus])
    );

    useEffect(() => {

        // console.log('mbData', mbData?.alarm);
        // setAlarm(mbData?.alarm);

    }, [mbData])

    const toggleAlarmPress = async () => {

        await Linking.openSettings();
        return;

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

    const checkPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    }
 
    const header = {
        title: '프로필 설정',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting',
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
                
                <View style={styles.listItem}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={images.setting_bell} style={rootStyle.default} />
                        <Text style={styles.listItemTitle}>알림</Text>
                    </View>
                    <Switch
                        value={alarm}
                        togglePress={toggleAlarmPress}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => {
                        router.navigate(routes.joinProfile);
                    }}
                >
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={images.setting_profile} style={rootStyle.default} />
                        <Text style={styles.listItemTitle}>설문 프로필 변경</Text>
                    </View>
                    
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => {
                        router.navigate(routes.settingNickname);
                    }}
                >
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={images.setting_nick} style={rootStyle.default} />
                        <Text style={styles.listItemTitle}>닉네임 변경</Text>
                    </View>
                    
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>
                
                {mbData?.type === 'email' && (
                    <TouchableOpacity 
                        style={styles.listItem} 
                        onPress={() => {
                            router.navigate(routes.settingPassword);
                        }}
                    >
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                            <Image source={images.setting_pass} style={rootStyle.default} />
                            <Text style={styles.listItemTitle}>비밀번호 변경</Text>
                        </View>
                        <Image source={images.link} style={rootStyle.default} />
                    </TouchableOpacity>
                )}
                

                <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => {
                        router.navigate(routes.settingPhone);
                    }}
                >
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={images.setting_hp} style={rootStyle.default} />
                        <Text style={styles.listItemTitle}>휴대폰 변경</Text>
                    </View>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => {
                        router.navigate({
                            pathname: mbData?.type === 'email' ? routes.settingLeavePass : routes.settingLeave
                        });
                    }}
                >
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                        <Image source={images.setting_leave} style={rootStyle.default} />
                        <Text style={styles.listItemTitle}>회원 탈퇴</Text>
                    </View>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>
                
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
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        listItemTitle: {
            fontFamily: fonts.medium,
            fontSize: 16,
            lineHeight: 20,
            color: colors.text_link,
        },
        listItemDate: {
            fontSize: 14,
            fontFamily: fonts.pretendardRegular,
            color: '#999',
        },
        termBox: {
            borderBottomColor: '#D4D6DD',
            borderBottomWidth: 0.5,
            padding: 20,
            backgroundColor: 'rgba(217, 217, 217, 0.3)',
            flex: 1
        },
        webview: {
        }
    })
  
    return { styles }
}
