import { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Image } from 'expo-image';
import { useIAP } from 'react-native-iap';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Empty from '@/components/Empty';

import PaySheet from '@/components/payment/PaySheet';
import ProductFlirting from '@/components/list/ProductFlirting';

import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import images from '@/libs/images';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { useUser, useEtc } from '@/libs/store';
import { numFormat } from '@/libs/utils';

export default function Page({ header = false }) {

	const { products, fetchProducts } = useIAP();

    const { styles } = useStyle();

    const { token, mbData, login, logout } = useUser();
    const { goTop } = useEtc();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const listRef = useRef(null);

    const [list, setList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState(false);

    const [info, setInfo] = useState("");

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(true);

    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
            getFlirting();
        }, [])
    )

    // useEffect(() => {
    //     console.log('products', products);
    // }, [products])

    useEffect(() => {

        if (reload) {
            dataFunc(true);
            getFlirting();
        }

    }, [reload]);

    useEffect(() => {
        if (goTop) listRef?.current?.scrollToOffset({ offset: 0, animated: true })
    }, [goTop])

    const dataFunc = async () => {

        setLoad(true);

        const { data, error } = await API.post('/v1/payItem/list');

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        console.log('data', data);
        setList(data?.filter(item => item?.serviceType === (Platform.OS === 'ios' ? 'apple' : 'pg')) || []);
        // setList(data?.filter(item => item?.serviceType === ('pg')) || []);
		fetchProducts({ skus: data?.filter(item => item?.appleSku)?.map(item => item?.appleSku) });

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay)

    }

    const getFlirting = async () => {
        const { data, error } = await API.post('/v1/assets/flirting');

        setInfo(data);
    }

    const renderItem = ({ item, index }) => {

        return <ProductFlirting item={item} onPress={(v) => {
            setSelected(v);
            setView(prev => !prev);
        }}/>

    };

    return (
        <View style={{ flex: 1 }}>

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <FlatList
                ref={listRef}
                data={mbData?.level === 2 ? [] : list}
                renderItem={renderItem}
                refreshing={reload}
                numColumns={2}
                onRefresh={() => {
                    setReload(true);
                }}
                keyExtractor={(item, index) => item?.idx }
                // removeClippedSubviews
                // initialNumToRender={20}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: insets?.bottom + 100,
                    paddingHorizontal: rootStyle.side,
                    rowGap: 15,
                }}
                columnWrapperStyle={{
                    gap: 15,
                }}
                ListHeaderComponent={
                    <View style={{ gap: 13 }}>
                        {header && (
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={[rootStyle.flex, { gap: 10 }]}>
                                    <Image source={images.picket2} style={rootStyle.default32} />
                                    <Text style={{...rootStyle.font(18, colors.primary, fonts.medium)}}>픽켓</Text>
                                </View>
                                <TouchableOpacity onPress={() => router.navigate(routes.orderFlirting)} hitSlop={10}>
                                    <Text style={{...rootStyle.font(14, colors.primary, fonts.semiBold), textDecorationLine: 'underline'}}>
                                        {mbData?.level === 1 ? '픽켓내역' : '정산하기'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.badge}>
                            <Image source={images.picket} style={[rootStyle.picket, { width: 20 }]} tintColor={colors.grey6}/>
                            <Text style={styles.badgeText}>
                                {mbData?.level === 1 ? '보유중인 픽켓 : ' : '정산 가능한 픽켓 : '}
                                <Text style={styles.badgeTextCount}>{numFormat(mbData?.level === 2 ? info?.applyFlirting : mbData?.flirting)}장</Text>
                            </Text>
                        </View>

                        {mbData?.level === 2 && (
                            <View style={{alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 20 }}>
                                <Image source={images.picket} style={[rootStyle.picket, { width: 43 }]} tintColor={colors.grey6}/>
                                <Text style={{...rootStyle.font(18, colors.grey6, fonts.medium)}}>1% 회원은 픽켓을 구매할 수 없어요.</Text>
                            </View>
                        )}

                    </View>
                }
                ListFooterComponent={
                    <View style={{ marginTop: 35 }} >
                        <Text style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.35}}>{`픽켓(Picket)은 *Pick(선택)과 *Ticket(티켓)이 만나 탄생한, 내가 직접 선택한 사람의 마음에 들어갈 수 있는 특별한 입장권입니다.\n\n한 장의 픽켓으로, 평범한 호감을 눈에 보이는 '설렘'으로 바꿔보세요.`}</Text>
                    </View>
                }
            />
            
            <PaySheet view={view} handleClose={() => setView(false)} item={selected}/>

        </View>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        titleBox: {
            paddingHorizontal: 20,
            height: 56,
            alignItems: 'flex-start',
            justifyContent: 'center'
        },
        title: {
            fontSize: 20,
            letterSpacing: -0.5,
            color: colors.dark,
            fontFamily: fonts.semiBold,
        },
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
            height: 30,
            borderRadius: 12,
            backgroundColor: colors.white,
            borderWidth: 0.5,
            borderColor: colors.grey6,
            gap: 4,
            alignSelf: 'flex-start',
        },
        badgeText: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.grey6,
        },
        badgeTextCount: {
            fontSize: 12,
            fontFamily: fonts.semiBold,
            color: colors.grey6,
        },
    })

    return { styles }
}