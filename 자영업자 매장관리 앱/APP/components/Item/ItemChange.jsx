import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { router, usePathname, useLocalSearchParams, useFocusEffect } from "expo-router";

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dayjs from 'dayjs';
import { numFormat, formatToAbs, formatToAbsColor } from '@/libs/utils';

export default function Component({
    style,
    item,
    mode = 'list'
}) {

    const { styles } = useStyle();
    const { width } = useSafeAreaFrame();

    const [percent, setPercent] = useState(0);

    useEffect(() => {
        setPercent(((item?.amount - item?.prev_amount) / item?.prev_amount) * 100);
    }, [item]);

    return (
        mode === 'home' ? (
            <View style={[styles.homeRoot, style]} >
                <View style={{ gap: 12, flex: 1 }}>
                    <Text style={{...rootStyle.font(14, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.title}({item?.company})</Text>
                    <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.medium)}}>￦{numFormat(item?.prev_amount)}</Text>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.medium)}}>→</Text>
                        <Text style={{...rootStyle.font(12, colors.text686B70, fonts.medium)}}>￦{numFormat(item?.amount)}</Text>
                    </View>
                </View>
                <View style={[rootStyle.flex, { gap: 4 }]}>
                    <Image
                        source={percent > 0 ? images.price_up : images.price_down}
                        style={[{ width: 18, aspectRatio: 1, tintColor: formatToAbsColor(percent) }]}
                        contentFit="contain"
                    />
                    <Text style={{ ...rootStyle.font(width <= 330 ? 14 : 16, formatToAbsColor(percent), fonts.semiBold) }}>{formatToAbs(percent)}%</Text>
                </View>
            </View >
        ) : (
            <View style={[styles.root, style]} >
                <View style={[rootStyle.flex, { gap: 10, justifyContent: 'space-between' }]}>
                    <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.title}({item?.company})</Text>
                    <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>{dayjs(item?.date).format('YYYY.MM.DD')}</Text>
                </View>
                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <View style={{ gap: 11, alignItems: 'center', flex: 1 }}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>이전 단가</Text>
                        <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold) }}>￦{numFormat(item?.prev_amount)}</Text>
                    </View>
                    <View style={{ gap: 11, alignItems: 'center', flex: 1 }}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>변경 단가</Text>
                        <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold) }}>￦{numFormat(item?.amount)}</Text>
                    </View>
                    <View style={{ gap: 11, alignItems: 'center', flex: 1 }}>
                        <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>변동률</Text>

                        <View style={[rootStyle.flex, { gap: 4 }]}>
                            <Image
                                source={percent > 0 ? images.price_up : images.price_down}
                                style={[{ width: 18, aspectRatio: 1, tintColor: formatToAbsColor(percent) }]}
                                contentFit="contain"
                            />
                            <Text style={{ ...rootStyle.font(width <= 330 ? 14 : 16, formatToAbsColor(percent), fonts.semiBold) }}>{formatToAbs(percent)}%</Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 18,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            height: 150,
            justifyContent: 'center',
            gap: 28,
            marginBottom: 11
        },
        homeRoot: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },


    })

    return { styles }
}
