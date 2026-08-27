import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import * as Location from 'expo-location';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Camera from '@/components/Camera';
import Loading from '@/components/Loading';

import LicenseListItem from '@/components/Item/LicenseListItem2';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, photoShot, checkForegroundGpsPermission } from '@/libs/utils';

import { useUser, useGps, useDriverData, useAlert, useEtc, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { login, pushToken } = useUser();
    const { currentGpsStatus } = useGps();
    const { appActiveStatus } = useEtc();

    const { openAlertFunc } = useAlert();

    const [camera, setCamera] = useState(false);
    const [photo, setPhoto] = useState(null);

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState({});

    const startPhoto = async () => {

        const status = await photoShot();

        if (status) {
            setCamera(!camera)
        }

    }

    const takePhoto = (photo) => {
        setPhoto(photo);
    }

    const submitFunc = async () => {

        /*
            **API 연결필요** 신분증 인증 신청
            승인 or 거부되면 푸시알림 및 알람 전송
        */
        setLoad(true);

        setTimeout(() => {
            setLoad(false);
            router.replace({
                pathname: routes.verificationSuccess,
                params: {
                    type: 'id'
                }
            });
        }, consts.apiDelay)
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
    };

    return (
        <Layout header={header}>
            <View style={{ flex: 1, backgroundColor: colors.white }}>
                <ScrollView >
                    <View style={styles.root} >
                        <View style={{ gap: 11 }}>
                            <Text style={styles.title}>{lang({ id: 'capture_id_photo' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'if_information_is' })}</Text>
                        </View>
                        <View style={{ gap: 33 }}>
                            <Image source={photo?.uri || images.license_card} style={[styles.photo, { borderRadius: photo ? 23 : 0 }]} />
                            <Button onPress={startPhoto} >{lang({ id: photo ? 'retake_photo' : 'take_photo' })}</Button>
                        </View>

                        <View style={{ gap: 13 }}>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'ensure_clear_image' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'avoid_glare_reflecti' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'make_sure_your_1' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'capture_sharp_nonblu' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'screenshots_or_edite' })}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.bottom} >
                        <Button style={{ width: 120 }} onPress={submitFunc} load={load} disabled={!photo}>{lang({ id: 'continue' })}</Button>
                    </View>

                </ScrollView>
            </View>


            <Camera
                open={camera}
                close={() => {
                    setCamera(false)
                }}
                onSubmit={takePhoto}
                mode="square"
            />
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingVertical: 20,
            gap: 33,
        },
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold,
            letterSpacing: -0.64,
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        locationText: {
            color: colors.taseta,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            flexShrink: 1
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end'
        },
        bottomMulti: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 30
        },
        item: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 15,

        },
        itemText: {
            flexShrink: 1,
            fontSize: 16,
            fontFamily: fonts.medium,
            letterSpacing: -0.32,
            lineHeight: 24,
            color: colors.main
        },


        rootAfter: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20
        },
        photo: {
            width: '100%',
            aspectRatio: 3 / 1.89,
        }
    })

    return { styles }
}