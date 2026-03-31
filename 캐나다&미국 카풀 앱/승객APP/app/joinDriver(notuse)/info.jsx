import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView, Platform } from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Accordion from '@/components/Accordion';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

import { ToastMessage, regPhone } from '@/libs/utils';
import { useDriverData } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { styles } = useStyle();

    const { driverType, setDriverData } = useDriverData();

    const [level, setLevel] = useState(null);
    const [load, setLoad] = useState(false);

    const submitFunc = () => {
        router.push(routes.joinDriverProfile);
    }

    return (
        <View style={{ flex: 1, gap: 20, backgroundColor: colors.white }}>
            <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: 20, gap: 30 }}>
                <View style={{ gap: 11 }}>
                    <Text style={styles.title}>{lang({ id: driverType === 1 ? 'applying_carpool_dri' : 'applying_ride_share' })}</Text>
                    <Text style={styles.subTitle}>{lang({ id: driverType === 1 ? 'tell_you_about' : 'tell_you_about_1' })}</Text>
                </View>

                <View>
                    <Image source={images.guide_1} style={rootStyle.default80} />
                    <View style={styles.list}>
                        <Text style={styles.listTitle}>{lang({ id: 'cant_do_it' })}</Text>
                        <Text style={styles.listMessage}>{lang({ id: 'profile_you_submitte' })}</Text>
                    </View>
                </View>

                <View>
                    <Image source={images.guide_2} style={rootStyle.default80} />
                    <View style={styles.list}>
                        <TouchableOpacity style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 2 }]} activeOpacity={0.7} onPress={() => router.push(routes.joinDriverLicenseList)}>
                            <Text style={styles.listTitle}>{lang({ id: 'drivers_license' })}</Text>
                            <Image source={images.question} style={rootStyle.default} />
                        </TouchableOpacity>

                        <Text style={styles.listMessage}>{lang({ id: 'can_only_take' })}</Text>
                    </View>
                </View>

                <View>
                    <Image source={images.guide_3} style={rootStyle.default80} />
                    <View style={styles.list}>
                        <Text style={styles.listTitle}>{lang({ id: 'picture_vehicle' })}</Text>
                        <Text style={styles.listMessage}>{lang({ id: 'picture_vehicle_for' })}</Text>
                    </View>
                </View>

                <View>
                    <Image source={images.guide_4} style={rootStyle.default80} />
                    <View style={styles.list}>
                        <Text style={styles.listTitle}>{lang({ id: 'license_plate' })}</Text>
                        <Text style={styles.listMessage}>{lang({ id: 'please_enter_relevan' })}</Text>
                    </View>
                </View>

                {driverType === 2 && (
                    <>
                        <View>
                            <Image source={images.guide_5} style={rootStyle.default80} />
                            <View style={styles.list}>
                                <Text style={styles.listTitle}>{lang({ id: 'taxi_operated_licens' })}</Text>
                                <Text style={styles.listMessage}>{lang({ id: 'drivers_authenticati' })}</Text>
                            </View>
                        </View>

                        <View>
                            <Image source={images.guide_6} style={rootStyle.default80} />
                            <View style={styles.list}>
                                <Text style={styles.listTitle}>{lang({ id: 'commercial_auto_insu' })}</Text>
                                <Text style={styles.listMessage}>{lang({ id: 'check_if_you' })}</Text>
                            </View>
                        </View>
                    </>
                )}

                <View>
                    <Image source={images.guide_7} style={rootStyle.default80} />
                    <View style={styles.list}>
                        <Text style={styles.listTitle}>{lang({ id: 'driver_safety_check' })}</Text>
                        <Text style={styles.listMessage}>{lang({ id: 'with_your_consent' })}</Text>
                    </View>
                </View>

                <View style={styles.bottom}>
                    <Button
                        // disabled={!level}
                        style={{ width: 120 }}
                        onPress={submitFunc}>{lang({ id: 'continue' })}
                    </Button>
                </View>
            </ScrollView>

            
        </View>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
        },
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold
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


        list: {
            gap: 5,
            marginTop: 17
        },
        listTitle: {
            color: colors.main,
            fontSize: 20,
            fontFamily: fonts.extraBold
        },
        listMessage: {
            color: colors.main,
            fontSize: 16,
            fontFamily: fonts.medium,
            letterSpacing: -0.64
        }
    })

    return { styles }
}