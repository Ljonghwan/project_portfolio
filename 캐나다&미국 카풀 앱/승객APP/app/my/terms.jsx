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
        title: lang({ id: 'terms_service' })
    };

    return (
        <Layout header={header}>
            <View
                style={styles.root}
            >
                {consts.termsAll?.map((x, i) => {
                    return (
                        <TouchableOpacity key={i} style={[styles.listItem, { borderBottomWidth: i < consts.termsAll?.length - 1 ? 1 : 0 }]} onPress={() => {
                            router.push({
                                pathname: routes.terms,
                                params: {
                                    idx: x?.idx,
                                    title: lang({ id: x?.title })
                                },
                            });
                        }}>
                            <Text style={styles.listItemTitle}>{lang({ id: x?.title })}</Text>
                            <Image source={images.link} style={rootStyle.default} />
                        </TouchableOpacity>
                    )
                })}
               

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