import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { TabView, TabBar } from 'react-native-tab-view';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import PassengerStyle from '@/componentsPage/PassengerStyle';
import DriverStyle from '@/componentsPage/DriverStyle';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';


const routesTab = [
    { key: 'first', title: lang({ id: 'passenger' }) },
    { key: 'second', title: lang({ id: 'driver' }) },
];

export default function Page() {

    const { cate } = useLocalSearchParams();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { mbData, login } = useUser();


    const [index, setIndex] = useState(0);

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [error, setError] = useState({});


    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const onSubmit = () => {
        router.back();
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'set_your_ride' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                <PassengerStyle userStyle={mbData?.userStyle} onSubmit={onSubmit} />
            </View>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
        title: {
            color: colors.main,
            fontSize: 40,
            fontFamily: fonts.goudy,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
            textAlign: 'center'
        },
        tabText: { 
            color: colors.sub_1,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
        },
        tabTextActive: { 
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.36,
        }

    })

    return { styles }
}