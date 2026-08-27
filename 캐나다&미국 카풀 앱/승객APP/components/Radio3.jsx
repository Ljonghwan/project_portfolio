import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Pressable, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

function Item({
    style,
    active=false,
    title,
    onPress
}) {

   
    const backgroundColor = useSharedValue(colors.taseta_sub_2);
    const borderColor = useSharedValue(colors.taseta);
    const textColor = useSharedValue(colors.taseta);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 300 }),
            borderColor: withTiming(borderColor.value, { duration: 300 }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 300 }),
        };
    });

    useEffect(() => {

        backgroundColor.value = active ? colors.taseta : colors.taseta_sub_2; 
        borderColor.value = active ? colors.taseta : colors.taseta; 
        textColor.value = active ? colors.white : colors.taseta; 

    }, [active])


    return (
        <AnimatedTouchable 
            style={[
                styles.item,
                style,
                animatedStyle,
            ]}
            onPress={onPress} 
        >
            {({pressed}) => (
                <AnimatedText
                    style={[
                        styles.itemText,
                        animatedTextStyle,
                        pressed && { opacity: 0.7 }
                    ]}
                    allowFontScaling={false}
                >
                    {title}
                </AnimatedText>
            )}
        </AnimatedTouchable>
    );
}

export default function Component({
    inputLabel="",
    required=false,
    name="",
    readOnly=false,
    max=1,
    numColumns=2,
    style={},

    list=[],
    state="",
    setState=()=>{},
    
    error={},
    setError=()=>{},
    
}) {

    const onPressFunc = (v) => {
        if(max === 1) {
            setState(v);
        } else {

            if(state?.includes(v)) {
                setState(state?.filter(item => item !== v))
            } else {
                if(state?.length >= max) return;
    
                setState([...state, v])
            }
        }
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
                {list?.map((x, i) => {
                    return (
                        <Item key={i} title={x?.title} active={max === 1 ? x?.idx === state : state?.includes(x?.idx) } onPress={() => onPressFunc(x?.idx)}/>
                    )
                })}
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
        gap: 9,
        flexWrap: 'wrap',
        
    },
    errMsg: {
        fontSize: 14,
        color: colors.text_popup,
        marginTop: -4,
        letterSpacing: -0.32
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderWidth: 1
    },
    itemText: {
        fontFamily: fonts.medium,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center'
    },
});
