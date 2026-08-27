import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Linking } from 'react-native';

import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useEtc, useLang, useAlert } from '@/libs/store';

export default function Page() {

    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'support' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                <Text style={styles.title}>{lang({ id: 'help_center'})}</Text>

                <TouchableOpacity style={[styles.listItem]} onPress={() => {
                    router.push(routes.faq);
                }}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'faq' })}</Text>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.listItem]} onPress={() => {
                    router.push(routes.contactWrite);
                }}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'contact_support' })}</Text>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.listItem, { borderBottomWidth: 0 }]} onPress={() => {
                    router.push(routes.contact);
                    // router.push(routes.contacSuccess);
                }}>
                    <Text style={styles.listItemTitle}>{lang({ id: 'support_history' })}</Text>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>
               

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
            gap: 15
        },
        title: {
            color: colors.main,
            fontSize: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.4,
            marginBottom: 10
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomColor: colors.sub_1,
            borderBottomWidth: 1,
            paddingBottom: 15
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