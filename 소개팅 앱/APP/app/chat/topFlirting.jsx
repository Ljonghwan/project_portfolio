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
import Animated, { useSharedValue, FadeIn, FadeInRight, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';

export default function Page({ item }) {

    const { 
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();
    
    const iref = useRef(null);

    
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


    useEffect(() => {
        roomInfo();
    }, [roomIdx])

    useEffect(() => {

        setError(input > mbData?.flirting ? "보유 플러팅이 부족합니다." : "");

    }, [input])

    useEffect(() => {

        setDisabled( !(input && !error ) );

    }, [input, error])

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

        console.log('roominfo', data);

        setFlirting(data?.flirting);
        setTodayFlirting(data?.todayFlirting);
        setTarget(data?.targetUser);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay);
    }

    const submitFunc = async () => {
        
        if(load) return;
        
        if(input > mbData?.flirting) {
            setError('보유 개수가 부족합니다.');
            return;
        }

        setLoad(true);

        setTimeout(() => {
            setLoad(false);
            router.replace({
                pathname: routes.chatFinal,
                params: {
                    roomIdx: roomIdx,
                    sendFlirting: input
                }
            });
        }, consts.apiDelay);

    }
 
    const header = {
        title: 'TOP 플러팅 보내기',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }
            
            <View style={{ flex: 1, padding: 20, gap: 30 }}>
                <View style={styles.profileBox}>
                    <Image source={target?.profile ? consts.s3Url + target?.profile : images.profile} style={styles.itemImage}/>
                    <Text style={styles.itemName} numberOfLines={1} >{target?.name} 님에게 몇 개를 보낼까요?</Text>
                </View>

                <View style={[rootStyle.flex, { gap: 8 }]}>
                    <Image source={images.flirting} style={[rootStyle.flirting, { width: 12 }]}/>
                    <Text style={styles.itemFlirting}>
                        {`내가 보유한 플러팅 `}<Text style={[styles.itemFlirting, { color: colors.main }]}>{numFormat(mbData?.flirting)}</Text>{`개`}
                    </Text>
                </View>

                <View style={styles.buttonList}>
                    {[...Array(6)]?.map((x, i) => {
                        const value = (i + 1) * 50;
                        return (
                            <TouchableOpacity key={i} style={[styles.button, value === input && { borderColor: colors.main} ]} activeOpacity={0.7} onPress={() => { setInput(value) }}>
                                <Text style={[styles.buttonText, value === input && { color: colors.main } ]}>{value}개</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {error && (
                    <Animated.View entering={FadeInRight}>
                        <Text style={[styles.error]}>{error}</Text>
                    </Animated.View>
                )}

                <TouchableOpacity style={[styles.button, { width: '100%', gap: 4, borderColor: colors.main } ]} activeOpacity={0.7} onPress={() => { router.navigate(routes.paymentProduct) }}>
                    <Image source={images.flirting_main} style={[ rootStyle.flirting, { width: 12 }]}/>
                    <Text style={[styles.buttonText, { color: colors.main } ]}>플러팅 구매하기</Text>
                </TouchableOpacity>
                
            </View>

            
            <Button bottom type={'2'} onPress={submitFunc} disabled={disabled} load={load}>다음 단계로</Button>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        profileBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12      
        },
        itemImage: {
            width: 36,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemName: {
            color: colors.dark,
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4
        },
        itemFlirting: {
            color: colors.dark,
            fontFamily: fonts.semiBold,
            fontSize: 20,
            letterSpacing: -0.5
        },

        buttonList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4
        },
        button: {
            width: (width - 40 - 8.1) / 3,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 56,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.greyE
        },
        buttonText: {
            color: colors.grey9,
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4
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
            padding: 12,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 8,
            gap: 8
        },
        infoBoxText: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
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
