import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Keyboard } from 'react-native';

import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import ListText from '@/components/ListText';
import Loading from '@/components/Loading';

import Input from '@/components/Input';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useEtc, useUser } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { imageViewer, ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, room, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();
    
    const [review, setReview] = useState('');

    const [load, setLoad] = useState(false);


    const submitFunc = async () => {
        console.log('review', review);
        if(room?.status !== 1) return;
        if(load) return;

        Keyboard.dismiss();

        const inputReplace = review?.replace(/\s+/g, '');
        if (!review || inputReplace?.length < 1) {
            ToastMessage('소감을 입력해주세요.');
            return;
        }

        setLoad(true);

        setTimeout(async () => {
            
            let sender = {
                chatIdx: item?.idx,
                message: review
            };
    
            const { data, error } = await API.post('/v1/chat/finalReview', sender);
    
            console.log('error', error);
            setTimeout(() => {
    
                setLoad(false);
    
                if(error) {
                    ToastMessage(error?.message);
                    return;
                }
            
                ToastMessage('작성이 완료되었습니다.');
                setReview('');
                
            }, consts.apiDelay);

        }, consts.apiDelayLong);

    }
    
    return (
        <View style={[styles.root, { borderColor: chatTheme?.primary }]}>

            <Image source={images.chat_today} style={rootStyle.default26} transition={200} tintColor={chatTheme?.primary}/>

            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(16, colors.black, fonts.medium ), lineHeight: 20 }}>{item?.message}</AnimatedText>
            <AnimatedText color={chatTheme?.primary} style={{...rootStyle.font(14, colors.black, fonts.regular ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>{item?.data?.subMessage}</AnimatedText>

            {item?.data?.isWrite ? (
                <AnimatedBackground bg={colors.grey6} style={styles.button}>
                    <Text style={{...rootStyle.font(14, colors.white, fonts.medium ), letterSpacing: -0.5 }}>
                        {`소감을 작성하였습니다.`}
                    </Text>
                </AnimatedBackground>
            ) : (
                <View style={{ width: '100%' }}>
                    {load && <Loading color={colors.black} style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, paddingBottom: 0 }} fixed />}
                    <Input 
                        state={review} 
                        setState={setReview} 
                        // inputLabel={'핸드폰번호'}
                        placeholder={`소감을 간단하게 적어주세요.`} 
                        returnKeyType={"done"}
                        onSubmitEditing={submitFunc}
                        blurOnSubmit={false}

                        style={{ width: '100%' }}
                        inputWrapStyle={{ borderColor: chatTheme?.primary, borderRadius: 16 }}
                        inputWrapFocusStyle={{ borderColor: chatTheme?.primary }}
                        inputStyle={{ color: chatTheme?.primary, fontSize: 14 }}

                        iconComponent={
                            <TouchableOpacity style={{  }} activeOpacity={0.8} hitSlop={15} onPress={submitFunc}>
                                <Image source={images.voice_send} style={rootStyle.default20} transition={200} tintColor={chatTheme?.primary}/>
                            </TouchableOpacity>
                        }
                        readOnly={room?.status !== 1}
                        disabled={room?.status !== 1}
                    />
                </View>
            )}
            
          
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        root: {
            padding: 12,
            borderRadius: 24,
            gap: 16,
            borderWidth: 1,
            alignItems: 'center',
            backgroundColor: colors.white,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 16,
            width: '100%',
            height: 48,
        },
     
     
      
	})

  	return { styles }
}