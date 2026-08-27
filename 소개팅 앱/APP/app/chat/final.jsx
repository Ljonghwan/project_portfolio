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
  ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import ListText from '@/components/ListText';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import chatImages from '@/libs/chatImages';

import { ToastMessage, imageViewer } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';


export default function Page({  }) {

    const { roomIdx, superPicket } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const scRef = useRef(null);

    const [accept, setAccept] = useState(null);

    const submitFunc = async () => {
        if(typeof accept !== 'boolean') return;

        router.navigate({
            pathname: routes.chatFinalSend,
            params: {
                roomIdx: roomIdx,
                accept: accept ? 1 : 0
            }
        });
    }

    const header = {       
        title: "최종 결정", 
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'choice', 
            tintColor: colors.primary,
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingHorizontal: rootStyle.side,
                        paddingTop: rootStyle.side,
                        paddingBottom: insets.bottom + 100,
                    }}
                >
                    <View style={{ gap: 26 }}>
                        <View style={[ rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                            <Image source={images.final_icon_1} style={rootStyle.default20} />
                            <Text style={{...rootStyle.font(18, colors.primary, fonts.semiBold) }}>상대방과 더 대화하고 싶으신가요?</Text>
                        </View>

                        <View style={{ gap: 7 }}>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.5 }}>최종 결정을 하면 더 이상 수정할 수 없습니다. 신중히 결정해 주세요.</ListText>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.5 }}>수락 시 채팅방이 삭제되지 않고, 계속 대화를 할 수 있습니다.</ListText>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.5 }}>최종 커플이 되지 않으면 슈퍼 픽켓을 돌려 받습니다.</ListText>
                        </View>
                    </View>

                    <View style={{ marginTop: 53, alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.primary }}>
                        <Text style={{...rootStyle.font(18, colors.primary, fonts.bold), letterSpacing: -0.45 }}>이 소개팅에 걸린 슈퍼 픽켓</Text>
                        <View style={[rootStyle.flex, { alignItems: 'center', gap: 5 }]}>
                            <Image source={images.super_picket} style={[rootStyle.default28]}  />
                            <Text style={{...rootStyle.font(18, colors.primary, fonts.bold), letterSpacing: -0.45 }}>{superPicket}장</Text>
                        </View>
                    </View>

                    <View style={[rootStyle.flex, { marginTop: 26, gap: 10 }]}>
                        <TouchableOpacity 
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, height: 90, backgroundColor: accept ? colors.primary : colors.white, borderWidth: 1, borderColor: colors.primary, borderRadius: 24 }}
                            onPress={() => {
                                setAccept(true);
                            }}
                        >
                            <Image source={accept ? images.final_success_on : images.final_success_off} style={rootStyle.default36} transition={200}/>
                            <Text style={{...rootStyle.font(width <= 320 ? 14 : 16, accept ? colors.white : colors.primary, fonts.bold), letterSpacing: -0.4 }}>계속 대화할래요!</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, height: 90, backgroundColor: accept === false ? colors.grey6 : colors.white, borderWidth: 1, borderColor: colors.grey6, borderRadius: 24 }}
                            onPress={() => {
                                setAccept(false);
                            }}
                        >
                            <Image source={accept === false ? images.final_reject_on : images.final_reject_off} style={rootStyle.default36} transition={200}/>
                            <Text style={{...rootStyle.font(width <= 320 ? 14 : 16, accept === false ? colors.white : colors.grey6, fonts.bold), letterSpacing: -0.4 }}>더 대화하고 싶지 않아요.</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>

            <Button 
                bottom 
                onPress={submitFunc} 
                disabled={accept === null}
                icon={'link_white'}
                iconStyle={rootStyle.default20}
                containerStyle={[rootStyle.flex, {  gap: 2 }]}
            >
                다음으로
            </Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        paginationContainer: {
            width: '100%',
            alignItems: 'center',
        },
        pagination: {
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: rootStyle.side,
        },
        dot: {
            flex: 1,
            height: 8,
            borderRadius: 8,
            backgroundColor: colors.greyD9,
        },
        activeDot: {
            backgroundColor: colors.white,
        },

        indexPage: {
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: 'rgba(49, 49, 49, 0.72)',
            height: 24,
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 8,
            borderRadius: 1000
        },

        itemList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10, 
            overflow: 'hidden',
        },
        item: {
            width: '48.2%',            
            aspectRatio: "1/1",
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: colors.greyD9,
        },
        itemImage: {
            width: '100%',
            height: '100%'
        },
        box: {
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.primary,
        }

    })
  
    return { styles }
}
