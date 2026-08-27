import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';

import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';

import CarInfo from '@/componentsPage/CarInfo';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useEtc } from '@/libs/store';


export default function Page() {

    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { mbData, reload } = useUser();

    const { appActiveStatus } = useEtc();

    const [car, setCar] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );
    
    const dataFunc = async () => {
        
        const { data, error } = await API.post('/v2/driver/user/driveInfo');

        setTimeout(() => {

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }
            console.log('data', data);
            setCar(data);

            setInitLoad(false);

        }, consts.apiDelay)
        
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'my_vehicle' })
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <CarInfo item={car} edit={true} dataFunc={dataFunc}/>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 23,
            gap: 30
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        listItemTitle: {
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.36,
        },
        listItemLink: {
            color: colors.sub_1,
            fontSize: 14,
            fontFamily: fonts.medium,
            letterSpacing: -0.28,
            textDecorationLine: 'underline',
            textDecorationColor: colors.sub_1
        }

    })

    return { styles }
}