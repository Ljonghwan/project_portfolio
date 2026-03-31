import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import PassengerStyle from '@/componentsPage/PassengerStyle';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { mbData, logout } = useUser();
	const { openAlertFunc } = useAlert();

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useBackHandler(() => {
        closeFunc();
        return true;
    });

    const closeFunc = () => {
        
        openAlertFunc({
            alertType: 'Sheet',
            title: lang({ id: 'would_you_like_to_enter_it_next' }),
            onCencleText: lang({ id: 'cancel' }),
            onPressText: lang({ id: 'log_out' }),
            onCencle: () => { },
            onPress: () => {
                logout();
            }
        })
        
    }

    const onSubmit = () => {

        if(router.canDismiss()) router.dismissAll();
        else router.replace(routes.tabs);

    }

    const header = {
        left: {
            icon: 'back',
            onPress: closeFunc
        },
    };

    return (
        <Layout statusBar={'dark'} header={header}>
            <View
                style={styles.root}
            >
                <PassengerStyle titleBox={true} onSubmit={onSubmit}/>
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
            textAlign: 'center'
        },
       
	})

  	return { styles }
}