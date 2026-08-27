import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    Keyboard,
    Platform,
    Pressable
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Rating } from '@kolking/react-native-rating';
import { useKeyboardState, KeyboardAwareScrollView } from "react-native-keyboard-controller";

// component
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Input from '@/components/Input';
import Empty from '@/components/Empty';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, regEmail, numDoler, imageViewer } from '@/libs/utils';

import { useLang, useUser, useAlert, useConfig, useDriverData } from '@/libs/store';

export default function Page({ }) {

    const { idx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { setDriverDataStart } = useDriverData();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    const [item, setItem] = useState(null);
    const [carPhotos, setCarPhotos] = useState([]);
    const [etcImages, setEtcImages] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            dataFunc()
        }, [idx])
    );

    const dataFunc = async () => {

        let sender = {
            idx: idx
        }

        const { data, error } = await API.post('/v2/auth/driverApplyDetail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);
        setCarPhotos([
            consts.s3Url + data?.carImageMain,
            consts.s3Url + data?.carImageFront,
            consts.s3Url + data?.carImageSide,
            consts.s3Url + data?.carImageRear,
        ]);
        setEtcImages(data?.etcImages?.map(x => consts.s3Url + x));

        setTimeout(() => {
            // setList([]);

            setInitLoad(false);

        }, consts.apiDelay)
    }

    const reapplyFunc = () => {

        setDriverDataStart({
            startDriverType: item?.driverType,
            driverType: item?.driverType,
            driveLicence: item?.driveLicence,
            carImageMain: item?.carImageMain,
            carImageFront: item?.carImageFront,
            carImageSide: item?.carImageSide,
            carImageRear: item?.carImageRear,

            carNumber: item?.carNumber,
            carType: item?.carType,
            seater: item?.seater + "",

            bank: item?.bank,
            bankNumber: item?.bankNumber,
            bankUser: item?.bankUser,
            etcImages: item?.etcImages
        })

        router.push(routes.joinDriverChoice)
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'application_details' }),
    };


    return (
        <Layout header={header} >
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                keyboardDismissMode={'on-drag'}
                style={styles.root}
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 20,
                    gap: 20
                }}
            >
                <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }} numberOfLines={1}>{lang({ id: item?.driverType === 1 ? 'carpool_driver_application' : 'ride_share_driver_application' })}</Text>

                {
                    item?.status === 4 ? (
                        <View style={{ gap: 8 }}>
                            <Text style={{ ...rootStyle.font(16, colors.text_popup, fonts.medium) }}>{lang({ id: 'this_application_was_declined' })}</Text>
                            <View style={styles.decline}>
                                <Text style={{ ...rootStyle.font(16, colors.text_popup, fonts.medium) }}>
                                    {lang({ id: 'reason' })}:
                                    <Text style={{ ...rootStyle.font(16, colors.text_popup, fonts.regular) }}> {item?.desc}</Text>
                                </Text>
                            </View>
                        </View>
                    )
                    : item?.status === 3 ? <></>
                    : <Text style={{ ...rootStyle.font(16, colors.taseta, fonts.medium) }}>{lang({ id: 'this_application_is_under_review' })}</Text>
                }

                <View style={{ gap: 15 }}>
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'name' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{mbData?.firstName} {mbData?.lastName}</Text>
                    </View>
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'application_date' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{dayjs(item?.createAt).format('MMM DD, YYYY, h:mm A')}</Text>
                    </View>
                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'driver_photo' })}</Text>
                        <Pressable onPress={() => {
                            imageViewer({ index: 0, list: [consts.s3Url + item?.profile] })
                        }}>
                            <Image source={consts.s3Url + item?.profile} style={styles.image} />
                        </Pressable>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'drivers_license' })}</Text>
                        <Pressable onPress={() => {
                            imageViewer({ index: 0, list: [consts.s3Url + item?.driveLicence] })
                        }}>
                            <Image source={consts.s3Url + item?.driveLicence} style={styles.image} />
                        </Pressable>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'vehicle_photo' })}</Text>

                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {carPhotos?.map((x, i) => {
                                return (
                                    <Pressable key={'car_' + i} onPress={() => {
                                        imageViewer({ index: i, list: carPhotos })
                                    }}>
                                        <Image source={x} style={styles.image} />
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'vehicle_insurance' })}</Text>

                        <View style={[rootStyle.flex, { gap: 5 }]}>
                            {etcImages?.map((x, i) => {
                                return (
                                    <Pressable key={'etc_' + i} onPress={() => {
                                        imageViewer({ index: i, list: etcImages })
                                    }}>
                                        <Image source={x} style={styles.image} />
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.carType}</Text>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.carNumber}</Text>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'seating_capacity' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.seater}</Text>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'bank_account_number' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.bankNumber}</Text>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'bank_name' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.bank}</Text>
                    </View>

                    <View style={styles.list}>
                        <Text style={styles.label}>{lang({ id: 'name_on_account' })}</Text>
                        <Text numberOfLines={1} style={styles.content}>{item?.bankUser}</Text>
                    </View>

                </View>

                {item?.status === 4 && (
                    <Button onPress={reapplyFunc}>{lang({ id: 'reapply' })}</Button>
                )}

            </ScrollView>
        </Layout >
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },


        title: {
            ...rootStyle.font(18, colors.main, fonts.semiBold)
        },
        list: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10
        },
        label: {
            ...rootStyle.font(16, colors.sub_1, fonts.medium)
        },
        content: {
            ...rootStyle.font(16, colors.main),
            flexShrink: 1,
            textAlign: 'right',
        },
        image: {
            width: 44,
            aspectRatio: 1 / 1,
            borderRadius: 10,
            backgroundColor: colors.placeholder
        },
        decline: {
            borderWidth: 1,
            borderColor: colors.text_popup,
            borderRadius: 13,
            paddingVertical: 8,
            paddingHorizontal: 16
        }
    })

    return { styles }
}
