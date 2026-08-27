import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Map from '@/components/Map';

import AddrButton from '@/components/AddrButton';
import Profile from '@/components/Profile';
import LevelTag from '@/components/LevelTag';
import ListItemAddrHistory from "@/components/ListItemAddrHistory"

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen } from '@/libs/utils';

import { useUser, useSignData, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const { route, type, typeIndex, init, initLat, initLng } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [info, setInfo] = useState({});

    const [load, setLoad] = useState(true);
    const [submitLoad, setSubmitLoad] = useState(false);

    useEffect(() => {
        if (init) setInfo(JSON.parse(init));
    }, [init])

    const onHandleMessage = (data) => {
        setInfo(data);
    }

    const onSubmit = async () => {
        if(!info) return;

        if (type === 'fav') {
            
            setSubmitLoad(true);

            const sender = {
                type: typeIndex,
                ...info
            }

            console.log('sender', sender);

            const { data, error } = await API.post('/v2/my/favInsert', sender);

            setTimeout(() => {
                setSubmitLoad(false);

                if(error) {
                    ToastMessage(lang({ id: error?.message }), { type: 'error' } );
                    return;
                }

                router.canDismiss() ? router.dismiss(2) : router.dismissAll();

            }, consts.apiDelay)
            
        } else {
            router.dismissTo({
                pathname: route,
                params: {
                    type: type,
                    typeIndex: typeIndex,
                    info: JSON.stringify(info)
                },
            })
        }

    }

    return (
        <Layout>
            {load && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <View style={styles.root}>
                <View style={styles.mapBox} >
                    <Map
                        type={consts.mapType.finmap}
                        onHandleMessage={onHandleMessage}
                        initLat={initLat}
                        initLng={initLng}
                        onLoadEnd={() => setLoad(false)}
                    />
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            router.back()
                        }}
                    >
                        <Image source={images.back} style={rootStyle.size_24} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.bottom, type === 'viewer' && { height: 150 }]} >
                    <View style={{ flex: 1, gap: 5 }}>
                        <Text style={styles.title} numberOfLines={1}>{info?.name || '...'}</Text>
                        <Text style={styles.subTitle} numberOfLines={2}>{info?.address || '...'}</Text>
                    </View>
                    
                    {type !== 'viewer' && (
                        <Button style={styles.completeBtn} onPress={onSubmit} load={submitLoad}>
                            {
                                lang({
                                    id: type === 'start' ? 'set_as_starting'
                                        : type === 'end' ? 'set_as_departure'
                                            : type === 'way' ? 'set_as_stopover'
                                                : type === 'fav' ? 'register'
                                                    : 'set_up_complete'
                                })
                            }
                        </Button>
                    )}
                    
                </View>
            </View>
        </Layout >
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            // paddingTop: insets?.top,

        },
        mapBox: {
            // width: "100%",
            // height: "100%"
            flex: 1,

        },

        bottom: {
            // position: "absolute",
            // width: "100%",
            // bottom: 0,
            justifyContent: 'space-between',
            height: 240,
            gap: 15,
            marginTop: -insets?.top,
            paddingTop: 20,
            paddingBottom: insets?.bottom + 20,
            paddingHorizontal: rootStyle.side,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: -1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 9, // blur 정도
            elevation: 5, // Android용 
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.semiBold,
            color: colors.main,
            letterSpacing: -0.4
        },
        subTitle: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.36
        },


        backBtn: {
            position: "absolute",
            top: insets?.top + 20,
            left: rootStyle.side
        },

    })

    return { styles }
}