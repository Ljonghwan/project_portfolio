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
  Platform,
  Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image, ImageBackground } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// component
import Loading from '@/components/Loading';
import InputFlirting from '@/components/InputFlirting';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import chatStyle from '@/libs/chatStyle';
import chatImages from '@/libs/chatImages';


import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

import API from '@/libs/api';

export default function Page({  }) {

    const { 
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();


    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {


    }, [])
   

    const onPress = async () => {
        openLoader();

        let sender = {
            roomIdx: roomIdx,
        };
            
        console.log('sender', sender);
        
        const { data, error } = await API.post('/v1/chat/freeviewDone', sender);

        setTimeout(() => {
            closeLoader();

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            setTimeout(() => {
                router.dismissTo({
                    pathname: routes.chatPreviewRoom,
                    params: {
                        idx: roomIdx,
                    }
                });
                router.replace({
                    pathname: routes.chatRoom,
                    params: {
                        idx: data?.idx,
                    }
                })
            }, 500)
            
        }, consts.apiDelay);

    }

    const leaveAlert = () => {

        openAlertFunc({
            icon: images.warning,
            title: `소개팅을 취소 하시겠습니까?`,
            onCencleText: "닫기",
            onPressText: "취소하기",
            onPress: async () => {
                // 프리뷰 챗 종료 API
                let sender = {
                    roomIdx: roomIdx
                }

                const { data, error } = await API.post('/v1/chat/cancelFreeview', sender);

                if (error) {
                    ToastMessage(error?.message);
                    return;
                }

                ToastMessage('소개팅이 취소되었습니다.');

                if (router.canDismiss()) router.dismissAll();
                router.replace(routes.chat);
                return;

            }
        });
    }


    const header = {
        title: '픽켓 전달',
        titleStyle: {
            fontSize: 18,
            color: chatStyle.chat_season_1.spring1,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'preview_send',
            style: {
                width: 30,
                height: 30,
            },
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            text: '픽켓 구매',
            textStyle: styles.headerText,
            onPress: () => { router.navigate(routes.paymentProduct) }
        }
    };


    return (
        <ImageBackground
            style={{ flex: 1 }}
            source={chatStyle?.chat_season_1?.backgroundImage}
            contentFit="cover"
        >
            <Layout header={header} backgroundColor={'transparent'}>

                <View style={{ flex: 1, paddingHorizontal: rootStyle.side }}>

                    <View style={{ gap: 24 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                            <Image source={images.picket} style={[rootStyle.picket, { width: 23.4 }]} tintColor={chatStyle?.chat_season_1?.primary}/>
                            <Text style={{ fontSize: width <= 320 ? 14 : width <= 360 ? 16 : 18, color: chatStyle?.chat_season_1?.primary, fontFamily: fonts.semiBold }}>1% 회원님에게 픽켓 2장을 전달하시겠어요?</Text>
                        </View>

                        <View style={{ gap: 7}}>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20 }}>
                                전달 픽켓 갯수 :
                                <Text style={{...rootStyle.font(14, colors.dark, fonts.semiBold), lineHeight: 20 }}> 2장</Text>
                            </ListText>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20 }}>
                                내가 보유한 픽켓 갯수 :
                                <Text style={{...rootStyle.font(14, colors.dark, fonts.semiBold), lineHeight: 20 }}> {numFormat(mbData?.flirting)}장</Text>
                                {mbData?.flirting < 2 && <Text style={{...rootStyle.font(12, colors.red4), lineHeight: 20 }}> (픽켓이 부족합니다.)</Text>}
                            </ListText>
                        </View>
                    </View>

                    <View>
                        <View style={styles.button}>
                            <Image source={images.picket} style={[rootStyle.picket, { width: 23.4 }]} tintColor={chatStyle?.chat_season_1?.primary}/>
                            <Text style={{...rootStyle.font(18, chatStyle?.chat_season_1?.primary, fonts.semiBold)}}>2장</Text>
                        </View>

                        <View style={{ gap: 8 }}>
                            <Button 
                                type={16} 
                                containerStyle={[rootStyle.flex, { gap: 8 }]}
                                disabled={mbData?.flirting < 2} 
                                onPress={onPress}
                                frontIcon={'picket'}
                                frontIconStyle={[rootStyle.picket, { width: 25.5 }]}
                                frontIconTintColor={colors.white}
                            >
                                전달하기
                            </Button>
                            <Button 
                                type={17} 
                                containerStyle={[rootStyle.flex, { gap: 8 }]}
                                onPress={leaveAlert}
                                frontIcon={'leave2'}
                                frontIconStyle={rootStyle.default}
                                frontIconTintColor={colors.white}
                            >
                                소개팅 취소
                            </Button>
                        </View>
                    </View>
                </View>
            
                
            </Layout>
        </ImageBackground>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: chatStyle.chat_season_1.primary,
            textDecorationLine: 'underline'
        },

        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: chatStyle.chat_season_1.primary,
            backgroundColor: colors.white,

            marginVertical: 31
        },
    })
  
    return { styles }
}
