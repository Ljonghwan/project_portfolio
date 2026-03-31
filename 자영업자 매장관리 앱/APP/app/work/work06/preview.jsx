import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import WebView from 'react-native-webview';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { ToastMessage, regPhone, isValidJSON } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const { item: itemParam } = useLocalSearchParams();

    const [ params, setParams ] = useState(null);


    const [ load, setLoad ] = useState(true);

    useEffect(() => {
        if(itemParam && isValidJSON(itemParam)) {
            const item = JSON.parse(itemParam);

            setParams({
                template_idx: item?.template_idx,
                title: item?.title || "",
                comment: item?.comment || "",
                sdate: item?.sdate ? parseInt((item?.sdate + "")?.replace(/-/g, '')) : "",
                edate: item?.edate ? parseInt((item?.edate + "")?.replace(/-/g, '')) : "",
                type: item?.type,
                discount: item?.discount || 0,
                min_amount: item?.min_amount || "",
            });
        } else {
            ToastMessage('쿠폰 정보를 불러오는데 실패했습니다.');
        }
    }, [itemParam])

    useEffect(() => {
        console.log('params', consts.webUrl + '/coupon?' + new URLSearchParams(params).toString());
    }, [params])

    const header = {
        title: 'www.ownertalk.com',
        titleStyle: {
            fontSize: 18
        },
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header}>
            {load && <Loading style={{ backgroundColor: colors.white }} color={colors.black} fixed entering={false} /> }

            <View style={styles.root}>
                {params && (
                    <WebView
                        style={styles.webview}
                        originWhitelist={['*']}
                        decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
                        source={{ 
                            uri: consts.webUrl + '/coupon?' + new URLSearchParams(params).toString()
                        }}
                        onLoadEnd={() => {
                            setTimeout(() => {
                                setLoad(false);
                            }, 300)
                        }}
                    />
                )}
             
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
        webview: {
            backgroundColor: colors.white,
            flex: 1
        },
	})

  	return { styles }
}