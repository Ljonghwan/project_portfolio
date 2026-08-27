import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';


// NEW
import BalloonSystemProfile from '@/components/chat/BalloonSystemProfile';
import BalloonSystemSpringBtn from '@/components/chat/BalloonSystemSpringBtn';


// 프리뷰 챗
import BalloonSystemFeedBackButton from '@/components/chat/BalloonSystemFeedBackButton';
import BalloonSystemFeedBack from '@/components/chat/BalloonSystemFeedBack';
import BalloonSystemFreeFinish from '@/components/chat/BalloonSystemFreeFinish';
import BalloonSystemFreeRetry from '@/components/chat/BalloonSystemFreeRetry';
import BalloonSystemFreeRetryConfirm from '@/components/chat/BalloonSystemFreeRetryConfirm';
import BalloonSystemFreeDone from '@/components/chat/BalloonSystemFreeDone';


// 소개팅 방
import BalloonSystemFlirting from '@/components/chat/BalloonSystemFlirting';
import BalloonSystemTimeCapsule from '@/components/chat/BalloonSystemTimeCapsule';
import BalloonSystemTimeCapsuleButton from '@/components/chat/BalloonSystemTimeCapsuleButton';
import BalloonSystemTimeCapsuleSuccess from '@/components/chat/BalloonSystemTimeCapsuleSuccess';
import BalloonSystemTimeCapsuleFirstOpen from '@/components/chat/BalloonSystemTimeCapsuleFirstOpen';
import BalloonSystemFinalTime from '@/components/chat/BalloonSystemFinalTime';
import BalloonSystemFinalSelect from '@/components/chat/BalloonSystemFinalSelect';
import BalloonSystemFinalTopFlirting from '@/components/chat/BalloonSystemFinalTopFlirting';
import BalloonSystemFinalSelectTop from '@/components/chat/BalloonSystemFinalSelectTop';
import BalloonSystemFinalPhotos from '@/components/chat/BalloonSystemFinalPhotos';
import BalloonSystemFinalPhone from '@/components/chat/BalloonSystemFinalPhone';
import BalloonSystemFinalTimeCapsule from '@/components/chat/BalloonSystemFinalTimeCapsule';

// 리매치
import BalloonSystemRematchDone from '@/components/chat/BalloonSystemRematchDone';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { imageViewer } from '@/libs/utils';
import fonts from '@/libs/fonts';

dayjs.locale('ko');

export default function Component({ 
    item, 
    isMe, 
    isLast, 
    leaveAlert, 
    lottiePlay,
    users,
    chatTheme,
    viewables
}) {

    const { styles } = useStyle();


    return (
        <View
            style={[styles.item, { flex: 1, marginTop: 20 }]}
        >
            {item?.data?.type === 'profileViewBtn' ? (

                <BalloonSystemProfile item={item} users={users} chatTheme={chatTheme}/>  // 회원 프로필

            ) : item?.data?.type === 'springBtn' ? (
                <BalloonSystemSpringBtn item={item} chatTheme={chatTheme}/> // 스프링 버튼
            ) : item?.data?.type === 'picketBtn' ? (
                <BalloonSystemSpringBtn item={item} chatTheme={chatTheme}/> // 스프링 버튼
            ) 
            
            
            
            
            
            
            
            
            




            
            : item?.data?.type === 'userInfo' ? (

                <BalloonSystemProfile item={item} users={users}/>  // 회원 프로필

            ) : item?.data?.type === 'feedbackBtn' ? (

                <BalloonSystemFeedBackButton item={item}/> // 피드백 작성하기 버튼

            ) : item?.data?.type === 'feedback' ? (

                <BalloonSystemFeedBack item={item} isMe={isMe} users={users}/> // 피드백 내용 블러되서 보이는거

            ) : item?.data?.type === 'freeFinish' ? (

                <BalloonSystemFreeFinish item={item} isLast={isLast}/> // 소개팅 진행여부 사양 or 수락 (탑비주얼 회원)

            ) : item?.data?.type === 'retryFinish' ? (

                <BalloonSystemFreeRetry item={item} isLast={isLast} leaveAlert={leaveAlert} /> // 소개팅 상대가 거절, 재요청 버튼 (일반회원)

            ) : item?.data?.type === 'retryBtn' ? (

                // <BalloonSystemFreeRetryConfirm item={item} isLast={isLast} /> // 상대가 재요청 했음 사양 or 수락(탑비주얼 회원)
                <BalloonSystemFreeFinish item={item} isLast={isLast}/> // 상대가 재요청 했음 사양 or 수락 (탑비주얼 회원)

            ) : item?.data?.type === 'acceptBtn' ? (

                <BalloonSystemFreeRetryConfirm item={item} isLast={isLast}/> // 상대가 수락했음 사양 or 최종수락(일반회원)

            ) : item?.data?.type === 'confirmMessage' ? (

                <BalloonSystemFreeDone item={item} isLast={isLast} leaveAlert={leaveAlert} /> // 최종수락 했고, 소개팅 확정 or 플러팅 구매하기 (일반회원)

            ) : item?.data?.type === 'timeCapsule' ? (
                
                <BalloonSystemTimeCapsule item={item} isMe={isMe} /> // 일차별 타임캡슐 코멘트

            ) : item?.data?.type === 'timeCapsuleBtn' ? (

                <BalloonSystemTimeCapsuleButton item={item} isMe={isMe}/> // 일차별 타임캡슐 작성 버튼

            ) : item?.data?.type === 'timeCapsuleSaveFirst' ? (

                <BalloonSystemTimeCapsuleSuccess item={item} isMe={isMe}/> // 일차별 타임캡슐 작성 완료 메시지

            ) : item?.data?.type === 'timeCapsuleOpen' ? (

                <BalloonSystemTimeCapsuleFirstOpen item={item} isMe={isMe} /> // 첫인상 타임캡슐 개봉

            ) : item?.data?.type === 'sendFlirting' ? (

                <BalloonSystemFlirting item={item} lottiePlay={lottiePlay} users={users} /> // 플러팅 받기, 받았습니다
               
            ) : item?.data?.type === 'finalInfoTime' ? ( 
                
                <BalloonSystemFinalTime item={item} time={item?.data?.time} isMe={isMe}/> // 결정의날 남은시간 타이머

            ) : item?.data?.type === 'finalSelect' ? ( 
                
                <BalloonSystemFinalSelect item={item} users={users}/> // 결정의날 선택 결괴(일반회원)

            ) : item?.data?.type === 'finalSelectFlirting' ? ( 
                
                <BalloonSystemFinalTopFlirting item={item} users={users}/> // 결정의날 탑 플러팅 보냄(일반회원)

            ) : item?.data?.type === 'finalSelectVisual' ? (

                <BalloonSystemFinalSelectTop item={item} users={users}/> // 결정의날 선택 결괴(탑비주얼)

            ) : item?.data?.type === 'endPhoto' ? (

                <BalloonSystemFinalPhotos item={item} /> // 결정의날 소개팅 사진들(탑비주얼)

            ) : item?.data?.type === 'phoneBtn' ? (

                <BalloonSystemFinalPhone item={item} /> // 결정의날후 탑비주얼의 소개팅 사진들

            ) : item?.data?.type === 'reportBtn' ? (

                <BalloonSystemFinalTimeCapsule item={item} /> // 결정의날후 타임탭슐 확인하기 버튼
                
            ) : item?.data?.type === 'rematchDone' ? (

                <BalloonSystemRematchDone item={item} isLast={isLast} /> // 최종수락 했고, 리매치 확정 or 플러팅 구매하기 (일반회원)

            ) : (

                <View style={styles.itemBallonSystem}>
                    <Text style={[styles.itemBallonSystemText, item?.data?.type === 'bold' && { fontFamily: fonts.semiBold } ]}>{item?.message}</Text>
                </View>
            )}
           
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
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.system,
            borderRadius: 12,
            flex: 1,
            gap: 12
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            textAlign: 'center'
        },
        buttonBox: {
            maxWidth: '80%',
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8 
        }
	})

  	return { styles }
}