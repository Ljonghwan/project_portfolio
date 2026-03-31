import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';

import Text from '@/components/Text';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import images from '@/libs/images';

import API from '@/libs/api';
import { useUser, useAlert } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';


export default function Component({ count, onPress=()=>{} }) {

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { closeAlertFunc } = useAlert();
    
    const handleClose = () => {
        closeAlertFunc();
    }

    const handleSubmit = async () => {
        handleClose();
        onPress();
    }
   

    return (
        <View 
            style={[styles.root]}
        >
            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                <Image source={images.exit} style={rootStyle.exit}/>
            </TouchableOpacity> */}
            
            <View style={{ gap: 20 }}>
                <View style={{ gap: 8 }}>
                    <View style={[ rootStyle.flex, { gap: 8 }]}>
                        <Image source={images.flirting} style={[rootStyle.flirting, { width: 12 }]}/>
                        <Text style={styles.label} >{'플러팅'}</Text>
                    </View>
                    <Text style={styles.title}>현재 이 소개팅에 플러팅 <Text style={[styles.title, { color: colors.dark, fontFamily: fonts.semiBold }]}>{count}</Text>개</Text>
                </View>

                <View style={styles.infoBox}>
                    {mbData?.level === 1 && (
                        <>
                            <ListText style={styles.infoText}>플러팅은 보내는 즉시 소진됩니다.</ListText>
                            <ListText style={styles.infoText}>플러팅을 상대방에게 전달 한 후 비주얼 회원이 6시간 동안 받기를 누르지 않으면 일반 회원님께 플러팅이 다시 돌아와요.</ListText>
                        </>
                    )}
                    <ListText style={styles.infoText}>비주얼 회원은 소개가 취소되면 환불 비율에 따라 플러팅 금액을 지급받습니다.</ListText>
                    <ListText style={styles.infoText}>소개팅 환불 발생 시 회사는 수수료의 개념으로 플러팅의 차액을 공제합니다.</ListText>
                </View>
            </View>

            {mbData?.level === 1 ? (
                <View style={styles.buttonBox}>
                    <Button style={{ flex: .6 }} type={4} onPress={handleClose}>취소</Button>
                    <Button style={{ flex: 1 }} type={3} onPress={handleSubmit}>플러팅 보내기</Button>
                </View>
            ) : (
                <View style={styles.buttonBox}>
                    <Button style={{ flex: 1 }} type={4} onPress={handleClose}>확인</Button>
                </View>
            )}
            
        </View >
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 16, 
            paddingBottom: 16,
            gap: 24
        },
        label: {
            fontSize: 20,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            letterSpacing: -0.5
        },
        title: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey9,
            textAlign: 'center',
            letterSpacing: -0.35
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },

        infoBox: {
            paddingTop: 20,
            paddingHorizontal: 5,
            borderTopColor: colors.greyE,
            borderTopWidth: 1
        },
        infoText: {
            fontSize: 12.5,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.625
        }
    })
  
    return { styles }
}
