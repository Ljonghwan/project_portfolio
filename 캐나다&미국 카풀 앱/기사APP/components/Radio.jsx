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
    active=false,
    title,
    onPress
}) {

   
    const backgroundColor = useSharedValue(colors.white);
    const borderColor = useSharedValue(colors.sub_1);
    const textColor = useSharedValue(colors.sub_1);

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

        backgroundColor.value = active ? colors.taseta_sub_2 : colors.white; 
        borderColor.value = active ? colors.taseta : colors.sub_1;
        textColor.value = active ? colors.taseta : colors.sub_1; 

    }, [active])


    return (
        <AnimatedTouchable 
            style={[
                styles.item,
                animatedStyle,
            ]}
            onPress={onPress} 
        >
            {({pressed}) => (
                <AnimatedText
                    style={[
                        styles.itemText,
                        animatedTextStyle,
                        pressed && { opacity: 0.7 },
                        title?.length > 7 && { fontSize: 16 }
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

    style={},

    list=[],
    state="",
    setState=()=>{},
    
    error={},
    setError=()=>{},
    
}) {

 
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
                        <Item key={i} title={x?.title} active={x?.idx == state} onPress={() => setState(x?.idx)}/>
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
        gap: 14
    },
    errMsg: {
        fontSize: 14,
        color: colors.text_popup,
        marginTop: -4,
        letterSpacing: -0.32
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        height: 48,
        borderRadius: 12,
    },
    itemText: {
        fontFamily: fonts.semiBold,
        fontSize: 18
    },
});
