import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { } from '@/libs/utils';

import { usePhotoPopup } from '@/libs/store';
import { Pressable } from 'react-native-gesture-handler';

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
    error={},
    load,
    setError=()=>{},
    onFocusFunc=()=>{},
    onBlurFunc=()=>{},
    onSubmitEditing=()=>{},
    sendMessage=() => {},
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
                    placeholderTextColor={colors.greyC}
                    placeholder={placeholder}
                    onSubmitEditing={sendMessage}
                    maxLength={maxLength}
                    editable={!readOnly}
                    autoCapitalize={'none'}
                    textContentType={'oneTimeCode'}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    allowFontScaling={false}
                    hitSlop={{ top: 15, bottom: 15 }}
                />
            </View>
            <Button type={5} onPress={sendMessage} style={{ width: 'unset' }}>보내기</Button>

            {/* <Pressable style={styles.send}>
                <Text style={styles.sendText}>보내기</Text>
            </Pressable> */}
        </View>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.greyF1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8
        },
        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
        },
        input: {
            flex: 1,
            color: colors.dark,
            fontFamily: fonts.regular,
            fontSize: 16,
            minHeight: 20, // 최소 높이
            maxHeight: 60, // 최대 높이 제한
            paddingTop: 0, // 상단 패딩 제거
        },
        send: {
            paddingHorizontal: 12,
            height: 36,
            borderRadius: 8,
            backgroundColor: colors.main,
            alignItems: 'center',
            justifyContent: 'center'
        },
        sendText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.white,
            fontFamily: fonts.semiBold
        }
    })
  
    return { styles }
}
