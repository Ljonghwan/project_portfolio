import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, useWindowDimensions } from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import CheckBox from '@/components/CheckBox';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, regPhone } from '@/libs/utils';
import fonts from '@/libs/fonts';

import { useDriverData, useUser, useAlert } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { styles } = useStyle();

    const { setDriverData } = useDriverData();
    const { reload, mbData } = useUser();
    const { openAlertFunc } = useAlert();

    const startFunc = () => {
        setDriverData('init');
        router.push(routes.joinDriverChoice);
        // router.push(routes.joinDriverInsurance);
    }

    const submitPassengerAlert = (level) => {
        
        if (mbData?.level === level) {
            router.dismissAll();
            return;
        }

        /** 
         * 현재 진행중인 내역 검사
         * 유형 변경시 진행중이던 건 전체 취소
        */
        
        openAlertFunc({
            label: lang({ id: 'you’re_already_using_a_service' }),
            title: lang({ id: 'you’re_already_using_a_service_info' }),
            onCencleText: lang({ id: 'no' }),
            onPressText: lang({ id: 'yes' }),
            onCencle: () => { },
            onPress: () => {
                submitPassengerFunc(level)
            }
        })
    }

    /**
     * 상태를 탑승자 or 운전자로 변경
     * @returns 
     */
    const submitPassengerFunc = async (level) => {

        if (level === 2) {
            /** 
             * 드라이버 신청 상태 검사
             * 신청 내역이있고, 승인대기, 승인완료 상태인경우 유형 변경 API
             * 아닌경우 신청페이지로
            */
            // if ((!mbData?.applyCarpoolInfo || mbData?.applyCarpoolInfo?.status === 4));

            startFunc();

        } else {
            const sender = { level: level }

            const { data, error } = await API.post('/v1/user/changeLevel', sender);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            await reload();

            setTimeout(() => {
                router.dismissAll();
            }, 100)
        }

    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <View style={styles.root}>
                <View style={{ gap: 11 }}>
                    <Text style={styles.title}>{lang({ id: 'welcome_taseta' })}</Text>
                    <Text style={styles.subTitle}>{lang({ id: 'experience_new_cultu' })}</Text>
                    <Text style={styles.subTitle2}>{mbData?.level < 2 ? lang({ id: 'currently_passenger' }) : lang({ id: 'currently_driver' })}</Text>
                </View>

                <View style={{ alignItems: 'center', justifyContent: 'center', gap: 50 }}>
                    <TouchableOpacity style={styles.mode} activeOpacity={0.7} onPress={() => submitPassengerAlert(1)}>
                        <Image source={images.mode_passenger} style={styles.modeImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mode} activeOpacity={0.7} onPress={() => submitPassengerAlert(2)}>
                        <Image source={images.mode_driver} style={styles.modeImage} />
                    </TouchableOpacity>
                </View>

            </View>

        </View>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            gap: 48
        },
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold,
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
        subTitle2: {
            color: colors.taseta,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.725,
            textAlign: 'center'
        },
        mode: {
            maxWidth: width - (rootStyle.side * 2),
            height: height / 4,
            aspectRatio: 330 / 222,
            borderRadius: 12,
            overflow: 'hidden'
        },
        modeImage: {
            width: '100%',
            height: '100%'
        },
    })

    return { styles }
}