import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import AutoHeightImage from '@/components/AutoHeightImage';
import EditorView from '@/components/EditorView';

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
        const { data, error } = await API.post('/v1/notice/get', sender);

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);

    }

    const header = {
        title: '공지사항 목록',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >
            <View style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

                <View style={{ flex: 1, paddingTop: 20 }}>
                    <View style={{ gap: 8, paddingHorizontal: rootStyle.side, paddingBottom: 10 }}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item?.title}</Text>
                        <Text style={styles.itemDate} >{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</Text>
                    </View>

                    <EditorView content={item?.content} onLoad={() => {
                        setTimeout(() => {
                            setLoad(false)
                        }, consts.apiDelay)
                    }}/>
                    
                    {/* <ScrollView style={[]} contentContainerStyle={styles.content}>

                        <View style={{ paddingHorizontal: 20 }}>
                            <Text style={styles.itemContent}>{item?.content}</Text>
                        </View>

                        <View style={{ flex: 1, gap: 8 }}>
                            {item?.photoList?.map((x, i) => {
                                return (
                                    <AutoHeightImage key={i} source={consts.s3Url + x} />
                                )
                            })}
                        </View>
                        
                    </ScrollView> */}
                    {/* <EditorView content={item?.content} /> */}
                </View>
            </View>
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
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
            letterSpacing: -0.35,
            color: colors.grey6,
        },
        content: {
            paddingTop: 10,
            paddingBottom: insets?.bottom || 20,
            gap: 20
        }
	})

  	return { styles }
}