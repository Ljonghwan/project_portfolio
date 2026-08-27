import { View, StyleSheet } from 'react-native';

import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    textStyle,
    type = 1,
    tag = "",
    image = ""
}) {

    return (
        <View style={[styles?.['type_' + type], style]}>
            {image && (
                <Image source={image} style={{ width: 14, aspectRatio: 1, marginRight: 4 }} />
            )}
            <Text style={[styles[`type_${type}_text`], textStyle]}>{tag}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    type_1: {
        flex: 'auto',
        flexDirection: 'row',
        padding: 6,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 4,
        backgroundColor: colors.b5d6fb,
    },
    type_1_text: {
        color: colors.text4A6CFC,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_2: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 6,
        height: 17,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1000,
        backgroundColor: colors.tag2bg,
    },
    type_2_text: {
        color: colors.tag2,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_3: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 6,
        height: 17,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1000,
        backgroundColor: colors.tag3bg,
    },
    type_3_text: {
        color: colors.tag3,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_4: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 6,
        height: 17,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1000,
        backgroundColor: colors.f4f4f5,
    },
    type_4_text: {
        color: colors.text686B70,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_5: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 6,
        height: 17,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 1000,
        backgroundColor: '#E416161A', // 레드컬러 #E41616
    },
    type_5_text: {
        color: '#E41616', // 레드컬러 #E41616
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },



    type_board: {
        height: 22,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        backgroundColor: colors.f4f4f5,
        paddingHorizontal: 6
    },
    type_board_text: {
        color: colors.text686B70,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_badge: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 6,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 4,
        backgroundColor: colors.onboardingBg,
    },
    type_badge_text: {
        color: colors.orange,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 10,
        letterSpacing: -0.25
    },
    type_badge2: {
        flex: 'auto',
        flexDirection: 'row',
        paddingHorizontal: 8,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 3,
        backgroundColor: colors.tagBadge,
    },
    type_badge2_text: {
        color: colors.primary,
        textAlign: "center",
        fontSize: 12,
    },
});
