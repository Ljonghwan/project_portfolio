import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from "expo-router";
import { ContextMenu, Picker, Button } from '@expo/ui/swift-ui';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Radio from '@/components/Radio';
import InputDate from '@/components/InputDate';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useUser, useAlert, useLang } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
    value,
    setValue = () => { },
    onBlur = () => { },
}) {
    const { mbData, reload } = useUser();
    const { closeAlertFunc } = useAlert();
   
    return (
        <ContextMenu style={{}}>
            <ContextMenu.Items>
                {consts.countryOptions?.map((x, i) => {
                    return (
                        <Button key={i} systemImage={x?.idx === value ? "checkmark" : null} onPress={() => {
                            setValue(x?.idx);
                            onBlur();
                        }}>{`${x?.label} ${x?.title} (${x?.value})`}</Button>
                    )
                })}
            </ContextMenu.Items>
            <ContextMenu.Trigger>
                <View style={styles.dropdown}>
                    <Text style={styles.selectedTextStyle}>{consts.countryOptions?.find(x => x?.idx === value)?.label}</Text>
                    <Image source={images.down} style={rootStyle.default} />
                </View>
            </ContextMenu.Trigger>
        </ContextMenu>
    );
}

const styles = StyleSheet.create({
    dropdown: {
        borderWidth: 1,
        borderColor: colors.sub_1,
        height: 50,
        paddingHorizontal: 14,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        width: 90
    },
    selectedTextStyle: {
        fontSize: Platform.OS === 'ios' ? 26 : 20,
        color: colors.main,
        fontFamily: fonts.medium
    },
});