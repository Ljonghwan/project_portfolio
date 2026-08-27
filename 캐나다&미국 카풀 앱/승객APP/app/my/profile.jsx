import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';

import { Stack, router, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Profile from '@/components/Profile';
import LevelTag from '@/components/LevelTag';

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

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [applyInfo, setApplyInfo] = useState(null);
    const [profileInfo, setProfileInfo] = useState(null);
    const [idInfo, setIdInfo] = useState(null);
    const [backgroundInfo, setBackgroundInfo] = useState(null);

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState({});

    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );

    const dataFunc = async () => {

        const { data, error } = await API.post('/v2/auth/info');

        setApplyInfo(data?.applyInfo);
        setProfileInfo(data?.profileInfo);
        setIdInfo(data?.idInfo);
        setBackgroundInfo(data?.backgroundInfo);

    }


    const deleteAlert = () => {
        openAlertFunc({
            label: lang({ id: 'are_you_sure_1' }),
            title: lang({ id: 'deleting_your_accoun' }),
            onCencleText: lang({ id: 'no' }),
            onPressText: lang({ id: 'delete' }),
            onCencle: () => { },
            onPress: deleteFunc
        })
    }

    const deleteFunc = async () => {
        openLoader();

        const { data, error } = await API.post('/v2/my/leave');

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }

            ToastMessage(lang({ id: 'successfully_withdrawn' }));
            logout();
        }, 1000)
    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'profile_management' })
    };

    return (
        <Layout header={header}>
            <ScrollView
                style={styles.root}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: rootStyle.bottomTabs.height + insets.bottom, gap: 40 }}
            >

                <View style={{ alignItems: 'center', justifyContent: 'center', gap: 15 }}>
                    <Profile profile={mbData?.profile} />
                    <Text style={styles.name} >{mbData?.firstName} {mbData?.lastName}</Text>
                </View>


                <View style={{ gap: 15 }}>
                    <Text style={styles.title}>{lang({ id: 'basic_information' })}</Text>

                    {mbData?.type === 'email' && (
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'password_1' })}</Text>
                            <TouchableOpacity hitSlop={10} activeOpacity={0.7} onPress={() => router.push(routes.myEditPassword)}>
                                <Text style={styles.listText4}>{lang({ id: 'update' })}</Text>
                            </TouchableOpacity>
                        </View>
                    )}


                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'phone' })}</Text>
                        <View>
                            <Text style={styles.listText1}>{hpHypen(mbData?.country, mbData?.hp)}</Text>
                        </View>
                    </View>
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'email_1' })}</Text>
                        <View style={styles.listData}>
                            <Image source={images[mbData?.type + '_small']} style={rootStyle.default18} />
                            <Text style={styles.listText1} numberOfLines={1}>{mbData?.email}</Text>
                        </View>
                    </View>
                    {(mbData?.passenger && mbData?.level > 0) && (
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'ride_type' })}</Text>
                            <View style={styles.listData}>
                                <LevelTag />
                            </View>
                        </View>
                    )}

                </View>

                <TouchableOpacity style={{ gap: 15 }} activeOpacity={0.7} onPress={() => router.push(routes.verification)}>
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <Text style={styles.title}>{lang({ id: 'additional_informati' })}</Text>
                        <Image source={images.link} style={rootStyle.default} />
                    </View>

                    {/* 신분증 인증 완료시 */}
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'id_verify' })}</Text>

                        {idInfo?.status === 3 ? (
                            <View style={styles.listData}>
                                <Text style={styles.listText3}>{lang({ id: 'verified' })}</Text>
                            </View>
                        ) : (
                            <View style={styles.listData}>
                                <Text style={styles.listText2}>{lang({ id: 'not_verified' })}</Text>
                                {/* <Text style={styles.listText4}>{lang({ id: 'optional' })}</Text> */}
                            </View>
                        )}
                    </View>

                    {/* 범죄 이력 조회 인증 완료시 */}
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'criminal_record_verify' })}</Text>

                        {backgroundInfo?.status === 3 ? (
                            <View style={styles.listData}>
                                <Text style={styles.listText3}>{lang({ id: 'verified' })}</Text>
                            </View>
                        ) : (
                            <View style={styles.listData}>
                                <Text style={styles.listText2}>{lang({ id: 'not_verified' })}</Text>
                            </View>
                        )}
                    </View>

                    {/* 운전자 인증 완료시 */}
                    {/* <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'driver_verify' })}</Text>

                        
                        {true ? (
                            <View style={styles.listData}>
                                <Text style={styles.listText3}>{lang({ id: 'drivers_license_5' })}</Text>
                            </View>
                        ) : (
                            <View style={styles.listData}>
                                <Text style={styles.listText2}>{lang({ id: 'not_verified' })}</Text>
                            </View>
                        )}
                    </View> */}

                </TouchableOpacity>


                {/* 운전자 인증 완료됬고, 차량정보 있을시 */}
                {/* {true && (
                    <TouchableOpacity style={{ gap: 15 }} activeOpacity={0.7}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={styles.title}>{lang({ id: 'vehicle_information' })}</Text>
                            <Image source={images.link} style={rootStyle.default} />
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>

                            <View style={styles.listData}>
                                <Text style={styles.listText1} numberOfLines={2}>Toyoota Corolla Cross</Text>
                            </View>
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>

                            <View style={styles.listData}>
                                <Text style={styles.listText1} >KAE 364</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )} */}


                <Button type={2} onPress={() => { router.push(routes.myCarpoolStyle) }}>{lang({ id: 'set_your_ride' })}</Button>

                <TouchableOpacity style={rootStyle.flex} onPress={deleteAlert}>
                    <Text style={styles.deleteText}>{lang({ id: 'delete_account' })}</Text>
                </TouchableOpacity>


            </ScrollView>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
        },
        name: {
            color: colors.main,
            fontFamily: fonts.semiBold,
            fontSize: 18,
            letterSpacing: -0.54,
        },
        title: {
            color: colors.main,
            fontFamily: fonts.semiBold,
            fontSize: 18,
            letterSpacing: -0.54,
        },
        list: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20
        },
        label: {
            color: colors.sub_1,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.54,
        },
        listData: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 5
        },
        listText1: {
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.54,
            flexShrink: 1
        },
        listText2: {
            color: colors.sub_1,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.54,
        },
        listText3: {
            color: colors.taseta,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.54,
        },
        listText4: {
            color: colors.sub_1,
            fontSize: 16,
            letterSpacing: -0.48,
        },
        deleteText: {
            color: colors.text_popup,
            fontSize: 16,
        }
    })

    return { styles }
}