import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const navigation = useNavigation();
    const { title, subTitle } = useLocalSearchParams();

    const { styles } = useStyle();
    const { mbData, login } = useUser();


    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [error, setError] = useState({});


    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const submitFunc = () => {
        router.replace(routes.my)
    }

    return (
        <View
            style={styles.root}
        >
            <Image source={images.done} style={rootStyle.done} />

            <View style={{ gap: 11 }}>
                <Text style={styles.title}>{title ? title : lang({ id: 'profile_updated' })}</Text>
                {subTitle && (
                    <Text style={styles.subTitle}>{subTitle}</Text>
                )}
            </View>

            <Button onPress={submitFunc}>{lang({ id: 'my_page' })}</Button>
        </View>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: rootStyle.side,
            gap: 65,
            marginTop: -rootStyle.header.height
        },
        title: {
            color: colors.main,
            fontSize: 40,
            fontFamily: fonts.goudy,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
            textAlign: 'center',
            paddingHorizontal: rootStyle.side
        },

    })

    return { styles }
}