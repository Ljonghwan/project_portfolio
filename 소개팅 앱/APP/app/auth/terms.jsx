import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import WebView from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const router = useRouter();
    const { idx, title } = useLocalSearchParams();

    const [ item, setItem ] = useState(null);

    const [ load, setLoad ] = useState(true);

    useEffect(() => {
        dataFunc();
    }, [idx]);

    const dataFunc = async () => {

        let sender = {
            type: idx
        }
        const { data, error } = await API.post('/v1/policy', sender);

        if(error) {
            router.back();
            ToastMessage(error?.message);
            return;
        }
        
        setItem(data);

        setTimeout(() => {
            // setLoad(false);
        }, consts.apiDelay);
       
    }
  
    const header = {
        modal: true,
        title: title,
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} >
            <View style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} /> }
                <EditorView content={item?.content} onLoad={() => {
                    setLoad(false)
                }}/>
            </View>
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
        container: {
            flex: 1
        }
	})

  	return { styles }
}