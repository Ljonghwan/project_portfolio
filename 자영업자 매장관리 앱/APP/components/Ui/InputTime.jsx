import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, SlideInUp, SlideOutDown, FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import DateTimePicker from '@react-native-community/datetimepicker';

import Icon from '@/components/Icon';
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
    style = {},
    state = "",
    setState = () => { },
    placeholder = "",
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

    const openPop = () => {
        if (Platform.OS === 'ios') {
            openAlertFunc({
                component: <Time date={state} setDate={setState} />
            })
        } else {
            setView(!view);
        }
    }

    return (
        <>
            <AnimatedTouchable style={[styles.root, animatedStyle, style]} activeOpacity={0.7} onPress={openPop}>
                <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 10 }]} >
                    <Text style={[styles.title, { color: state ? colors.textPrimary : colors.textSecondary }]}>{state ? dayjs(dayjs().format('YYYY-MM-DD') + " " + state).format('A h:mm') : placeholder}</Text>
                </View>
                <Image source={images.select_down} style={rootStyle.default20} transition={200} />
            </AnimatedTouchable>

            {view && (
                <DateTimePicker
                    onChange={(event, date) => {
                        setState(dayjs(date).format('HH:mm'));
                        setView(false);
                    }}
                    value={state ? dayjs(dayjs().format('YYYY-MM-DD') + " " + state).toDate() : new Date()}
                    mode={'time'}
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
        fontFamily: fonts.medium,
        letterSpacing: -0.36
    }
});
