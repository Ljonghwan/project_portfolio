import { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
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

import Product from '@/componentsPage/payment/Product';

import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import images from '@/libs/images';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { useUser, useEtc } from '@/libs/store';
import { numFormat } from '@/libs/utils';

export default function Page() {

	const { products, fetchProducts } = useIAP();

    const { styles } = useStyle();

    const { token, mbData, login, logout } = useUser();
    const { goTop } = useEtc();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const header = {
        title: '픽켓 결제',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            <Product />

        </Layout>
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
    })

    return { styles }
}