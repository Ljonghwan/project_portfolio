import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from "react-native-reanimated";

import Icon from '@/components/Icon';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { } from '@/libs/utils';

import { usePhotoPopup } from '@/libs/store';

export default function Component({
    iref = null,
    autoFocus = false,
    name = "",
    placeholder = "",
    valid = null,
    maxLength = 250,
    readOnly = false,
    style = {},
    state = "",
    setState = () => { },
    onFocusFunc = () => { },
    onBlurFunc = () => { },
    onSubmitEditing = () => { },
    sendMessage = () => { },
    sendPhoto = () => { },
}) {
    const { styles } = useStyle();

    const { openPhotoFunc } = usePhotoPopup();

    const [f, setF] = useState(false);

    const visible = useSharedValue(0); // 0: hidden, 1: visible

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withTiming(visible.value ? rootStyle.send.width : 0, { duration: 200 }),
            opacity: withTiming(visible.value, { duration: 200 }),
            transform: [
                {
                    scale: withSpring(visible.value ? 1 : 0.5, {
                        damping: 15,
                        stiffness: 350,
                    }),
                },
            ],
        };
    });

    const inputStyle = useAnimatedStyle(() => {
        return {
            flex: withSpring(visible.value ? 1 : 1.1, { damping: 15, stiffness: 350, }),
        };
    });

    useEffect(() => {
        
    }, [])

    useEffect(() => {
        visible.value = state?.length > 0 ? 1 : 0;
    }, [state])

    const onChanged = (v) => {

        if (valid === 'hp' || valid === 'number') {
            v = v.replace(/[^0-9]/g, '');
        }

        setState(v);
    }

    return (
        <View style={[styles.root, style]}>
            <Animated.View style={[styles.inputWrap, inputStyle]}>
                <TextInput
                    ref={iref}
                    autoFocus={autoFocus}
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
                    placeholderTextColor={colors.grey9}
                    placeholder={placeholder}
                    onSubmitEditing={() => { onSubmitEditing(); onBlurFunc(); }}
                    maxLength={maxLength}
                    editable={!readOnly}
                    autoCapitalize={'none'}
                    textContentType={'oneTimeCode'}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    allowFontScaling={false}
                />
            </Animated.View>

            <Animated.View style={[animatedStyle]}>
                <Pressable onPress={sendMessage}>
                    <Image source={images.send} style={rootStyle.send} />
                </Pressable>
            </Animated.View>

        </View>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            paddingBottom: 12 + insets?.bottom,
            borderTopWidth: 1,
            borderTopColor: colors.sub_2,
            gap: 6,
            // backgroundColor: 'red'
        },

        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',

            backgroundColor: colors.sub_3,
            borderRadius: 25,

        },
        input: {
            flex: 1,
            color: colors.main,
            fontFamily: fonts.medium,
            backgroundColor: colors.sub_3,
            fontSize: 16,
            minHeight: 20, // 최소 높이
            maxHeight: 100, // 최대 높이 제한
            paddingTop: 0, // 상단 패딩 제거
            paddingHorizontal: 21,
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
