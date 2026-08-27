import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import { numFormat } from '@/libs/utils';

const Counter = ({ value, setValue, style }) => {
    return (
        <View style={[styles.root, style]}>
            <TouchableOpacity hitSlop={10} onPress={() => setValue(Math.max(0, value - 1))}>
                <Image source={images.minus} style={rootStyle.default20} transition={100} />
            </TouchableOpacity>
            <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), width: 45, textAlign: 'center' }}>{numFormat(value)}</Text>
            <TouchableOpacity hitSlop={10} onPress={() => setValue(Math.min(99, value + 1))}>
                <Image source={images.add} style={rootStyle.default20} transition={100} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 32,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
    },
});

export default Counter;