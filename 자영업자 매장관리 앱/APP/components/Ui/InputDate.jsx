import React, { useCallback, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import {
	GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";

import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '@/components/Button';
import Text from '@/components/Text';


import Time from '@/components/Ui/Time';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useBottomSheetModalBackHandler } from '@/libs/utils';

import { useLang, useAlert } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({
    ref=null,
    style = {},
    state = "",
    setState = () => { },
    placeholder = "",
    disabled = false,
    minDate
}) {

    const { openAlertFunc } = useAlert();

    const bottomSheetModalRef = useRef(null);
    const [view, setView] = useState(false);

    const borderColor = useSharedValue(styles.root.borderColor);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(borderColor.value, { duration: 200 }),
        };
    });

    // useEffect(() => {
    //     borderColor.value = state ? colors.main : styles.root.borderColor;
    // }, [state])
    useImperativeHandle(ref, () => ({
        focus: () => openPop(),
    }));

    const openPop = () => {
        if (disabled) return;

        if (Platform.OS === 'ios') {
            openAlertFunc({
                component: <Time date={state} setDate={setState} mode='date' minDate={minDate} />
            })
        } else {
            setView(!view);
        }
    }

    return (
        <>
            <AnimatedTouchable style={[styles.root, animatedStyle, style, disabled && { backgroundColor: colors.disabled }]} activeOpacity={0.7} onPress={openPop}>
                <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 10 }]} >
                    <Text style={[styles.title, { color: state ? colors.textPrimary : colors.textSecondary }]}>{state ? dayjs(state).format('YYYY-MM-DD') : placeholder}</Text>
                </View>
                <Image source={images.input_calendar} style={rootStyle.default} transition={200} />
            </AnimatedTouchable>

            {view && (
                <DateTimePicker
                    onChange={(event, date) => {
                        setState(dayjs(date).format('YYYY-MM-DD'));
                        setView(false);
                    }}
                    value={state ? dayjs(state).toDate() : new Date()}
                    mode={'date'}
                    display={'spinner'}
                    minimumDate={minDate ? dayjs(minDate).toDate() : undefined}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		height: 48,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		gap: 10,
    },
    title: {
        fontSize: 16,
        color: colors.textPrimary,
        fontFamily: fonts.regular,
        letterSpacing: -0.36
    },

    modal: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        margin: 0,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },

    container: {
		paddingHorizontal: rootStyle.side,
		paddingVertical: 20,
        backgroundColor: colors.white,
        borderRadius: 8,
	},
});
