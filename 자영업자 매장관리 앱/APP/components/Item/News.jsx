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
import { router, usePathname, useLocalSearchParams, useFocusEffect } from "expo-router";

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dayjs from 'dayjs';

export default function Component({
    style,
    item,
}) {

    const { styles } = useStyle();

    return (
        <Pressable style={[styles.root, style]} onPress={() => {
            router.push({
                pathname: routes.newsView,
                params: {
                    idx: item?.idx
                }
            })
        }}>
            <View style={{ flex: 1, gap: 10 }}>
                <Text style={styles.title} numberOfLines={2}>{item?.title}</Text>
                <Text style={styles.date}>{dayjs(item?.createAt).format('YYYY.MM.DD')}</Text>
            </View>
            <Image source={consts.s3Url + item?.image} style={styles.image}/>
        </Pressable>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderBottomColor: colors.f8f8f9,
            borderBottomWidth: 1
        },

        title: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.text212223,
            flexShrink: 1
        },
        date: {
            fontSize: 12,
            fontFamily: fonts.medium,
            letterSpacing: -0.3,
            color: colors.text9C9EA3
        },
        image: {
            width: 64,
            aspectRatio: 1/1,
            borderRadius: 9.5,
            backgroundColor: colors.placeholder
        }
    })

    return { styles }
}
