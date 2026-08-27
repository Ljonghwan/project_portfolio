import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

export default function Page() {

    const router = useRouter();
    const { styles } = useStyle();
    
    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const header = {
        title: "회원가입",
        left: {
            icon: 'back',
            onPress: () => router.dismissAll()
        },
    };

    return (
        <Layout header={header} input={true} statusBar={'dark'} >
            <View
                style={styles.root}
            >
                <Text style={styles.title}>{`회원가입을 위해\n본인인증을 진행해 주세요.`}</Text>
                <Button type={2} onPress={() => {
                    router.replace({
                        pathname: routes.cert,
                        params: {
                            type: 'join'
                        }
                    })
                }} load={load}>본인인증</Button>
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
            paddingTop: 20,
            gap: 30
		},
        title: {
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.45,
            color: colors.dark,
            paddingHorizontal: 5
        },
	})

  	return { styles }
}