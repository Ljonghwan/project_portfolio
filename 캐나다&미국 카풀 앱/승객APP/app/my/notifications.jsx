import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';

import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Switch from '@/components/Switch';


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

    const { cate } = useLocalSearchParams();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { mbData, reload } = useUser();

    const { appActiveStatus } = useEtc();

    const [alarm, setAlarm] = useState(false);
    const [marketing, setMarketing] = useState(false);


    useFocusEffect(
        useCallback(() => {
            setMarketing(mbData?.marketing);
            checkPermission().then((enabled) => {
                setAlarm(enabled);
            });
            reload();
        }, [appActiveStatus])
    );

    const toggleAlarmPress = async () => {

        await Linking.openSettings();
        return;
    }

    const checkPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    }

    const toggleMarketingPress = async () => {
        const { data, error } = await API.post('/v2/my/marketing');
        console.log({ data, error });
        setMarketing(data);
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'notifications' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                <View style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'push_notifications' })}</Text>
                    <Switch
                        value={alarm}
                        togglePress={toggleAlarmPress}
                    />
                </View>

                <View style={{ gap: 1.5 }}>
                    <View style={styles.listItem}>
                        <Text style={styles.listItemTitle}>{lang({ id: 'marketing_consent' })}</Text>
                        <Switch
                            value={marketing}
                            togglePress={toggleMarketingPress}
                        />
                    </View>
                    <TouchableOpacity onPress={() => {
                        router.push({
                            pathname: routes.terms,
                            params: {
                                idx: 3,
                                title: lang({ id: 'marketing_consent' })
                            },
                        });
                    }}>
                        <Text style={styles.listItemLink}>{lang({ id: 'learn_more' })}</Text>
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