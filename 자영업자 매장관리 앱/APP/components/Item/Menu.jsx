import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname, useLocalSearchParams, useFocusEffect } from "expo-router";

import Text from '@/components/Text';

import BarGraph from '@/components/Ui/BarGraph';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dayjs from 'dayjs';

import { numFormat, numFormatInput, formatToAbs } from '@/libs/utils';

export default function Component({
    style,
    item,
}) {

    const { styles } = useStyle();

    const [total, setTotal] = useState(0);
    const [margin, setMargin] = useState(0);

    useEffect(() => {


    }, [item]);

    return (
        <Pressable style={[styles.root, style]} onPress={() => {
            router.push({
                pathname: routes.원가계산기등록,
                params: {
                    idx: item?.idx
                }
            });
        }}>
            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 11, alignItems: 'center' }]}>
                <Text style={styles.title} numberOfLines={1}>{item?.title}</Text>
                <Text style={styles.date}>{item?.category}</Text>
            </View>

            <View style={{ paddingHorizontal: 7, gap: 24 }}>
                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1, gap: 11, alignItems: 'center' }}>
                        <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>원가</Text>
                        <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{numFormatInput(item?.total?.toFixed(0)) || 0}원</Text>
                    </View>
                    <View style={{ flex: 1, gap: 11, alignItems: 'center' }}>
                        <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>판매가</Text>
                        <Text style={{...rootStyle.font(16, colors.black, fonts.semiBold)}}>{numFormat(item?.amount)}원</Text>
                    </View>
                    <View style={{ flex: 1, gap: 11, alignItems: 'center' }}>
                        <Text style={{...rootStyle.font(14, colors.text757575, fonts.medium)}}>마진</Text>
                        <Text style={{...rootStyle.font(16, colors.primaryBright, fonts.semiBold)}}>{numFormat( item?.margin )}%</Text>
                    </View>
                </View>

                <BarGraph value={item?.margin / 100} />
            </View>

        </Pressable>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 17,
            paddingVertical: 22,
            gap: 28,
            marginBottom: 11
        },

        title: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.4,
            color: colors.black,
            flexShrink: 1
        },
        date: {
            fontSize: 14,
            fontFamily: fonts.medium,
            letterSpacing: -0.3,
            color: colors.text757575
        },
    })

    return { styles }
}
