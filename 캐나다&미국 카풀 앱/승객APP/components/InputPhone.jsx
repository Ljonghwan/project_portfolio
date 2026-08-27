import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';
import Select from '@/components/Select';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';


export default function Component({
    iref = null,
    inputLabel = "",
    required = false,
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

    style = {},

    state = "",
    setState = () => { },
    country = "",
    setCountry = () => { },
    countryDisabled=false,

    error = {},
    setError = () => { },
    onFocusFunc = () => { },
    onBlurFunc = () => { },
    onSubmitEditing = () => { },
    onContentSizeChange = () => { },

    timer = false,
    timerState,
    label,
    labelDisalbed,
    labelPress = () => { },
}) {

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
    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(borderColor.value, { duration: 200 }),
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
        borderColor.value = f ? colors.main : styles.inputWrap.borderColor;
    }, [f])

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
            {inputLabel &&
                <View style={styles.inputLabelBox}>
                    <Text style={styles.inputLabel}>{inputLabel}</Text>
                    {required && <Text style={[styles.inputLabelRequired]}>*</Text>}
                </View>
            }

            <View style={styles.inputContainer}>
                {!countryDisabled && (
                    <Select
                        state={country}
                        setState={v => {
                            setCountry(v);
                            setTimeout(() => {
                                iref?.current?.focus();
                            }, 100)
                        }}
                        list={consts.countryOptions?.map(x => ( {idx: x?.idx, title: `${x?.label} ${x?.title} (${x?.value})`} ))}
                        transformOrigin={'top left'}
                        right={'auto'}
                    >

                        <View style={styles.dropdown}>
                            <Text style={styles.selectedTextStyle}>{consts.countryOptions?.find(x => x?.idx === country)?.label}</Text>
                            <Image source={images.down} style={rootStyle.default} />
                        </View>
                    </Select>
                )}
                
                <Animated.View style={[styles.inputWrap, animatedStyle]}>
                    <Text style={styles.withText}>{consts.countryOptions.find(item => item.idx === country)?.value}</Text>
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
                    {password && (
                        <Icon img={view ? images.view : images.hide} imgStyle={rootStyle.default} hitSlop={10} onPress={() => setView(!view)} />
                    )}
                    {(state && f) && (
                        <Icon img={images.reset} imgStyle={rootStyle.default} hitSlop={10} onPress={() => onChanged("")} />
                    )}
                    {t && (
                        <Timer timeOut={timerState} label={label} />
                    )}

                </Animated.View>

                {label && (
                    <TouchableOpacity
                        style={styles.label}
                        onPress={() => {
                            labelPress();
                        }}
                    >
                        <Text style={styles.labelText}>{label}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {(error?.[name]) &&
                <Animated.View entering={FadeInRight}>
                    <Text style={styles.errMsg}>{error?.[name]}</Text>
                </Animated.View>
            }
        </View>
    );
}

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
        gap: 4,
        position: 'relative',
    },
    inputWrap: {
        flex: 1,
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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
        fontSize: 18,
    },
    withText: {
        color: colors.main,
        fontFamily: fonts.medium,
        fontSize: 18,
        marginRight: 8
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
        fontSize: 14,
        color: colors.text_popup,
        marginTop: -4,
        letterSpacing: -0.32
    },

    dropdown: {
        borderWidth: 1,
        borderColor: colors.sub_1,
        height: 50,
        paddingHorizontal: 14,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 90
    },
    selectedTextStyle: {
        fontSize: Platform.OS === 'ios' ? 26 : 20,
        color: colors.main,
        fontFamily: fonts.medium
    },
});
