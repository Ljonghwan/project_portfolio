import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Timer from '@/components/Timer';
import Text from '@/components/Text';
import Button from '@/components/Button';

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
    numberOfLines=1,
    returnKeyType=null,

    style={},
    inputStyle={},

    state="",
    setState=()=>{},
    max=0,
    
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

    const { styles } = useStyle();

    const inputRef = useRef(null);

    const [f, setF] = useState(false);
    const [t, setT] = useState(timer);

    const [view, setView] = useState(false);

    const onChanged = (v) => {

        if(setError && typeof(error) === 'object') {
            setError({...error, [name]: ''});
        }

        v = v.replace(/[^0-9]/g, '');
        v = Math.min(max, v);

        setState(v);
        
    }
    return (
        <View style={{ gap: 13 }}>
            <View style={[styles.root, style]}>
                {!readOnly && (
                    <TouchableOpacity onPress={() => {
                        setState(prev => Math.max(0, (prev * 1) - 1));
                    }}>
                        <Image source={images.minus} style={rootStyle.default36} />
                    </TouchableOpacity>
                )}
                
                <View style={[rootStyle.flex, { alignItems: 'center', gap: 5 }]}>
                    <Image source={images.picket} style={rootStyle.default28} />
                    <View style={[rootStyle.flex, { alignItems: 'center'}]}>
                        <TextInput
                            ref={inputRef}
                            onFocus={(event) => {
                                setF(true);
                                onFocusFunc();
                            }}
                            onBlur={() => {
                                setF(false); 
                                onBlurFunc();
                            }}
                            value={String(state)} //value}
                            onChangeText={v => {
                                onChanged(v);
                            }} //onChange}
                            style={[styles.input, inputStyle]}
                            placeholderTextColor={colors.primary}
                            placeholder={placeholder}
                            keyboardType={Platform.OS === 'ios' ? "number-pad" : "numeric"}
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
                            allowFontScaling={false}
                            hitSlop={{ top: 10, bottom: 10 }}
                        />
                        <Text style={styles.input}>장</Text>
                    </View>
                </View>
                {!readOnly && (
                    <TouchableOpacity onPress={() => {
                        setState(prev => Math.min(max, (prev * 1) + 1));
                    }}>
                        <Image source={images.plus} style={rootStyle.default36} />
                    </TouchableOpacity>
                )}
            </View>

            {!readOnly && (
                <Button type={15} onPress={() => {
                    inputRef.current?.focus();
                }}>직접입력</Button>
            )}
           
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 7,
        },
        input: {
            color: colors.primary,
            fontFamily: fonts.semiBold,
            height: '100%',
            fontSize: 18,
        }
    });

    return { styles }
}

