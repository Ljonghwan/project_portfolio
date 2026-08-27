import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInLeft, useSharedValue } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

import News from '@/components/Item/News';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';
import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const tabBarHeight = useBottomTabBarHeight();

    const { styles } = useStyle();

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect');
            dataFunc();
        }, [])
    );

    useEffect(() => {
        if (reload) dataFunc();
    }, [reload])

    const dataFunc = async () => {

        setLoad(true);

        const { data, error } = await API.post('/v1/main/homeNews');
        // console.log('data', data)

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        setList(data || []);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay)
    }

    const reloadFunc = () => {

    }

    return (
        <Animated.View entering={FadeIn} style={{ flex: 1 }}>

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.fafafa }} fixed />)}

            <ScrollView
                style={styles.root}
                contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: tabBarHeight + 40,
                    paddingHorizontal: rootStyle.side
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                }
            >
                <Pressable style={styles.salesCard} onPress={() => {
                    router.push(routes.certHometax);
                }}>
                    <Image source={images.add_store} style={rootStyle.default48} />
                    <Text style={styles.salesCardTitle}>매출 연동을 위해 매장을 등록해주세요</Text>
                </Pressable>

                {list?.length > 0 && (
                    <>
                        <View>
                            <Text style={styles.title}>사장님께 드리는 최신 소식</Text>
                            {list?.map((x, i) => {
                                return (
                                    <News key={i} item={x} />
                                )
                            })}
                        </View>

                        <Button type={2} onPress={() => {
                            router.push(routes.myNews);
                        }}>다른 콘텐츠 보기</Button>
                    </>
                )}

            </ScrollView>
        </Animated.View>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.fafafa,
        },
        salesCard: {
            backgroundColor: colors.primary,
            borderRadius: 20,
            paddingHorizontal: 23,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            height: 140,
            marginBottom: 33
        },
        salesCardTitle: {
            fontSize: 14,
            fontFamily: fonts.bold,
            color: colors.white,
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.black,
            lineHeight: 28,
            letterSpacing: -0.5,
            marginBottom: 9
        }

    })

    return { styles }
}
