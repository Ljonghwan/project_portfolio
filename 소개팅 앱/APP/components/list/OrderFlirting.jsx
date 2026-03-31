import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { FadeInRight, useAnimatedStyle, withTiming } from 'react-native-reanimated';

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
    item = null,
    level,
    title,
    abs=null
}) {

    const { styles } = useStyle();


    const flirtingOptions = level === 1 ? consts.flirtingOptions : consts.flirtingTopVisualOptions;

    return (
        <View
            style={[styles.root]}
        >
            {abs === 'super' ? 
                <Image source={images.super_picket} style={rootStyle.default36} /> 
            : (
                <Image source={(abs || flirtingOptions?.find(x => x?.valueInclude?.includes(item?.status))?.type) === 'minus' ? images.picket_out : images.picket_in} style={rootStyle.default36} />
            )}

            <View style={styles.item} >
                <View style={[rootStyle.flex, { justifyContent: 'space-between'}]}>
                    <Text style={styles.itemName}>“
                        { 
                            title ? title
                            : item?.status === 4 ? `${consts.chargeOptions?.find(x => x?.value === item?.chargeType)?.title}` 
                            : item?.targetName ? `${item?.targetName} 님`
                            : flirtingOptions?.find(x => x?.valueInclude?.includes(item?.status))?.title
                        }
                        ”
                    </Text>
                    {(abs || flirtingOptions?.find(x => x?.valueInclude?.includes(item?.status))?.type) === 'minus' ? (
                        <Text style={[styles.itemCount, {  }]}>-{numFormat(item?.count)}장</Text>
                    ) : (
                        <Text style={styles.itemCount}>+{numFormat(item?.count)}장</Text>
                    )}
                </View>

                <View style={[rootStyle.flex, { justifyContent: 'space-between'}]}>
                    <Text style={styles.itemDate}>{dayjs(item?.createAt).format('HH:mm')}</Text>
                    <Text style={{...rootStyle.font(14, colors.text_info, fonts.regular)}}>{item?.roomMessage}</Text>
                </View>
            </View>
        </View>
    );
}



const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: colors.white,
            paddingVertical: 20,
            paddingHorizontal: rootStyle.side,
        },
        item: {
            flex: 1,
            gap: 5
        },
        badge: {
            paddingHorizontal: 8,
            height: 28,
            borderRadius: 8,
            backgroundColor: colors.greyE,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-end'
        },
        badgeText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark
        },
        itemDate: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey9
        },
        itemCount: {
            fontSize: 16,
            letterSpacing: -0.4,
            color: colors.dark,
            fontFamily: fonts.semiBold
        },
        itemName: {
            fontSize: 16,
            letterSpacing: -0.4,
            color: colors.black,
            fontFamily: fonts.medium,
            flexShrink: 1,
        },
    });

    return { styles }
}

