import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Timer from '@/components/Timer';
import Text from '@/components/Text';

import { AnimatedText, AnimatedBackground } from '@/components/chatTheme/AnimatedColorComponents';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import rootStyle from '@/libs/rootStyle';

import { } from '@/libs/utils';

import { usePhotoPopup, useEtc } from '@/libs/store';

export default function Component({
    iref=null,
    autoFocus=false,
    name="",
    placeholder="",
    readOnlyPlaceHolder="",
    valid=null,
    maxLength=250,
    readOnly=false,
    isEnd=false,
    style={},
    state="",
    setState=()=>{},
    room=null,
    chatTheme,

    error={},
    setError=()=>{},
    onFocusFunc=()=>{},
    onBlurFunc=()=>{},
    onSubmitEditing=()=>{},
    sendMessage=() => {},
    sendPhoto=()=>{},
    onPressTicket=()=>{},
    onPressVoicetalk=()=>{},
    onPressCallReserve=()=>{},
    onPressVoiceMessage=()=>{},
}) {
    const { styles } = useStyle();

    const { openPhotoFunc } = usePhotoPopup();
    const { setAudioId } = useEtc();

    const [f, setF] = useState(false);

    useEffect(() => {
        if(autoFocus && iref) {
            setTimeout(() => {
                iref?.current?.focus();
            }, 500)
        }
    },[])

    const onChanged = (v) => {

        if(setError && typeof(error) === 'object') {
            setError({...error, [name]: ''});
        }

        if(valid === 'hp' || valid === 'number') {
            v = v.replace(/[^0-9]/g, '');
        }
        
        setState(v);
        
    }


    const onAction = () => {
        setAudioId(null);
        openPhotoFunc({
            setPhoto: (v) => sendPhoto(v),
            onPressTicket: onPressTicket,
            onPressVoicetalk: onPressVoicetalk,
            onPressCallReserve: onPressCallReserve,   
            onPressVoiceMessage: onPressVoiceMessage,
            selectionLimit: 12,
            chatTheme: chatTheme,
            room: room,
        })
    }

    return (
        <Animated.View style={[styles.root, style]} entering={FadeInDown}>
            {(!readOnly && !isEnd && room?.type !== 1) && (
                <TouchableOpacity onPress={onAction}>
                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={chatImages.chat_action} style={rootStyle.chat_action} tintColor={chatTheme?.primary} transition={200}/>
                    </AnimatedBackground>
                </TouchableOpacity>
            )}

            <View style={styles.container}>
                <View style={styles.inputWrap}>
                    <TextInput
                        ref={iref}
                        onFocus={(event) => {
                            setF(true);
                            onFocusFunc();
                        }}
                        onBlur={() => {
                            setF(false); 
                            onBlurFunc();
                        }}
                        value={state} //value}
                        onChangeText={v => {
                            onChanged(v);
                        }} //onChange}
                        style={[styles.input]}
                        placeholderTextColor={readOnly ? colors.grey70 : colors.greyC}
                        placeholder={readOnly ? (readOnlyPlaceHolder || '채팅창이 비활성화됩니다.') : placeholder}
                        onSubmitEditing={ () => {onSubmitEditing(); onBlurFunc();} }
                        maxLength={maxLength}
                        editable={!readOnly}
                        autoCapitalize={'none'}
                        textContentType={'oneTimeCode'}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        allowFontScaling={false}
                        hitSlop={{ top: 10, bottom: 10 }}
                    />
                </View>
            </View>

            {!readOnly && (
                <TouchableOpacity onPress={sendMessage}>
                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={chatImages.chat_send} style={{ width: 32, height: 32 }} tintColor={chatTheme?.primary} transition={200} />
                    </AnimatedBackground>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            paddingBottom: 12 + insets?.bottom,
            borderTopWidth: 1,
            borderTopColor: colors.greyE,
            gap: 8,
            backgroundColor: colors.white,
        },
        container: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            backgroundColor: colors.greyF1,
            borderRadius: 12,
            paddingVertical: 8,
            paddingLeft: width <= 320 ? 16 : 24,
            paddingRight: 12,
        },
        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 32,
        },
        input: {
            flex: 1,
            color: colors.dark,
            fontFamily: fonts.regular,
            fontSize: 16,
            minHeight: 20, // 최소 높이
            maxHeight: 100, // 최대 높이 제한
            paddingTop: 0, // 상단 패딩 제거
            paddingBottom: 0, // 하단 패딩 제거
        },
        watchBox: {
            position: 'absolute',
            
            right: 0,
            padding: 16.64
        },
        label: {
            height: 44,
            width: 64,
            backgroundColor: colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center'
        },
        labelText: {
            color: colors.white,
            fontFamily: fonts.semiBold
        },
            
        errMsg: {
            fontSize: 12,
            lineHeight: 14,
            color: colors.red,
            marginTop: -4
        },
    })
  
    return { styles }
}
