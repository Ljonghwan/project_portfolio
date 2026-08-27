import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Keyboard, TouchableOpacity, Platform, AppRegistry, Pressable } from 'react-native';
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

/** SNS로그인 */

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Map from '@/components/Map';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';
import consts from '@/libs/consts';
import { ToastMessage, regEmail, useBackHandler } from '@/libs/utils';


import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {
    
    const { styles } = useStyle();

    const { pushToken, login } = useUser();
    const { setSignDataStart } = useSignData();

    const emailref = useRef(null);
    const pwref = useRef(null);

    const [ email, setemail ] = useState("");
    const [ pw, setpw ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {

        setError({});

    }, [email, pw])

    const joinStart = () => {

        setSignDataStart();

        router.navigate(routes.joinAgree) 
    }
    
    const loginFunc = async () => {

        Keyboard.dismiss();

        if(load) return;

        if(!email || !pw) {
            setError({...error, pw: lang({ id: 'please_enter_both' })});
            return;
        }
        if(!regEmail.test(email)) {
            setError({...error, pw: lang({ id: 'email_or_password' })});
            return;
        }

        setLoad(true);

        const sender = {
            type: 'email',
            email: email,
            password: pw,
            deviceToken: 'TEST deviceToken'
        }

        const { data, error } = await API.post('/v1/user/login', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                setError({...error, pw: lang({ id: error?.message })});
                return;
            }

            login({ token: data });
        }, 300)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} input={true} >
            <View
                style={styles.root}
            >
                <Map type={consts.mapType.basicmap}/>
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
            paddingTop: 43,
		},
        title: {
            fontFamily: fonts.goudy,
            fontSize: 40,
            lineHeight: 40,
            color: colors.main,
            marginBottom: 57
        },
        help: {
            textAlign: 'right',
            fontFamily: fonts.medium,
            color: colors.sub_1,
            fontSize: 16,
            letterSpacing: -0.64
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            gap: 10
        }

	})

  	return { styles }
}
