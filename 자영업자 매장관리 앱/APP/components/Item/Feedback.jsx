import React, { useEffect, useState } from 'react';
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
import dayjs from 'dayjs';

import Animated, {
    FadeIn
} from 'react-native-reanimated';

import Text from '@/components/Text';

import Tag from '@/components/Ui/Tag';
import InlineExpandableText from '@/components/Ui/InlineExpandableText';

import BoardMenu from '@/components/Popup/BoardMenu';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

import API from '@/libs/api';
import protectedRouter from '@/libs/protectedRouter';

import { getFullDateFormat, numFormat, ToastMessage, imageViewer } from '@/libs/utils';

import { useUser, useConfig, useAlert, useAlertSheet, useLoader } from '@/libs/store';


export default function Component({
    style,
    item,
    handleRemove = () => { }
}) {

    const pathname = usePathname();
    const { width } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlertSheet();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const [view, setView] = useState(false);

    return (
        <Pressable
            style={[ ]}
            onPress={() => {
                setView(prev => !prev);
            }}
        >
            <View style={[styles.root, style]} >
                {/* <Text style={{...rootStyle.font(30)}}>{item?.idx}</Text> */}
                <Tag type={item?.status === 1 ? 'board' : 'badge'} style={{ alignSelf: 'flex-start' }} tag={item?.status === 1 ? '답변대기' : '답변완료'} />
                
                <View style={{ paddingHorizontal: 4, gap: 8 }}>
                    <Text style={{...rootStyle.font(15, colors.text2B2B2B, fonts.semiBold), lineHeight: 22 }}>{item?.title}</Text>

                    {view && (
                        <Animated.View entering={FadeIn} style={{ gap: 12 }}>
                            <Text style={{...rootStyle.font(14, colors.text757575 ), lineHeight: 20 }}>{item?.comment}</Text>
                            {item?.image && (
                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' }]}>
                                    {item?.image?.map((x, i) => {
                                        return (
                                            <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => {
                                                imageViewer({ index: i, list: item?.image?.map(x => consts.s3Url + x) })
                                            }}>
                                                <Image source={consts.s3Url + x} style={{ width: (width - 70 - 40) / 4, aspectRatio: 1/1, borderRadius: 10, borderWidth: 1, borderColor: colors.fafafa, backgroundColor: colors.placeholder }}/>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            )}
                            {item?.answer && (
                                <View style={{ padding: 16, borderRadius: 10, backgroundColor: colors.fafafa }}>
                                    <Text style={{...rootStyle.font(14, colors.text757575 ), lineHeight: 20 }}>{item?.answer}</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    <Text style={{...rootStyle.font(12, colors.text757575, fonts.medium), paddingVertical: 4 }}>{dayjs(item?.createdAt).format('YYYY.MM.DD')} | {configOptions?.feedbackOptions?.find(x => x?.idx === item?.cate)?.title || "-"}</Text>
                </View>
                {/* configOptions?.boardCategory?.find(x => x?.idx === item?.cate)?.title */}
            </View>
        </Pressable>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingVertical: 12,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.fafafa,
        },

    })

    return { styles }
}
