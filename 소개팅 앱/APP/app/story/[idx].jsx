import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";

import dayjs from "dayjs";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import AutoHeightImage from '@/components/AutoHeightImage';
import Empty from '@/components/Empty';
import Icon from '@/components/Icon';


import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import API from '@/libs/api';

import { ToastMessage, elapsedTime } from '@/libs/utils';

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

        setLoad(true);

        let sender = {
            idx
        }
        const { data, error } = await API.post('/v1/story/get', sender);

        if(error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay);

    }

    const nextFunc = () => {
        if(!item?.nextIdx) {
            ToastMessage('다음글이 없습니다.');
            return;
        }
        router.setParams({
            idx: item?.nextIdx
        })
    }
    const prevFunc = () => {
        if(!item?.prevIdx) {
            ToastMessage('이전글이 없습니다.');
            return;
        }
        router.setParams({
            idx: item?.prevIdx
        })
    }

    const header = {
        title: '실시간 만남 스토리',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
    };

    return (
        <Layout header={header} >
            <View style={{ flex: 1 }}>
                {/* <Empty msg={'상세 페이지 입니다.'} fixed /> */}
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }
                
                <ScrollView style={{ flex: 1 }}>
                    <View style={styles.titleBox}>
                        <Image source={consts.s3Url + item?.photo} style={styles.profile}/>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.itemTitle} numberOfLines={1}>{item?.title}</Text>
                            <Text style={styles.itemDate}>{elapsedTime(item?.createAt)}</Text>
                        </View>
                    </View>

                    <View style={{ flex: 1, gap: 8 }}>
                        {item?.photoList?.map((x, i) => {
                            return (
                                <AutoHeightImage key={i} source={consts.s3Url + x} />
                            )
                        })}
                    </View>
                    
                    <View style={styles.buttonBox}>
                        <Icon style={styles.button} img={images.next} imgStyle={rootStyle.default} onPress={nextFunc}/>
                        <Icon style={styles.button} img={images.prev} imgStyle={rootStyle.default} onPress={prevFunc}/>
                    </View>
                </ScrollView>
            </View>
            
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();
    
	const styles = StyleSheet.create({
        titleBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: rootStyle.side,
            paddingVertical: 10
        },
        profile: {
            width: 48,
            height: 48,
            borderRadius: 100
        },
        itemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            letterSpacing: -0.4
        },
        itemDate: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.6
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 20,
            paddingBottom: insets?.bottom + 20
        },
        button: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 100,

            backgroundColor: colors.white,
            shadowColor: colors.shadow,
            shadowOffset: {
                width: 1,
                height: 1,
            },
            shadowOpacity: 0.3,
            shadowRadius: 5,
    
            elevation: 20,
        }
	})

  	return { styles }
}