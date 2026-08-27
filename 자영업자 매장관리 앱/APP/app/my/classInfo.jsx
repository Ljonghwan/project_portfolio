import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import Tab from '@/components/Ui/Tab';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, formatToMan } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { store } = useStore();

    const { configOptions } = useConfig();

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const renderItem = ({ item, index }) => {

        return (
            <View style={styles.item} >
                <View style={{ width: 100, aspectRatio: 1, borderRadius: 20, backgroundColor: colors.fafafa, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={consts.s3Url + item?.image} style={{ width: item?.width, aspectRatio: item?.ratio }} contentFit='contain'/>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), marginBottom: 9 }} numberOfLines={1}>{item?.label}</Text>
                    <Text style={{ ...rootStyle.font(16, colors.text757575, fonts.medium), marginBottom: 5 }} numberOfLines={1}>{item?.min ? formatToMan(item?.min) : ""} ~ {item?.max ? formatToMan(item?.max) : ""}</Text>
                    <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium), lineHeight: 19,  width: '90%' }}>{item?.comment}</Text>
                </View>
            </View>
        );
    };

    const header = {
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
        title: '등급 안내',
    };

    return (
        <Layout header={header} >
            {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}

            <FlatList
                data={configOptions?.class}
                renderItem={renderItem}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: 10, 
                    paddingBottom: insets?.bottom + 20, 
                    paddingHorizontal: 21,
                    gap: 14
                }}
            />


        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 27
        }

    })

    return { styles }
}