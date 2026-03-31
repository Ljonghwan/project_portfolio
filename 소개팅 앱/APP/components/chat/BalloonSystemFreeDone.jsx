import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import ListText from '@/components/ListText';
import Button from '@/components/Button';
import Icon from '@/components/Icon';


import { useUser, useAlert, useLoader, useConfig } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import chatStyle from '@/libs/chatStyle';

import API from '@/libs/api';

import { numFormat, ToastMessage } from '@/libs/utils';

const chatTheme = chatStyle?.[`chat_season_1`];

export default function Component({ item, isLast, leaveAlert }) {

    const { styles } = useStyle();
    const { openAlertFunc } = useAlert();
    const { mbData } = useUser();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const [ agree, setAgree ] = useState(false);
    const [ view, setView ] = useState(false);
    
    const [ load, setLoad ] = useState(false);

    const exitAlert = () => {
        
    }
    const onPress = async () => {
        router.navigate({
            pathname: routes.chatPreviewSend,
            params: {
                roomIdx: item?.roomIdx,
            }
        })
        return;

        openLoader();

        let sender = {
            roomIdx: item?.roomIdx,
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
                router.replace({
                    pathname: routes.chatRoom,
                    params: {
                        idx: data?.idx,
                    }
                })
            }, 500)
            
        }, consts.apiDelay);

    }

    const onPressReject = async () => {
        const type = consts.chatWriteOptions?.find(x => x.value === 3);
        router.navigate({
            pathname: routes.chatWriteForm,
            params: {
                roomIdx: item?.roomIdx,
                type: type?.apiType,
                title: type?.title
            }
        })
    }
   
    return (
        <View style={styles.itemBallonSystem}>
            <Image source={chatImages.chat_info} style={{ width: 16, height: 15, alignSelf: 'center', marginBottom: 8 }} />

            <Text style={{...rootStyle.font(16, colors.dark, fonts.semiBold), textAlign: 'center', lineHeight: 24 }}>{item?.message}</Text>

            <Text style={{...rootStyle.font(14, colors.dark, fonts.regular), textAlign: 'center', lineHeight: 20 }}>
                {`소개팅 확정시 `}
                <Text style={{...rootStyle.font(14, colors.dark, fonts.semiBold), textAlign: 'center'}}>픽켓 2장</Text>
                {`을 1% 회원에게 전달합니다.`}
            </Text>

            <Text style={{ ...rootStyle.font(12, colors.text_info, fonts.regular ), lineHeight: 20, textAlign: 'center' }}>• 환불 정책 및 픽켓 안내 항목을 확인하지 않으면 소개팅을 진행 할 수 없습니다.</Text>
            {/* <ListText style={{...rootStyle.font(12, colors.text_info, fonts.regular), lineHeight: 20 }}>환불 정책 및 픽켓 안내 항목을 확인하지 않으면 소개팅을 진행 할 수 없습니다.</ListText> */}

            <TouchableOpacity style={styles.info} activeOpacity={0.8} onPress={() => setView(!view)}>
                <View style={[rootStyle.flex, { gap: 4, justifyContent: 'space-between' }]}>
                    <Image source={ view ? chatImages.chat_up : chatImages.chat_down} style={rootStyle.default16} transition={100}/>
                    <Text style={{...rootStyle.font(14, chatTheme.primary, fonts.regular), textAlign: 'center'}}>환불 정책 및 픽켓 안내</Text>
                    <TouchableOpacity hitSlop={10} onPress={() => setAgree(!agree)}>
                        <Image source={agree ? chatImages.chat_check_on : chatImages.chat_check_off} style={rootStyle.default} transition={100}/>
                    </TouchableOpacity>
                </View>
                {view && (
                    <>
                        <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 18, textAlign: 'center' }}>
                            {`주선료는 `}
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.semiBold)}}>{numFormat(item?.data?.price)}원</Text>
                            {`으로\n`}
                            {`동의 후 소개팅 시작시 `}
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.semiBold)}}>주선료 {100 - configOptions?.refundRatioOptions?.[1]}%</Text>
                            {`가 차감되며, `}
                            {`남은 `}
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.semiBold)}}>{configOptions?.refundRatioOptions?.[1]}%</Text>
                            {`에 대해서만 `}
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.semiBold)}}>환불</Text>
                            {`이 가능합니다.\n\n`}
                            {`환불 비율은 다음과 같습니다.`}
                        </Text>

                        <View style={styles.infoBox}>
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 22, textAlign: 'center' }}>
                                {`봄(1일차) 소개팅 종료 시 : `}<Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium)}}>{configOptions?.refundRatioOptions?.[1]}%</Text>
                            </Text>
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 22, textAlign: 'center' }}>
                                {`여름(2일차) 소개팅 종료 시 : `}<Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium)}}>{configOptions?.refundRatioOptions?.[2]}%</Text>
                            </Text>
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 22, textAlign: 'center' }}>
                                {`가을(3일차) 소개팅 종료 시 : `}<Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium)}}>{configOptions?.refundRatioOptions?.[3]}%</Text>
                            </Text>
                            <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 22, textAlign: 'center' }}>
                                {`겨울(4일차) 소개팅 종료 시 : `}<Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium)}}>{configOptions?.refundRatioOptions?.[4]}%</Text>
                            </Text>
                        </View>


                        <Text style={{...rootStyle.font(12, colors.text_sub, fonts.regular), lineHeight: 18, textAlign: 'center' }}>
                            {`픽켓 1장은 1만원의 가치를 가지고 있습니다.\n\n`}
                            {`1%회원은 픽켓 1장 기준,\n수수료를 제외한 50%의 금액으로 환전 가능합니다.\n\n`}
                            {`10시간 동안 아무런 행동이 없으면 자동 취소됩니다.`}
                        </Text>
                        <Text style={{...rootStyle.font(12, colors.text_sub, fonts.medium), lineHeight: 18, textAlign: 'center' }}>
                            {`본 픽켓은 1% 회원에게 전달 시 환불이 불가합니다.`}
                        </Text>

                    </>
                )}
            </TouchableOpacity>

            <View style={{ gap: 8 }}>
                <Button 
                    type={16} 
                    containerStyle={[rootStyle.flex, { gap: 8 }]}
                    disabled={!agree} 
                    onPress={onPress}
                    frontIcon={'picket'}
                    frontIconStyle={[rootStyle.picket, { width: 25.5 }]}
                    frontIconTintColor={colors.white}
                >
                    동의 후 소개팅 시작
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
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        item: {
            flex: 1,
        },
        itemBallonSystem: {
            padding: 12,
            backgroundColor: colors.white,
            borderRadius: 24,
            borderWidth: 0.5,
            borderColor: chatTheme?.primary,
            flex: 1,
            gap: 16
        },
        itemBallonSystemText: {
            fontSize: 14,
        },
        info: {
            padding: 12,
            backgroundColor: colors.white,
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: chatTheme?.primary,
            gap: 18
        },
        infoBox: {
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 0.5,
            borderColor: chatTheme?.primary,
            backgroundColor: colors.ffefef,
        }
      
        
	})

  	return { styles }
}