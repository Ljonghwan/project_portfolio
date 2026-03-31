import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, StyleProp, TextInput, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView,  } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

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
    valid='default',
    password=false,
    maxLength=50,
    readOnly=false,
    disabled=false,
    multiline=false,
    numberOfLines=1,
    returnKeyType=null,

    style={},
    inputStyle={},
    inputWrapStyle={},
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

    avoidKeyboardLock=false,
}) {

	const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [v, setV] = useState(state || "");
    const [f, setF] = useState(false);
    const [t, setT] = useState(timer);

    const [view, setView] = useState(false);

    const [pad, setPad] = useState(
        valid === 'hp' || valid === 'number' ? (
          Platform.OS === 'ios' ? "number-pad" : "numeric"
        ) : valid === 'email' ? (
            "email-address"
        ) : (
            valid
        )
    );

    
    useEffect(() => {
        setV(state);
    }, [state]);

    useEffect(() => {
        setT(timer);
    }, [timer]);

    const onChanged = (v) => {
        setV(v);
    }
    return (
       
         <KeyboardStickyView enabled={!avoidKeyboardLock} style={{ width: '100%', paddingHorizontal: rootStyle.side,  }} offset={{ closed: 0, opened: -15 }}>
            <View style={[rootStyle.flex, { gap: 20 }]}>
                <View style={styles.inputWrap}>
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
                        value={v} //value}
                        onChangeText={v => {
                            onChanged(v);
                        }} //onChange}
                        style={[styles.input, inputStyle]}
                        placeholderTextColor={placeholderTextColor || colors.grey6}
                        placeholder={placeholder}
                        keyboardType={pad}
                        onSubmitEditing={ () => {setState(v); onSubmitEditing(); onBlurFunc();} }
                        onContentSizeChange={onContentSizeChange}
                        maxLength={maxLength}
                        editable={!readOnly}
                        secureTextEntry={(password && !view)}
                        autoCapitalize={'none'}
                        textContentType={'oneTimeCode'}
                        autoCorrect={false}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        returnKeyType={returnKeyType}
                        allowFontScaling={false}
                        hitSlop={10}
                    />
                    <TouchableOpacity style={styles.searchIcon} hitSlop={10} onPress={() => {
                        setState(v);
                        iref.current?.blur();
                    }}>
                        <Image source={images.search} style={rootStyle.default} tintColor={colors.white}/>
                    </TouchableOpacity>
                </View>

               
            </View>
        </KeyboardStickyView>
        
    );
}

const styles = StyleSheet.create({
    root: {
    },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 48,
        paddingVertical: 6,
        paddingHorizontal: 10,
        paddingLeft: 16,
        borderRadius: 24,
        borderWidth: 0.5,
        borderColor: colors.grey6,
        backgroundColor: colors.white
    },
    input: {
        flex: 1,
        color: colors.grey6,
        fontFamily: fonts.regular,
        fontSize: 16,
        paddingTop: 0, // 상단 패딩 제거
        paddingBottom: 0, // 하단 패딩 제거
    },
    searchIcon: {
        width: 36,
        aspectRatio: 1,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.grey6,
    }
});
