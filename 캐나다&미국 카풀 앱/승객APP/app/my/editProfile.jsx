import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Camera from '@/components/Camera';


import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, photoShot } from '@/libs/utils';

import { useUser, useSignData, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { login, pushToken } = useUser();
    const { id, type, typeText, email, pw, country, lastName, firstName, hp, gender, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();

    const [camera, setCamera] = useState(false);
    const [photo, setPhoto] = useState(null);

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState({});


    const startPhoto = async () => {

        const status = await photoShot();
        console.log('status', status);

        if (status) {
            setCamera(true)
        }

    }

    const takePhoto = (photo) => {
        setPhoto(photo);
    }

    const submitFunc = async () => {
        
        Keyboard.dismiss();

        if (!photo || load) return;

        setLoad(true);

        const sender = {
            profile: photo,
        }

        const { data, error } = await API.post('/v2/passenger/user/editProfile', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }
            
            router.dismissAll();
            router.replace({
                pathname: routes.mySuccessProfile,
                params: {
                    subTitle: lang({ id: 'your_request_is' })
                }
            })

        }, consts.apiDelay)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'change_profile_photo' })
    };

    return (
        <Layout header={header}>
            {!photo ? (
                <View style={{ flex: 1, backgroundColor: colors.white }}>
                    <View style={styles.root}>
                        <View style={{ gap: 11 }}>
                            <Text style={styles.title}>{lang({ id: 'register_profile_1' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'help_use_taseta' })}</Text>
                        </View>

                        <View style={{ gap: 13 }}>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'ensure_clear_image' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'only_live_photos' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'remove_any_facecover' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'group_photos_are' })}</Text>
                            </View>
                            <View style={styles.item}>
                                <Image source={images.exclamation_circle} style={rootStyle.default} />
                                <Text style={styles.itemText}>{lang({ id: 'pet_photos_are' })}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bottom} >
                        <Button style={{ width: 120 }} onPress={startPhoto} load={load}>{lang({ id: 'continue' })}</Button>
                    </View>

                </View>
            ) : (
                <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'space-between', gap: 120 }}>

                    <View style={styles.rootAfter}>
                        <Image source={images.logo} style={rootStyle.logoSmall} />
                        <View style={{ gap: 11 }}>
                            <Text style={[styles.title, { textAlign: 'center' }]}>{lang({ id: 'good_picture' })}</Text>
                            <Text style={[styles.subTitle, { textAlign: 'center' }]}>{lang({ id: 'changes_are_not' })}</Text>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Image source={photo?.uri} style={styles.photo} />
                        </View>
                    </View>

                    <View style={styles.bottomMulti} >
                        <Button type={2} style={{ flex: 1 }} onPress={startPhoto}>{lang({ id: 'retake_photo' })}</Button>
                        <Button style={{ width: 120 }} onPress={submitFunc} load={load}>{lang({ id: 'done' })}</Button>
                    </View>
                </View>
            )}


            <Camera
                open={camera}
                close={() => {
                    setCamera(false)
                }}
                onSubmit={takePhoto}
                mode="circle"
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
            paddingTop: 20,
            gap: 40,
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
            alignItems: 'center',
            gap: 15
        },
        itemText: {
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
            width: 271,
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        }
    })

    return { styles }
}