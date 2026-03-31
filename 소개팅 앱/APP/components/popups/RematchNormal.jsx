import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
    Keyboard,
    Alert
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import Animated, { FadeInRight } from 'react-native-reanimated';

import Text from '@/components/Text';
import Input from '@/components/Input';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';


import API from '@/libs/api';
import { useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';
import images from '@/libs/images';

export default function Component({ item, time=null, pay }) {

    const { styles } = useStyle();

    const { closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const [input, setInput] = useState("");
    const [error, setError] = useState("");

    const handleClose = () => {
        closeAlertFunc();
    }

    const handleSubmit = async () => {

        Keyboard.dismiss();

        const inputReplace = input?.replace(/\s+/g, '');

        if(!inputReplace || inputReplace?.length < 1) {
            Alert.alert('알림', '리매치 사유를 입력 해 주세요');
            return;
        }

        // 주선비용 결제 페이지로 이동
        handleClose();

        router.navigate({
            pathname: routes.paymentRematch,
            params: {
                idx: item?.idx,
                comment: input,
                price: pay?.price,
                productIdx: pay?.idx
            }
        })
    }
   

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss() }>
            <ImageBackground 
                source={images.pop_bg}
                style={[styles.root]}
            >
                {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                    <Image source={images.exit} style={rootStyle.exit}/>
                </TouchableOpacity> */}
                
                <View style={{ gap: 20 }}>
                  
                    <View style={{ gap: 20, alignItems: 'center' }}>
                        <View style={{ gap: 12, alignItems: 'center' }}>
                            <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile } style={styles.profile} />
                            <Text style={styles.label} >
                                <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>{item?.user?.name}</Text>
                                {'님과의 리매치를\n진행하시겠습니까?'}
                            </Text>
                        </View>

                        <View style={{ width: '100%' }}>
                            <Input 
                                name={'input'}
                                state={input} 
                                setState={setInput} 
                                placeholder={`리매치 사유를 작성해 주세요.`} 
                                returnKeyType={"done"}
                                blurOnSubmit={false}
                                maxLength={100}
                            />
                        </View>
                    </View>
                </View>
                
                <View style={styles.buttonBox}>
                    <TouchableOpacity style={styles.button} onPress={handleClose}>
                        <Text style={styles.buttonCencleText}>아니오</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.main }]} onPress={handleSubmit}>
                        <Text style={styles.buttonOkText}>주선 비용 결제하기</Text>
                        {/* <View style={[rootStyle.flex ]}>
                            <Text style={styles.buttonOkText}>25</Text>
                            <Image source={images.discount} style={rootStyle.default14} />
                            <Text style={styles.buttonOkText}>할인</Text>
                        </View> */}
                        <Text style={[styles.buttonOkText, { fontSize: 16 }]}>{numFormat(pay?.price)}원</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground >
        </TouchableWithoutFeedback>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            padding: 24,
            gap: 24
        },
        label: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.dark,
            textAlign: 'center',
            letterSpacing: -0.4
        },
        title: {
            fontSize: 20,
            color: colors.dark,
            textAlign: 'center',
            letterSpacing: -0.55,
            fontFamily: fonts.semiBold
        },
        timer: {
            borderRadius: 100,
            backgroundColor: colors.white,
            paddingHorizontal: 12,
            height: 28,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
        },
        timerText: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.main,
            letterSpacing: -0.4,
            fontFamily: fonts.medium
        },

        infoBox: {
            alignItems: 'center'
        },
        profile: {
            width: 80,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },

        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        button: {
            flex: 1,
            backgroundColor: colors.greyE,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
            borderRadius: 8,
            paddingVertical: 10
        },
        buttonCencleText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            textAlign: 'center',
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold
        },
        buttonOkText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.white,
            textAlign: 'center',
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold
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
