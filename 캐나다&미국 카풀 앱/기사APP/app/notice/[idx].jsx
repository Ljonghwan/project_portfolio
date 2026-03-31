import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useLang } from '@/libs/store';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const router = useRouter();
    const { idx } = useLocalSearchParams();
    const { styles } = useStyle();
    const { country } = useLang();

    const [item, setItem] = useState(null);

    const [load, setLoad] = useState(true);

    useEffect(() => {

        dataFunc()

    }, [idx]);

    const dataFuncText = () => {
        const data = dummy.getBoardDummys(1)?.[0];
        setItem(data);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }

    const dataFunc = async () => {

        let sender = {
            idx
        }
        const { data, error } = await API.post('/v2/my/notiDetail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }

    const header = {
        title: lang({ id: 'notice' }),
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >
            {load && <Loading style={{ backgroundColor: colors.white }} color={colors.black} fixed entering={false} />}

            <View style={styles.root}>
                <View style={{ flex: 1 }}>
                    <View style={styles.titleBox}>
                        <Text style={styles.listItemTitle} numberOfLines={2}>{item?.title?.[country || 'en']}</Text>
                        <Text style={styles.listItemDate} >{dayjs(item?.createAt).format('MMMM/DD/YYYY A h:mm')}</Text>
                    </View>
                    
                    <EditorView content={item?.content?.[country || 'en']} />
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
            // borderTopColor: colors.sub_1,
            // borderTopWidth: 1,
            // paddingHorizontal: rootStyle.side
        },
        titleBox: {
            gap: 8, 
            borderBottomColor: colors.sub_1,
            borderBottomWidth: 1,
            paddingBottom: 15,
            marginHorizontal: rootStyle.side
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemDate: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },
        itemContent: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey6,
        },
        content: {
            paddingHorizontal: rootStyle.side,
            paddingTop: 10,
            paddingBottom: insets?.bottom || 20,
            gap: 20
        }
    })

    return { styles }
}