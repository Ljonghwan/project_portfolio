import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Pressable, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

function Item({
    style,
    active=false,
    title,
    icon,
    iconSize,
    onPress
}) {

   
    const backgroundColor = useSharedValue(colors.white);
    const borderColor = useSharedValue(colors.sub_1);
    const textColor = useSharedValue(colors.sub_1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 200 }),
            borderColor: withTiming(borderColor.value, { duration: 200 }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 200 }),
        };
    });

    useEffect(() => {

        backgroundColor.value = active ? colors.taseta : colors.white; 
        borderColor.value = active ? colors.taseta : colors.sub_1;
        textColor.value = active ? colors.taseta_sub_2 : colors.sub_1; 

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
                <View style={[rootStyle.flex, { gap: 6 }]}>
                    {icon && <Image source={images?.[`${icon}` + (active ? '_on' : '')]} style={[iconSize ? iconSize : rootStyle.default]} />}
                    <AnimatedText
                        style={[
                            styles.itemText,
                            animatedTextStyle,
                            pressed && { opacity: 0.7 }
                        ]}
                        allowFontScaling={false}
                    >
                        {lang({ id: title })}
                    </AnimatedText>
                </View>
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
    numColumnsType=1,
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
                        <Item 
                            key={i} 
                            style={{ minWidth: (numColumnsType === 2 && i === 0) ? '100%' : 'auto' }} 
                            title={x?.title} 
                            icon={x?.icon}
                            iconSize={x?.iconSize}
                            active={max === 1 ? x?.idx === state : state?.includes(x?.idx) }
                            onPress={() => onPressFunc(x?.idx)}
                        />
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
        gap: 14,
        flexWrap: 'wrap',
        
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
        width: 'auto',
    },
    itemText: {
        fontFamily: fonts.medium,
        fontSize: 18,
        textAlign: 'center'
    },
});
