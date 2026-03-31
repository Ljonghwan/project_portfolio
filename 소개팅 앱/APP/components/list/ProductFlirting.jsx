import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import dayjs from 'dayjs';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import { numFormat, elapsedTime } from '@/libs/utils';

export default function Component({
    item=null,
    onPress=()=>{}
}) {

    const { width } = useSafeAreaFrame();

    return (
        <TouchableOpacity 
            style={[ styles.root ]} 
            activeOpacity={0.7}
            onPress={() => onPress(item)}
        >
            <View style={{ flex: 1, gap: 2 }}>
                <Text style={{...rootStyle.font(12, colors.grey6, fonts.medium)}}>{item?.name}</Text>
                <Text style={styles.itemTitle}>{`${item?.count}장`}</Text>
                <Text style={styles.itemPrice}>{numFormat(item?.price)}원</Text>
            </View>

            <Image source={images.picket} style={[rootStyle.picket, { width: width <= 320 ? 40 : 50 }]} tintColor={colors.primary}/>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary9,
        borderRadius: 12,
    },
    itemTitle: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
        color: colors.dark,
        fontFamily: fonts.medium,
    },
    itemPrice: {
        fontSize: 12,
        letterSpacing: -0.35,
        color: colors.primary8,
        fontFamily: fonts.semiBold,
        marginTop: 6
    }
});
