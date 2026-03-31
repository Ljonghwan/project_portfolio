import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';
import ErrorMessage from '@/components/ErrorMessage';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import { numFormat } from '@/libs/utils';


export default function Component({
    iref=null,
    inputLabel="",
    required=false,
    autoFocus=false,
    name="",
    placeholder="",
    valid=null,
    password=false,
    maxLength=50,
    readOnly=false,
    multiline=false,
    numberOfLines=1,
    returnKeyType=null,

    style={},

    state="",
    setState=()=>{},
    
    error={},
    setError=()=>{},
    onFocusFunc=()=>{},
    onBlurFunc=()=>{},
    onSubmitEditing=()=>{},
    onContentSizeChange=()=>{},

    timer=false,
    timerState,
    label,
    labelDisalbed,
    labelPress=()=>{},
    
    unit=null
}) {

    const [f, setF] = useState(false);
    const [t, setT] = useState(timer);

    const [view, setView] = useState(false);

    const [pad, setPad] = useState(
        valid === 'hp' || valid === 'number' || valid === 'numberFormat' ? (
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
    },[])

    useEffect(() => {
        borderColor.value = (f || state) ? colors.main : styles.inputWrap.borderColor; 
    }, [f, state])

    useEffect(() => {
        setT(timer);
    }, [timer]);

    const onChanged = (v) => {

        if(setError && typeof(error) === 'object') {
            setError({...error, [name]: ''});
        }

        if(valid === 'hp' || valid === 'number') {
            v = v.replace(/[^0-9]/g, '');
        }
        if(valid === 'numberFormat') {
            v = v.replace(/[^0-9]/g, '');
            v = v*1 < 1 ? "" : v;
        }
        
        console.log(v);
        setState(v);
        
    }
    return (
        <View style={[styles.root, style]}>
            {inputLabel && 
                <View style={styles.inputLabelBox}>
                    <Text style={styles.inputLabel}>{inputLabel}</Text>
                    {required && <Text style={ [styles.inputLabelRequired ]}>*</Text>}
                </View>
            }
            <View style={styles.inputContainer}>
                <Animated.View style={[styles.inputWrap, animatedStyle ]}>
                    {unit && (
                        <Text style={{...rootStyle.font(18, colors.main, fonts.medium)}}>{unit}</Text>
                    )}
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
                        value={valid === 'numberFormat' ? numFormat(state) : state} //value}
                        onChangeText={v => {
                            onChanged(v);
                        }} //onChange}
                        style={styles.input}
                        placeholderTextColor={colors.sub_1}
                        placeholder={placeholder}
                        keyboardType={pad}
                        onSubmitEditing={ () => {onSubmitEditing(); onBlurFunc();} }
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
                    { password && (
                        <Icon img={view ? images.view : images.hide} imgStyle={rootStyle.default} hitSlop={10} onPress={() => setView(!view)}/>
                    )}
                    {Boolean(state && f) && (
                        <Icon img={images.reset} imgStyle={rootStyle.default} hitSlop={10} onPress={() => onChanged("")}/>
                    )}
                    { t && (
                        <Timer timeOut={timerState} label={label}/>
                    )}
                   
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
                    
                </Animated.View>

               
            </View>
            
            {(error?.[name]) &&
                <ErrorMessage msg={error?.[name]}/>
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
        gap: 4
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
    watchBox: {
        position: 'absolute',
        
        right: 0,
        padding: 16.64
    },
    label: {
        height: 24,
        paddingHorizontal: 9,
        backgroundColor: colors.taseta,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center'
    },
    labelText: {
        fontSize: 13,
        color: colors.white,
        fontFamily: fonts.medium
    },
        
    errMsg: {
        fontSize: 14,
        color: colors.text_popup,
        marginTop: -4,
        letterSpacing: -0.32
    },
});
