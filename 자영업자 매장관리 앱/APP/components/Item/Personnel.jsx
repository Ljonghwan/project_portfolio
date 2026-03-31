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
import { router } from 'expo-router';

import Text from '@/components/Text';

import Tag from '@/components/Ui/Tag';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

import { numFormat } from '@/libs/utils';

export default function Component({
    style,
    item,
}) {

    const { styles } = useStyle();

    return (
        <Pressable style={[styles.root, style]} onPress={() => {
            router.push({
                pathname: item?.staff ? routes.직원상세 : routes.일용노무상세,
                params: { idx: item?.idx }
            });
        }}>
            <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                <Text style={{...rootStyle.font(14, colors.header, fonts.semiBold)}} numberOfLines={2}>{item?.name}</Text>
                <Tag type={item?.staff ? 2 : 3} tag={item?.staff ? '고정직원' : '일용직'} />
                {/* {item?.status === 9 && <Tag type={4} tag={'퇴사'} />} */}
                {/* {dayjs(item?.edate).isBefore(dayjs()) && <Tag type={4} tag={'근무종료'} />} */}
            </View>
            <View style={[{ gap: 9, alignItems: 'flex-end' }]}>
                <Text style={{...rootStyle.font(16, colors.text343330, fonts.bold)}} >{numFormat(item?.pay_calc)}원</Text>
                <Text style={{...rootStyle.font(12, colors.text757575, fonts.medium)}} >{item?.work_stime} ~ {item?.work_etime}</Text>
            </View>
        </Pressable>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            paddingVertical: 12.5,
            marginHorizontal: 36,
        },
        title: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.text212223,
            flexShrink: 1
        },


    })

    return { styles }
}
