import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';

import Icon from '@/components/Icon';
import Timer from '@/components/Timer';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { regPhone, regEmail, patternNum, patternEng, patternSpc, patternKor, patternSpcInstar, patternNick, patternBrand } from '@/libs/utils';

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
    numberOfLines=10,
    returnKeyType=null,

    style={},
    inputStyle={},
    inputWrapStyle={},
    inputWrapFocusStyle={},
    placeholderTextColor=null,

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
}) {

	const navigation = useNavigation();

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

    const borderColor = useSharedValue((inputWrapStyle?.borderColor || styles.inputWrap.borderColor));
    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(borderColor.value, { duration: 200 }),
        };
    });

    useEffect(() => {

		if (autoFocus && autoFocus !== 'fast' && iref) {
			const unsub = navigation.addListener('transitionEnd', () => {
				iref.current?.focus();
			});

			return unsub;
		}
	}, [])


    useEffect(() => {
        borderColor.value = f ? (inputWrapFocusStyle?.borderColor || colors.primary) : (inputWrapStyle?.borderColor || styles.inputWrap.borderColor); 
    }, [f])

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
        
        console.log(v);
        setState(v);
        
    }
    return (
        <View style={[styles.root, style]}>
            {inputLabel && 
                <View style={styles.inputLabelBox}>
                    {required && <Text style={ [styles.inputLabelRequired ]}>*</Text>}
                    <Text style={ [styles.inputLabel ]}>{inputLabel}</Text>
                </View>
            }
            <View style={styles.inputContainer}>
                <Animated.View style={[styles.inputWrap, animatedStyle, inputWrapStyle ]}>
                    <TextInput
                        ref={iref}
                        autoFocus={autoFocus === 'fast'}
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
                        style={[styles.input, inputStyle]}
                        placeholderTextColor={placeholderTextColor || colors.greyC}
                        placeholder={placeholder}
                        keyboardType={pad}
                        onSubmitEditing={ () => {onSubmitEditing(); onBlurFunc();} }
                        onContentSizeChange={onContentSizeChange}
                        maxLength={maxLength}
                        editable={!readOnly}
                        secureTextEntry={(password && !view)}
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        textContentType={'oneTimeCode'}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        returnKeyType={returnKeyType}
                        allowFontScaling={false}
                        textAlignVertical="top"
                    />
                    { password && (
                        <Icon img={view ? images.view : images.hide} imgStyle={rootStyle.default} hitSlop={10} onPress={() => setView(!view)}/>
                    )}
                    { t && (
                        <Timer timeOut={timerState} label={label}/>
                    )}
                   
                </Animated.View>

                {label && (
                    <TouchableOpacity
                        style={styles.label}
                        onPress={() => {
                            labelPress();
                        }}
                    >
                        <Text style={[ styles.labelText ]}>{label}</Text>
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
        gap: 12,
    },
    inputLabelBox: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    inputLabel: {
        color: colors.dark,
        fontSize: 15,
        // fontFamily: fonts.medium
    },
    inputLabelRequired: {
        color: colors.red,
        fontSize: 16,
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
        gap: 4,
        height: 200,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.greyC,
        backgroundColor: colors.white
    },
    input: {
        flex: 1,
        color: colors.dark,
        fontFamily: fonts.regular,
        fontSize: 16,
    },
    watchBox: {
        position: 'absolute',
        
        right: 0,
        padding: 16.64
    },
    label: {
        height: 44,
        width: 80,
        backgroundColor: colors.primary,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center'
    },
    labelText: {
        color: colors.white,
        fontSize: 14,
        letterSpacing: -0.35
    },
        
    errMsg: {
        fontSize: 12,
        lineHeight: 14,
        color: colors.red,
        marginTop: -4
    },
});
