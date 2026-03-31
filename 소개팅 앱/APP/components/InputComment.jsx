import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { } from '@/libs/utils';

import { usePhotoPopup } from '@/libs/store';

export default function Component({
    iref=null,
    autoFocus=false,
    name="",
    placeholder="",
    valid=null,
    maxLength=100,
    readOnly=false,
    style={},
    state="",
    setState=()=>{},
    edit=null,
    editCencle=()=>{},
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


    return (
        <View style={[styles.root, style]}>
            <View style={styles.container}>
                <View style={styles.inputWrap}>
                    {edit && (
                        <Button type={5} onPress={editCencle} style={{ width: 'unset' }}>취소</Button>
                    )}
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
                        placeholderTextColor={colors.text_info}
                        placeholder={placeholder}
                        onSubmitEditing={ () => {onSubmitEditing(); onBlurFunc();} }
                        maxLength={maxLength}
                        editable={!readOnly}
                        autoCapitalize={'none'}
                        textContentType={'oneTimeCode'}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        allowFontScaling={false}
                        hitSlop={15}
                    />
                </View>

                <Icon style={styles.icon} img={images.send} imgStyle={{ width: 50, height: 50 }} onPress={sendMessage}/>
            </View>
        </View>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            paddingTop: 12,
            paddingBottom: 12 + insets?.bottom,
            paddingHorizontal: rootStyle.side,
            borderTopWidth: 1,
            borderTopColor: colors.greyE,
            gap: 8,
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            // backgroundColor: colors.greyF1,
        },
      
        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            paddingHorizontal: 12,
            gap: 10
        },
        input: {
            flex: 1,
            color: colors.dark,
            fontFamily: fonts.regular,
            fontSize: 14,
            paddingTop: 0, // 상단 패딩 제거
            paddingBottom: 0, // 하단 패딩 제거
        },
        icon: {
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
