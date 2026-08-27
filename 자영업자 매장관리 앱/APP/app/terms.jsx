import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import EditorView from '@/components/EditorView';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { useLang } from '@/libs/store';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const { idx, route } = useLocalSearchParams();

    const [ item, setItem ] = useState(null);

    const [ load, setLoad ] = useState(true);

    useEffect(() => {
      
        
    }, [])

    useEffect(() => {
        dataFunc();
    }, [idx]);

    const dataFunc = async () => {

        let sender = {
            type: idx
        }
        const { data, error } = await API.post('/term', sender);
        
        if(error) {
            router.back();
            ToastMessage(error?.message);
            return;
        }
        
        setItem(data);

        setTimeout(() => {
            setLoad(false);
        }, 1000);
       
    }
    
    const checkAndReturn = () => {
        // A 페이지로 돌아가며 값 전달
        router.dismissTo({
            pathname: route,
            params: { idx: idx, check: true },
        });
    };

    const header = {
        modal: true,
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={{ ...header, title: item?.title || "" }} statusBar={'light'} >
            {load && <Loading style={{ backgroundColor: colors.white }} color={colors.black} fixed entering={false} /> }
            <View style={styles.root}>
                <EditorView content={item?.content} />
                {route && (
                    <View style={styles.bottom}>
                        <Button style={styles.button} onPress={checkAndReturn}>동의하기</Button>
                    </View>
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
        bottom: {
            // paddingHorizontal: rootStyle.side
        },
        button: {
            marginTop: 20,
            marginBottom: 75,
            paddingHorizontal: rootStyle.side
        }
	})

  	return { styles }
}