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

import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeInRight, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
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
import chatStyle from '@/libs/chatStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';

import API from '@/libs/api';

export default function Page({ item }) {

    const { 
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { configOptions } = useConfig();
    
    const iref = useRef(null);

    
    const [type, setType] = useState(null);
    const [flirting, setFlirting] = useState(0);
    const [todayFlirting, setTodayFlirting] = useState(0);
    const [target, setTarget] = useState(null);

    const [input, setInput] = useState("");
    const [comment, setComment] = useState("");
    const [commentDesc, setCommentDesc] = useState("");

    const [toggle, setToggle] = useState(false);
    

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    const [error, setError] = useState(null);

    useFocusEffect(
        useCallback(() => {
            roomInfo();
        }, [roomIdx])
    );

    // useEffect(() => {
    //     roomInfo();
    // }, [roomIdx])

    useEffect(() => {

        setError("");

    }, [input])

    useEffect(() => {

        setDisabled( !(input > 0 ) );

    }, [input])

    const roomInfo = async () => {

        let sender = {
            roomIdx: roomIdx
        }
        
        const { data, error } = await API.post('/v1/chat/sendInfo', sender);

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        console.log('sendInfo', data);

        setType(data?.type);
        setFlirting(data?.flirting); // 내가 가지고있고, 가용 가능한 있는
        setTodayFlirting(data?.usageCount); // 이 방에서 전달 가능 개수
        setTarget(data?.targetUser);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay);
    }

    const submitFunc = async () => {
        if(load) return;
        
        Keyboard.dismiss();

        if(input*1 > flirting) {
            ToastMessage('보유 픽켓이 부족합니다.');
            return;
        }
        if(input*1 > todayFlirting) {
            ToastMessage(`선물 가능한 픽켓은 최대 ${numFormat(todayFlirting)}장 입니다.`);
            return;
        }
      
        setLoad(true);

        let sender = {
            roomIdx: roomIdx,
            count: input*1
        }
        
        const { data, error } = await API.post('/v1/chat/sendFlirting', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            openAlertFunc({
                icon: images.alert_info,
                label: type === 2 ? `슈퍼 픽켓을 ${numFormat(input*1)}장 추가했습니다.` : `${target?.name}님에게 픽켓을 ${numFormat(input*1)}장 전달했습니다.`,
                onPressText: '확인하기',
                onPress: () => {
                    router.dismissTo({
                        pathname: routes.chatRoom,
                        params: {
                            idx: roomIdx
                        }
                    })
                }
            })
            
        }, consts.apiDelay);

    }
 
    const header = {
        titleStyle: {
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.bold,
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
        <Layout header={{
            ...header, 
            title: type === 1 ? '픽켓 선물' : type === 2 ? '슈퍼 픽켓' : '',
            titleIcon: {
                icon: type === 1 ? 'picket_send' : type === 2 ? 'super_picket' : '',
                style: {
                    width: 26,
                    height: 26,
                }, 
            }
        }} >

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={50}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"never"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingBottom: insets?.bottom + 100,
                }}
            >
                <View style={{ flex: 1, paddingHorizontal: rootStyle.side, paddingTop: rootStyle.side, gap: 26 }}>
                    <View style={styles.profileBox}>
                        <Image source={images.picket} style={[rootStyle.picket, { width: 23 }]}/>
                        <Text style={[styles.itemName]} numberOfLines={1} >
                            {type === 1 ? `${target?.name}님에게 픽켓 몇 장을 선물하시겠어요?` : `슈퍼 픽켓으로 몇 장을 선물하시겠어요?`}
                            
                        </Text>
                    </View>

                    <View style={{ gap: 7 }}>
                        <ListText style={styles.infoBoxText2}>{`선물 가능한 픽켓 갯수 : `}
                            <Text style={[styles.infoBoxText2, { color: colors.dark, fontFamily: fonts.semiBold }]}>{numFormat(todayFlirting)}{`장`}</Text>
                        </ListText>
                        <ListText style={styles.infoBoxText2}>{`내가 보유한 픽켓 갯수 : `}
                            <Text style={[styles.infoBoxText2, { color: colors.dark, fontFamily: fonts.semiBold}]}>{numFormat(flirting)}{`장`}</Text>
                        </ListText>
                    </View>

                    <View style={{ gap: 8 }}>
                        <InputFlirting 
                            valid={'number'}
                            name={'input'}
                            state={input} 
                            setState={setInput} 
                            placeholder={`0`} 
                            max={Math.min(flirting, todayFlirting)}
                        />
                    </View>

                    <View style={{ gap: 11 }}>
                        <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                            <Image source={images.alert_info} style={rootStyle.default} tintColor={colors.picket_message}/>
                            <Text style={{...rootStyle.font(14, colors.picket_message, fonts.regular)}}>픽켓을 전달하기 전 확인해 주세요!</Text>
                        </View>

                        {type === 1 ? (
                            <View style={styles.infoBox}>
                                <ListText style={styles.infoBoxText}>{`픽켓은 소개팅 중 동일 인물에게 4장까지 전달 가능해요.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`1% 회원은 픽켓은 1장 기준,\n수수료를 제외한 50%의 금액으로 환전 가능합니다.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`픽켓을 상대방에게 전달 한 후 1% 회원이 6시간 동안 받기를 누르지 않으면 선택 회원님께 픽켓이 다시 돌아와요.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`픽켓 4장을 모두 전달하면 해당 기능이 슈퍼 픽켓으로 변경되며 소개팅 종료후 만남 인증시 1% 회원이 픽켓을 수령 받을 수 있습니다.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`슈퍼 픽켓은 만남 인증이 되지 않을 시 수령 받을 수 없습니다.`}</ListText>
                            </View>
                        ) : (
                            <View style={styles.infoBox}>
                                <ListText style={styles.infoBoxText}>{`만남 인증 시 픽켓이 상대방에게 전달 됩니다.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`슈퍼 픽켓은 1장 단위로 최대 36장까지 전달 가능해요.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`1% 회원은 픽켓은 1장 기준,\n수수료를 제외한 50%의 금액으로 환전 가능합니다.`}</ListText>
                                <ListText style={styles.infoBoxText}>{`최종 선택이 성사되지 않으면 슈퍼 픽켓은 100% 되돌아옵니다.`}</ListText>
                            </View>
                        )}
                        
                    </View>

                    
                </View>

            </KeyboardAwareScrollView>

            <Button bottom type={'2'} onPress={submitFunc} disabled={disabled} load={load}>선물하기</Button>
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
        profileBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5      
        },
        itemImage: {
            width: 36,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemName: {
            color: colors.main,
            fontFamily: fonts.semiBold,
            fontSize: width <= 320 ? 14 : 18,
            lineHeight: 24,
            letterSpacing: -0.4
        },
        itemFlirting: {
            color: colors.grey9,
            fontFamily: fonts.semiBold,
            fontSize: 20,
            letterSpacing: -0.5
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingHorizontal: 24,
            height: 40,
            borderRadius: 8
        },
        buttonText: {
            color: colors.white,
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
        toggle: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.greyD,
            height: 44,
            borderRadius: 8
        },
        toggleText: {
            color: colors.dark,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
        toggleList: {
            paddingHorizontal: 19,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 8
        },
        list: {
            borderTopColor: colors.greyD,
            borderTopWidth: 0.5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 46
        },
        listText: {
            color: colors.black,
            fontSize: 15,
            fontFamily: fonts.semiBold
        },
        infoText: {
            color: colors.main,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
        infoBox: {
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
            letterSpacing: -0.35
        },
        infoBoxText2: {
            color: colors.text_info,
            fontSize: 14,
            lineHeight: 22,
            letterSpacing: -0.35
        },
        error: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.red,
            textAlign: 'center',
        },
    })
  
    return { styles }
}
