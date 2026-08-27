import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';

import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import Language from '@/components/Popup/Language';


import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useEtc, useLang, useAlert } from '@/libs/store';


export default function Page() {

    const { cate } = useLocalSearchParams();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { mbData, reload } = useUser();
    const { country, setCountry } = useLang();
    const { openAlertFunc } = useAlert();

    const { appActiveStatus } = useEtc();

    const [alarm, setAlarm] = useState(false);
    const [marketing, setMarketing] = useState(false);

    const openPop = () => {
        openAlertFunc({
            component: <Language />
        })
        
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'language' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                <View style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'language' })}</Text>
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={openPop}
                    >
                        <Image source={images.language} style={rootStyle.default} />
                        <Text style={styles.buttonText}>{ lang({ id: country === 'en' ? 'english' : 'franais' })}</Text>
                    </TouchableOpacity>
                </View>

            </View>
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
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 11,
            borderRadius: 12,
            backgroundColor: colors.taseta,
            height: 26
        },
        buttonText: {
            color: colors.taseta_sub_2,
            fontSize: 16,
            fontFamily: fonts.medium,
            letterSpacing: -0.32,
        }

    })

    return { styles }
}