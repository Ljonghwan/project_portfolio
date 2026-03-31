import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { useSafeAreaFrame } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';
import ErrorMessage from '@/components/ErrorMessage';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    iref = null,
    type = "start",
    autoFocus = false,
    name = "",
    placeholder = "",
    valid = null,
    password = false,
    maxLength = 50,
    readOnly = false,
    multiline = false,
    numberOfLines = 1,
    returnKeyType = null,
    icon = null,

    style = {},

    state = "",
    setState = () => { },

    error = {},
    setError = () => { },
    onPress = () => { },
    onFocusFunc = () => { },
    onBlurFunc = () => { },
    onReset = () => { },
    onSwapFunc = null,

    onAddFunc = null,

    onMinusFunc = () => { },
    onSubmitEditing = () => { },
    onContentSizeChange = () => { },
    isFocusing = false,

    timer = false,
    timerState,
    label,
    labelDisalbed,
    labelPress = () => { },
}) {

    const { styles } = useStyle();

    const [f, setF] = useState(false);
    const [t, setT] = useState(timer);

    const [view, setView] = useState(false);

    const [pad, setPad] = useState(
        valid === 'hp' || valid === 'number' ? (
            Platform.OS === 'ios' ? "number-pad" : "numeric"
        ) : valid === 'email' ? (
            "email-address"
        ) : (
            'default'
        )
    );

    const borderColor = useSharedValue(styles.inputWrap.borderColor);
    const backgroundColor = useSharedValue(styles.inputWrap.backgroundColor);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(borderColor.value, { duration: 200 }),
            backgroundColor: withTiming(backgroundColor.value, { duration: 200 }),
        };
    });

    useEffect(() => {
        // if(autoFocus && iref) {
        //     setTimeout(() => {
        //         iref?.current?.focus();
        //     }, 200)
        // }
    }, [])

    useEffect(() => {
        borderColor.value = (isFocusing) ? colors.main : styles.inputWrap.borderColor;
        backgroundColor.value = (isFocusing) ? colors.sub_3 : styles.inputWrap.backgroundColor;

    }, [isFocusing])

    useEffect(() => {
        setT(timer);
    }, [timer]);

    const onChanged = (v) => {

        if (setError && typeof (error) === 'object') {
            setError({ ...error, [name]: '' });
        }

        if (valid === 'hp' || valid === 'number') {
            v = v.replace(/[^0-9]/g, '');
        }

        console.log(v);
        setState(v);

    }
    return (
        <View style={[styles.root, style]}>

            <View style={styles.inputContainer}>
                <Animated.View style={[styles.inputWrap, animatedStyle]}>

                    <Image
                        source={icon ? icon : images[`map_fin_${type}_${state ? "on" : "off"}`]}
                        style={rootStyle.default}
                        transition={200}
                    />
                    <TextInput
                        ref={iref}
                        autoFocus={autoFocus}
                        onPress={onPress}
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
                        style={styles.input}
                        placeholderTextColor={colors.sub_1}
                        placeholder={placeholder}
                        keyboardType={pad}
                        onSubmitEditing={() => { onSubmitEditing(); onBlurFunc(); }}
                        onContentSizeChange={onContentSizeChange}
                        maxLength={maxLength}
                        editable={!readOnly}
                        secureTextEntry={(password && !view)}
                        autoCapitalize={'none'}
                        textContentType={'oneTimeCode'}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        returnKeyType={returnKeyType}
                        hitSlop={{ top: 14, bottom: 14 }}
                        allowFontScaling={false}
                    />

                    <View style={[rootStyle.flex, { gap: 10 }]}>
                        {(state) && (
                            <Icon img={images.reset} imgStyle={rootStyle.default} hitSlop={10} onPress={onReset} />
                        )}
                        {(type === 'start' && onSwapFunc) && (
                            <Icon img={images.swap} imgStyle={rootStyle.default} hitSlop={10} onPress={onSwapFunc} />
                        )}
                        {(type === 'end' && onAddFunc) && (
                            <Icon img={images.add_way} imgStyle={rootStyle.default} hitSlop={10} onPress={onAddFunc} />
                        )}
                        {(type === 'way') && (
                            <Icon img={images.minus_way} imgStyle={rootStyle.default} hitSlop={10} onPress={onMinusFunc} />
                        )}

                        {/* {(state && f) && <View style={styles.bar} /> }
                        <Icon img={images.map_grey} imgStyle={rootStyle.default} hitSlop={10} onPress={() => setView(!view)}/> */}
                    </View>

                </Animated.View>

            </View>
        </View>
    );
}

const useStyle = () => {

    const { width } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        root: {
            gap: 13,
        },
        inputLabelBox: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        inputLabel: {
            color: colors.main,
            fontSize: 20,
            fontFamily: fonts.extraBold
        },
        inputLabelRequired: {
            color: colors.text_popup,
            fontSize: 20,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4
        },
        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.sub_1,
            backgroundColor: colors.white
        },
        input: {
            flex: 1,
            color: colors.main,
            fontFamily: fonts.medium,
            fontSize: width <= 360 ? 16 : 18,
        },
        bar: {
            width: 1,
            height: 20,
            backgroundColor: colors.sub_3
        }
    });


    return { styles }
}