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
import BalloonSystemPicket from '@/components/chat/BalloonSystemPicket';
import BalloonSystemSuperPicket from '@/components/chat/BalloonSystemSuperPicket';
import BalloonSystemSummerBtn from '@/components/chat/BalloonSystemSummerBtn';
import BalloonSystemSummerAnswerBtn from '@/components/chat/BalloonSystemSummerAnswerBtn';
import BalloonSystemFallBtn from '@/components/chat/BalloonSystemFallBtn';
import BalloonSystemWinterBtn from '@/components/chat/BalloonSystemWinterBtn';
import BalloonSystemWinterFinalBtn from '@/components/chat/BalloonSystemWinterFinalBtn';
import BalloonSystemCouple from '@/components/chat/BalloonSystemCouple';
import BalloonSystemFinalWait from '@/components/chat/BalloonSystemFinalWait';
import BalloonSystemFinalSelect from '@/components/chat/BalloonSystemFinalSelect';
import BalloonSystemFinalResult from '@/components/chat/BalloonSystemFinalResult';
import BalloonSystemFinalResultReport from '@/components/chat/BalloonSystemFinalResultReport';
import BalloonSystemFinalReview from '@/components/chat/BalloonSystemFinalReview';
import BalloonSystemReviewWait from '@/components/chat/BalloonSystemReviewWait';
import BalloonSystemFinalPhone from '@/components/chat/BalloonSystemFinalPhone';

// 픽켓
import BalloonSystemPicketBtn from '@/components/chat/BalloonSystemPicketBtn';
import BalloonSystemSuperPicketBtn from '@/components/chat/BalloonSystemSuperPicketBtn';

// 전화예약
import BalloonSystemReserveCall from '@/components/chat/BalloonSystemReserveCall';

// 종료
import BalloonSystemFinalPhotos from '@/components/chat/BalloonSystemFinalPhotos';

// 소개팅 취소
import BalloonSystemLeave from '@/components/chat/BalloonSystemLeave';
import BalloonSystemLeaveBtn from '@/components/chat/BalloonSystemLeaveBtn';
import BalloonSystemSendHeartBtn from '@/components/chat/BalloonSystemSendHeartBtn';
import BalloonSystemSendHeartSuccess from '@/components/chat/BalloonSystemSendHeartSuccess';
import BalloonSystemReceiveHeartBtn from '@/components/chat/BalloonSystemReceiveHeartBtn';
import BalloonSystemRematchProfile from '@/components/chat/BalloonSystemRematchProfile';
import BalloonSystemRematchFail from '@/components/chat/BalloonSystemRematchFail';
import BalloonSystemRefundSuccess from '@/components/chat/BalloonSystemRefundSuccess';
import BalloonSystemFinalEnd from '@/components/chat/BalloonSystemFinalEnd';
import BalloonSystemFinalEndUser from '@/components/chat/BalloonSystemFinalEndUser';
import BalloonSystemUserLeave from '@/components/chat/BalloonSystemUserLeave';
import BalloonSystemRefundUserLeave from '@/components/chat/BalloonSystemRefundUserLeave';

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
    room,
    viewables
}) {

    const { styles } = useStyle();
  
    return (
        <View
            style={[styles.item, { flex: 1, marginTop: 20 }]}
        >
            {/* <Text>{item?.data?.type}</Text> */}
            
            {item?.data?.type === 'profileViewBtn' ? (
                <BalloonSystemProfile item={item} users={users} chatTheme={chatTheme}/>  // 회원 프로필
            ) : item?.data?.type === 'springBtn' ? (
                <BalloonSystemSpringBtn item={item} chatTheme={chatTheme}/> // 블라썸 작성 버튼
            ) : item?.data?.type === 'picketBtn' ? (
                <BalloonSystemPicket item={item} chatTheme={chatTheme}/> // 픽켓 소개
            ) : item?.data?.type === 'superPicketBtn' ? (
                <BalloonSystemSuperPicket item={item} chatTheme={chatTheme}/> // 슈퍼픽켓 소개
            ) : item?.data?.type === 'summerBtn' ? (
                <BalloonSystemSummerBtn item={item} chatTheme={chatTheme}/> // 여름의 밤 작성 버튼
            ) : item?.data?.type === 'summerAnswerBtn' ? (
                <BalloonSystemSummerAnswerBtn item={item} chatTheme={chatTheme}/> // 여름의 밤 답변하기 버튼
            ) : item?.data?.type === 'fallBtn' ? (
                <BalloonSystemFallBtn item={item} chatTheme={chatTheme}/> // 수확의 가을 확인하러가기 버튼
            ) : item?.data?.type === 'winterBtn' ? (
                <BalloonSystemWinterBtn item={item} chatTheme={chatTheme}/> // 선택의 겨울 확인하러가기 버튼
            ) : item?.data?.type === 'finalInfoTime' ? (
                <BalloonSystemWinterFinalBtn item={item} chatTheme={chatTheme} room={room}/> // 최종 선택 남은시간 타이머
            ) : item?.data?.type === 'sendFlirting' ? (
                <BalloonSystemPicketBtn item={item} users={users} chatTheme={chatTheme} room={room} /> // 픽켓 수령하기 버튼
            ) : item?.data?.type === 'sendSuperFlirting' ? (
                <BalloonSystemSuperPicketBtn item={item} users={users} chatTheme={chatTheme} room={room} /> // 슈퍼픽켓
            ) : item?.data?.type === 'reservationCall' ? (
                <BalloonSystemReserveCall item={item} users={users} chatTheme={chatTheme} room={room} /> // 전화예약
            ) : item?.data?.type === 'endPhoto' ? (
                <BalloonSystemFinalPhotos item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정후 사진 리스트
            ) : item?.data?.type === 'finalWait' ? (
                <BalloonSystemFinalWait item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정후 대기중
            ) : item?.data?.type === 'finalSelect' ? (
                <BalloonSystemFinalSelect item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정 코멘트
            ) : item?.data?.type === 'finalDone' ? (
                <BalloonSystemFinalResult item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정 결과
            ) : item?.data?.type === 'reportBtn' ? (
                <BalloonSystemFinalResultReport item={item} users={users} chatTheme={chatTheme} room={room} /> // 1%회원 결정후 최종 전달 픽켓 
            ) : item?.data?.type === 'finalReview' ? (
                <BalloonSystemFinalReview item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정 리뷰
            ) : item?.data?.type === 'reviewWait' ? (
                <BalloonSystemReviewWait item={item} users={users} chatTheme={chatTheme} room={room} /> // 결정 리뷰 대기중
            ) : item?.data?.type === 'phoneBtn' ? (
                <BalloonSystemFinalPhone item={item} users={users} chatTheme={chatTheme} room={room} /> // 전화번호 버튼
            ) : item?.data?.type === 'coupleBtn' ? (
                <BalloonSystemCouple item={item} users={users} chatTheme={chatTheme} room={room} /> // 최종 커플 탄생 알림
            ) : item?.data?.type === 'refundInfoBtn' ? (
                <BalloonSystemLeaveBtn item={item} users={users} chatTheme={chatTheme} room={room} /> // 소개팅 취소함(환불금액 있음)
            ) : item?.data?.type === 'chatLeft' ? (
                <BalloonSystemLeave item={item} users={users} chatTheme={chatTheme} room={room} /> // 소개팅 취소함(환불금액 없음)
            ) : item?.data?.type === 'sendNoteBtn' ? (
                <BalloonSystemSendHeartBtn item={item} users={users} chatTheme={chatTheme} room={room} /> // 1%회원 마음전하기
            ) : item?.data?.type === 'sendNote' ? (
                <BalloonSystemSendHeartSuccess item={item} users={users} chatTheme={chatTheme} room={room} /> // 1%회원 마음전하기 완료
            ) : item?.data?.type === 'receiveNoteBtn' ? (
                <BalloonSystemReceiveHeartBtn item={item} users={users} chatTheme={chatTheme} room={room} /> // 선택회원 마음 도착
            ) : item?.data?.type === 'chatResumed' ? (
                <BalloonSystemRematchProfile item={item} users={users} chatTheme={chatTheme} room={room} /> // 마음받아서 재연결
            ) : item?.data?.type === 'chatRefundConfirmed' ? (
                <BalloonSystemRematchFail item={item} users={users} chatTheme={chatTheme} room={room} /> // 1%회원 마음전하기 실패
            ) : item?.data?.type === 'chatRefundCompleted' ? (
                <BalloonSystemRefundSuccess item={item} users={users} chatTheme={chatTheme} room={room} /> // 환불 성공
            ) : item?.data?.type === 'chatEndedForVisual' ? (
                <BalloonSystemFinalEnd item={item} users={users} chatTheme={chatTheme} room={room} /> // 1%회원 최종 종료
            ) : item?.data?.type === 'chatEndedForUser' ? (
                <BalloonSystemFinalEndUser item={item} users={users} chatTheme={chatTheme} room={room} /> // 선택회원 환불0원 최종 종료
            ) : item?.data?.type === 'disabledMessage' ? (
                <BalloonSystemUserLeave item={item} users={users} chatTheme={chatTheme} room={room} /> // 상대회원 정지/탈퇴 됨
            ) : item?.data?.type === 'stopMessageForUser' ? (
                <BalloonSystemRefundUserLeave item={item} users={users} chatTheme={chatTheme} room={room} /> // 선택회원 상대방 정지/탈퇴여서 환불정보 입력

            ) : (
                <View style={[styles.itemBallonSystem, { backgroundColor: chatTheme?.systemBackgroundColor }]}>
                    <Text style={[styles.itemBallonSystemText, { color: chatTheme?.primary }, item?.data?.type === 'bold' && { fontFamily: fonts.semiBold } ]}>{item?.message}</Text>
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