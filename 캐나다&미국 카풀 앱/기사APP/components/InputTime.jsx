import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, SlideInUp, SlideOutDown, FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import DateTimePicker from '@react-native-community/datetimepicker';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Timer from '@/components/Timer';
import ErrorMessage from '@/components/ErrorMessage';

import Time from '@/components/Popup/Time';

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
    placeholder = ""
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

    useEffect(() => {
        borderColor.value = state ? colors.main : styles.root.borderColor;
    }, [state])

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
            <AnimatedTouchable style={[styles.root, animatedStyle, style]} onPress={openPop}>
                <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 10 }]} >
                    <Image source={state ? images.time_black : images.time} style={rootStyle.default} transition={200} />
                    <Text style={[styles.title, { color: state ? colors.main : colors.sub_1 }]}>{state ? dayjs(state).format('h:mm A') : placeholder}</Text>
                </View>

                {state && <Icon img={images.reset} imgStyle={rootStyle.default} hitSlop={10} onPress={() => setState("")} />}
            </AnimatedTouchable>

            {view && (
                <DateTimePicker
                    onChange={(event, date) => {
                        setState(dayjs(date));
                        setView(false);
                    }}
                    value={state ? dayjs(state).toDate() : new Date()}
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
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: colors.sub_1,
        backgroundColor: colors.white,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 22
    },
    title: {
        fontSize: 18,
        color: colors.sub_1,
        fontFamily: fonts.medium,
        letterSpacing: -0.36
    }
});
