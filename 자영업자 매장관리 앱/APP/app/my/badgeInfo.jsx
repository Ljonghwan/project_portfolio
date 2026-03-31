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

    const [badgeList, setBadgeList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );

    const dataFunc = async () => {

        const { data, error } = await API.post('/v1/my/badgeList');

        setBadgeList(data || []);

        setTimeout(() => {

            setInitLoad(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        const isLocked = badgeList?.find(x => x?.badge_idx === item?.idx) ? false : true;

        return (
            <View style={styles.item} >
                <View style={{ width: 100, aspectRatio: 1, borderRadius: 20, backgroundColor: colors.fafafa, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={consts.s3Url + item?.image} style={{ width: '60%', aspectRatio: 1, opacity: isLocked ? 0.3 : 1 }} blurRadius={isLocked ? (Platform.OS === 'ios' ? 20 : 2) : 0} />
                    {isLocked && (
                        <View style={{...StyleSheet.absoluteFillObject, backgroundColor: colors.dim, borderRadius: 20, alignItems: 'center', justifyContent: 'center'}}>
                            <Image source={images.lock} style={{ width: 36, aspectRatio: 1 }} />
                        </View>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.bold), marginBottom: 9 }} numberOfLines={1}>{item?.label}</Text>
                    <Text style={{ ...rootStyle.font(12, colors.text757575, fonts.medium), lineHeight: 19, width: '90%' }}>조건: {item?.comment}</Text>
                </View>
            </View>
        );
    };

    
    const header = {
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
        title: '뱃지 안내',
    };

    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <FlatList
                data={configOptions?.badges}
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