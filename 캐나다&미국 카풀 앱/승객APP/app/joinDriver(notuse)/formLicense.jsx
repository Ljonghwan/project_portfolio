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

    const { driverType, setDriverData } = useDriverData();
    const { openAlertFunc } = useAlert();

    const [camera, setCamera] = useState(false);
    const [photo, setPhoto] = useState(null);

    const [position, setPosition] = useState({});
    const [province, setProvince] = useState(null);

    const [load, setLoad] = useState(false);
    const [gpsLoad, setGpsLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState({});

    useEffect(() => {
        if(driverType === 2) getPosition();
    }, [driverType])

    useEffect(() => {

        if (position?.lat) {
            getProvince()
        }

    }, [position])

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

        setLoad(true);

        setDriverData({
            key: 'driveLicence',
            value: photo
        })

        setTimeout(() => {
            setLoad(false);
            router.push(routes.joinDriverCar);
        }, consts.apiDelay)
    }

    const getPosition = async () => {
        await checkForegroundGpsPermission();

        const result = await Location.getLastKnownPositionAsync();
        console.log(result?.coords);
        if (result) setPosition({ lat: result?.coords?.latitude, lng: result?.coords?.longitude })
    }   

    const getProvince = async () => {

        setGpsLoad(true);

        const sender = {
            lat: position?.lat,
            lng: position?.lng,
        }
        const { data, error } = await API.post('/v1/driver/province', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error'});
            return;
        }

        setProvince(data);

        setTimeout(() => {
            setGpsLoad(false);
        }, consts.apiDelay)
    }


    return (
        <>
            <View style={{ flex: 1, backgroundColor: colors.white }}>
                <ScrollView >
                    <View style={styles.root} >
                        <View style={{ gap: 11 }}>
                            <Text style={styles.title}>{lang({ id: 'capture_your_drivers' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_ensure_inform' })}</Text>
                        </View>
                        <View style={{ gap: 33 }}>
                            <Image source={photo?.uri || images.license_card} style={[styles.photo, { borderRadius: photo ? 23 : 0 }]} />
                            <Button onPress={startPhoto} >{lang({ id: photo ? 'retake_photo' : 'take_photo' })}</Button>
                        </View>
                        
                        {driverType === 2 && (
                            <View style={{ gap: 13 }}>
                                {gpsLoad && <Loading fixed color={colors.taseta} style={{ paddingBottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}/>}

                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 3, flex: 1 }]}>
                                        <Image source={images.location} style={rootStyle.default} />
                                        <Text style={styles.locationText} numberOfLines={1}>{lang({ id: 'your_location' })} : {province?.name || ''}</Text>
                                    </View>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(routes.joinDriverLicenseList)}>
                                        <Image source={images.question_green} style={rootStyle.default} />
                                    </TouchableOpacity>
                                </View>
                                <LicenseListItem item={province} onPress={getPosition}/>
                            </View>
                        )}
                        

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
        </>
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