import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import AutoHeightImage from '@/components/AutoHeightImage';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const router = useRouter();
    const { idx } = useLocalSearchParams();
    const { styles } = useStyle();

    const [ item, setItem ] = useState(null);

    const [ load, setLoad ] = useState(true);

    useEffect(() => {

        dataFunc()

    }, [idx]);

    const dataFunc = async () => {

        let sender = {
            idx
        }
        const { data, error } = await API.post('/v1/suport/get', sender);

        if(error) {
            ToastMessage(error?.message);
            return;
        }

        setItem(data);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }

    const header = {
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} >
            <ScrollView style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

                
                <View style={{ flex: 1 }}>
                    <View style={{ gap: 8, paddingHorizontal: 20 }}>
                        <Text style={styles.title}>{`문의내역`}</Text>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item?.title}</Text>
                        <Text style={styles.itemDate} >{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</Text>
                    </View>

                    <View style={{ padding: 20 }}>
                        <Text style={styles.itemContent} >{item?.content}</Text>
                    </View>
                    {item?.file && (
                        <AutoHeightImage source={consts.s3Url + item?.file} />
                    )}
                </View>
            </ScrollView>
        </Layout>
    )
}


const useStyle = () => {

	const styles = StyleSheet.create({
        title: {
            fontSize: 24,
            lineHeight: 32,
            fontFamily: fonts.semiBold,
            color: colors.dark
        },
        subTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            color: colors.grey6
        },

        itemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
            color: colors.dark,
        },
        itemDate: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
        },
        itemContent: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
        },
        itemImage: {
            width: '100%',
        }
	})

  	return { styles }
}