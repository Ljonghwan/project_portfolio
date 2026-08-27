import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import * as Location from 'expo-location';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import FavAddr from '@/components/FavAddr';
import Empty from '@/components/Empty';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, getPositionAndPlace, useDebounce } from '@/libs/utils';

import { useUser, useLang, useAlert, useLoader, usePhotoPopup } from '@/libs/store';


export default function Page() {

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();

    const pathname = usePathname();

    return (
        <View style={styles.root}>

            <View style={{ gap: 5 }}>
                <Text style={{...rootStyle.font(20, colors.main, fonts.extraBold)}}>{lang({ id: 'frequent_places' })}</Text>
                <Text style={{...rootStyle.font(16, colors.sub_1, fonts.medium)}}>{lang({ id: 'your_favorite_places' })}</Text>
            </View>

            <FavAddr onPress={(v) => {
                router.push({
                    pathname: routes.pinMap,
                    params: {
                        route: pathname,
                        type: 'viewer',
                        init: JSON.stringify(v),
                        initLat: v?.lat,
                        initLng: v?.lng
                    }
                })
            }}/>
        </View>
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingVertical: 16,
            gap: 38
        },
    })

    return { styles }
}