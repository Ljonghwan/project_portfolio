import {  View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

export default function Component({
}) {

    const { width, height } = useWindowDimensions();

    return (
        <View style={styles.root}>
            {/* {width > 340 && <Image source={images.crown} style={rootStyle.crown} />} */}
            <Text style={styles.title}>1% 회원</Text>
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
