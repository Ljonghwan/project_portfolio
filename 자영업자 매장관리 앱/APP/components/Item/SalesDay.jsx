import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp, FadeIn } from 'react-native-reanimated';
import dayjs from 'dayjs';

import Text from '@/components/Text';
import Empty from '@/components/Empty';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import { numFormat } from '@/libs/utils';

export default function Component({
    style,
    emptyStyle,
    item,
}) {

    const { styles } = useStyle();

    return (
        <View style={[styles.root, style]}>
            <Text style={styles.title} numberOfLines={2}>{dayjs(item?.date).format('M월 DD일 (dd)')}</Text>

            {item?.list?.length > 0 ? (
                <View style={{ gap: 16 }}>
                    {item?.list?.map((x, i) => {
                        return (
                            <View key={i} style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={styles.label}>{x?.title}<Text style={styles.label}> ({numFormat(x?.count)}건)</Text></Text>
                                <Text style={styles.data}>{numFormat(x?.value)}원</Text>
                            </View>
                        )
                    })}
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <Text style={styles.label}>{'총 매출 합계'}</Text>
                        <Text style={styles.price}>{numFormat(item?.list?.reduce((acc, item) => acc + item?.value, 0) || 0)}원</Text>
                    </View>
                </View>
            ) : (
                <Empty msg={'입금 예정 없음'} style={[emptyStyle]} />
            )}

        </View>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            gap: 18,
            paddingVertical: 19,
            marginHorizontal: 30,
            borderBottomColor: colors.f6f6f6,
            borderBottomWidth: 1
        },
        title: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.text212223,
            flexShrink: 1
        },
        label: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.text757575
        },
        data: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.text343330
        },
        price: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.text343330
        },
        

    })

    return { styles }
}
