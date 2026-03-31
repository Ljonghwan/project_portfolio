import { useRef, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";

import dayjs from 'dayjs';
import * as Application from 'expo-application';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Term from '@/components/Term';
import Profile from '@/components/Profile';
import Button from '@/components/Button';
import Icon from '@/components/Icon';

import Product from '@/componentsPage/payment/Product';

import { useUser, useAlert, useEtc } from '@/libs/store';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import { ToastMessage } from '@/libs/utils';

import API from '@/libs/api';
import fonts from '@/libs/fonts';


export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const { token, pushToken, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { goTop } = useEtc();

    const header = {
        left: {
            icon: 'logo2',
            iconStyle: {
                width: 48,
                height: 48,
            },
            onPress: () => router.back()
        },
        right: {
            bell: true
        }
    };

    return (
        <Layout header={header} >

            
            <Product header={true}/>
        </Layout>
    )
}



const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const styles = StyleSheet.create({
       
        
    })

    return { styles }
}