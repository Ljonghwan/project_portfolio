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

    const [background, setBackground] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setBackground(mbData?.matchingType);
        }, [appActiveStatus])
    );

    const togglePress = async () => {
        const { data, error } = await API.post('/v2/my/changeMatchingType');
        console.log({ data, error });
        setBackground(data);
    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'matching_preferences' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                
                <View style={{ gap: 5 }}>
                    <Text style={{...rootStyle.font(20, colors.main, fonts.semiBold)}}>{lang({ id: 'set_your_match_preferences' })}</Text>
                    <Text style={{...rootStyle.font(16, colors.sub_1, fonts.medium)}}>{lang({ id: 'enable_matching_only_with' })}</Text>
                </View>

                <View style={styles.listItem}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'background_check_only' })}</Text>
                    <Switch
                        value={background}
                        togglePress={togglePress}
                    />
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
            gap: 24
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