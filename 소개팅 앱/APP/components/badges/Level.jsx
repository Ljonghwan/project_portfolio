import {  View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useUser, useConfig } from '@/libs/store';

export default function Component({
    level=1,
    style
}) {

    return (
        <View style={[styles.root, { borderColor: level === 1 ? colors.primary : colors.red4 }, style]}>
            {/* {width > 340 && <Image source={images.crown} style={rootStyle.crown} />} */}
            <Text style={[styles.title, { color: level === 1 ? colors.primary : colors.red4 }]}>{level === 99 ? 'VIP 회원' : level === 1 ? '선택 회원' : '1% 회원'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.red4,
        height: 22,
        paddingHorizontal: 10
    },
    title: {
        fontSize: 12,
        letterSpacing: -0.3,
        fontFamily: fonts.regular,
        color: colors.red4
    }
});
