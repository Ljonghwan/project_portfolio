import { useEffect, useState, useCallback, use } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from "expo-router";
import * as Application from 'expo-application';
import { Image } from 'expo-image';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Profile from '@/components/Profile';
import LevelTag from '@/components/LevelTag';
import Button from '@/components/Button';
import Tag from '@/components/Tag';

import { useUser, useAlert, useConfig, useLottie, useGps, useEtc } from '@/libs/store';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import consts from '@/libs/consts';
import fonts from '@/libs/fonts';

import lang from '@/libs/lang';

import { ToastMessage, hpHypen, getTreeBadge, checkBackgroundGpsPermission, startBackgroundGps } from '@/libs/utils';

import API from '@/libs/api';


export default function Page() {

    const { styles } = useStyle();

    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { token, mbData, login, logout, reload } = useUser();
    const { badges, configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { lat, lng } = useGps();
    const { openLottie } = useLottie();
    const { appActiveStatus } = useEtc();
    

    const [treeBadge, setTreeBadge] = useState(null);

    const [applyInfo, setApplyInfo] = useState(null);
    const [profileInfo, setProfileInfo] = useState(null);
    const [backgroundInfo, setBackgroundInfo] = useState(null);
    const [drivingInfo, setDrivingInfo] = useState(null);

    const [msgView, setMsgView] = useState(false);

    const [links, setLinks] = useState([
        { title: 'my_driver_applications', route: routes.application },
        { title: 'my_rides', route: routes.myRides, level: [2, 3] }, // 완료 (나의 운행정보 페이지 기사용)
        { title: 'history', route: routes.history, level: [2, 3] }, // API 연결 필요    

        { title: 'reviews', route: routes.reviews, level: [2, 3], param: { idx: mbData?.idx } },  // 완료
        { title: 'carbon_savings', route: routes.myCarbon },
        

        { title: 'notices_events', route: routes.notice }, // 완료
        
        // { title: 'coupons_mileage', route: routes.coupon, level: [1] }, // 완료
        // { title: 'payment_management', route: routes.myPayment, level: [1] }, // 완료
        // { title: 'my_vehicle', route: routes.notice, level: [2, 3] }, // 내 정보에서 가능

        { title: 'blocked_list', route: routes.myBlock },  // 완료
        { title: 'notifications', route: routes.myNotifications }, // 완료
        { title: 'language', route: routes.myLanguage }, // 완료

        { title: 'support', route: routes.mySurport }, // 완료

        { title: 'terms_service', route: routes.myTerms }, // 완료

        // { title: 'logs', route: routes.logs }, // 테스트용
    ]);

    useFocusEffect(
        useCallback(() => {
            if (appActiveStatus === 'active') {
                dataFunc();
            } 
        }, [appActiveStatus])
    );
    

    useFocusEffect(
        useCallback(() => {
            checkBadgeUpdate();
        }, [mbData])
    );


    useEffect(() => {
        dataFunc();
    }, [])

    useEffect(() => {

        setTreeBadge( getTreeBadge({ badges: badges, userBadges: mbData?.badges }) );
        
    }, [mbData])

    const dataFunc = async () => {
        console.log('my info load ~');
        const { data, error } = await API.post('/v2/auth/info');
        
        setApplyInfo(data?.applyInfo);
        setProfileInfo(data?.profileInfo);
        setDrivingInfo(data?.drivingInfo);
        setBackgroundInfo(data?.backgroundInfo);

        setMsgView(
            (data?.applyInfo?.status < 3 || data?.applyInfo?.status === 4) ||
            (data?.profileInfo?.status < 3 || data?.profileInfo?.status === 4) ||
            (data?.drivingInfo?.status < 3 || data?.drivingInfo?.status === 4) ||
            (data?.backgroundInfo?.status < 3 || data?.backgroundInfo?.status === 4)
        )

    }


    const checkBadgeUpdate = async () => {
        console.log("checkBadgeUpdate");

        if(mbData?.isBadgeUpdate ) {
            openLottie({ 
                source: {uri: consts.badgeAnimation},
                type: 'badge'
            });   

            const { data, error } = await API.post('/v2/my/badgeUpdateCheck', { status: false });
        }
    }

    const header = {
        leftTitle: lang({ id: 'my_page' })
    };

    return (
        <Layout header={header}>
            <ScrollView
                style={styles.root}
                contentContainerStyle={{ paddingBottom: rootStyle.bottomTabs.height + insets.bottom + 20, gap: 25 }}
            >
                <TouchableOpacity style={[rootStyle.flex, { gap: 10 }]} activeOpacity={0.7} onPress={() => { router.push(routes.myProfile) }}>
                    <View style={[rootStyle.flex, { flex: 1, gap: 10 }]}>
                        <Profile style={{ width: 55, height: 55 }} profile={mbData?.profile} />
                        <View style={{ flex: 1, gap: 5 }}>
                            <View style={[rootStyle.flex, { flexWrap: 'wrap', gap: 5, justifyContent: 'flex-start' }]}>
                                <Text style={styles.name} >{mbData?.firstName} {mbData?.lastName}</Text>
                                <LevelTag />
                            </View>
                            <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                                <Text style={styles.hp} >{hpHypen(mbData?.country, mbData?.hp)}</Text>
                            </View>

                        </View>
                    </View>
                    <Image source={images.link} style={rootStyle.default} />
                </TouchableOpacity>

                <View style={{ gap: 25 }}>
                    
                    {msgView && (
                        <Animated.View entering={FadeInLeft} style={{ gap: 4 }}>
                            {/* 가입 및 재신청 문구 및 라이드셰어 추가 신청 문구 */}
                            {applyInfo?.status < 3 ? (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_driver_registration' })}</Text>
                            ) : applyInfo?.status === 4 && (
                                <Text style={[styles.help, { color: colors.text_popup }]}>{lang({ id: 'your_profile_was_declined' })}</Text>
                            )}

                            {/* 프로필사진 변경 신청 문구 */}
                            {profileInfo?.status < 3 ? (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_your_profile' })}</Text>
                            ) : profileInfo?.status === 4 && (
                                <Text style={[styles.help, { color: colors.text_popup }]}>{lang({ id: 'your_profile_was_declined' })}</Text>
                            )}

                            {/* 범죄이력조회 신청 문구 */}
                            {backgroundInfo?.status < 3 ? (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_criminal' })}</Text>
                            ) : backgroundInfo?.status === 4 && (
                                <Text style={[styles.help, { color: colors.text_popup }]}>{lang({ id: 'your_criminal_was_declined' })}</Text>
                            )}

                            {/* 운전이력검증 신청 문구 */}
                            {drivingInfo?.status < 3 ? (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_driving_record' })}</Text>
                            ) : drivingInfo?.status === 4 && (
                                <Text style={[styles.help, { color: colors.text_popup }]}>{lang({ id: 'your_driving_record_was_declined' })}</Text>
                            )}
                        </Animated.View>
                    )}
                    
                    
                        
                            
                    {/* 가입 승인 대기 */}
                    {/* {(!mbData?.carpool && !mbData?.rideShare) ? (
                        <>
                            {mbData?.applyInfo?.status === 4 ? (
                                <View style={{ gap: 4 }}>
                                    <Text style={[styles.help, { color: colors.text_popup }]}>{lang({ id: 'this_application_was_declined' })}</Text>
                                    <Text style={[styles.help, { color: colors.text_popup }]}>{mbData?.applyInfo?.desc}</Text>
                                </View>
                            ) : (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_account_approval' })}</Text>
                            )}
                        </>
                    ) : (
                        <View>
                            <Text style={styles.help}>{lang({ id: 'waiting_for_your_profile' })}</Text>

                            {mbData?.applyInfo?.status < 3 && (
                                <Text style={styles.help}>{lang({ id: 'waiting_for_driver_registration' })}</Text>
                            )}
                            

                            <Text style={{ fontFamily: 'SUITE_900', fontSize: 18 }}>{lat}{lng}My 페이지입니다12 3/////{Application.nativeApplicationVersion}</Text>
                        </View>
                    )} */}

                    <Pressable style={styles.badge} onPress={() => router.push(routes.myBadge)}>
                        <Image source={consts.s3Url + treeBadge?.imgPath} style={{ width: 60, height: 60}} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...rootStyle.font(14, colors.sub_1, fonts.medium) }}>{lang({ id: 'badge' })}</Text>
                            <Text numberOfLines={2} style={{ ...rootStyle.font(16, colors.main, fonts.semiBold) }}>{lang({ id: treeBadge?.title })}</Text>
                        </View>
                    </Pressable>

                    <Button type={2} onPress={() => router.push(routes.myMatching)}>{lang({ id: 'matching_preferences' })}</Button>

                    {/* <View style={[rootStyle.flex, { gap: 6 }]}>
                        <Button type={7} style={{ flex: 1 }} onPress={() => router.push(routes.joinDriver)}>Activity Type</Button>
                        <Button type={7} style={{ flex: 1 }} onPress={() => startBackgroundGps()}>CO₂ Saved</Button>
                        <Button type={7} style={{ flex: 1 }} onPress={() => checkBackgroundGpsPermission()}>Favorites</Button>
                    </View> */}
                    {/* <View style={[rootStyle.flex, { gap: 6 }]}>
                        <Button type={7} style={{ flex: 1 }} onPress={() => router.push(routes.myCarbon)}>{lang({ id: 'carbon_savings' })}</Button>
                        <Button type={7} style={{ flex: 1 }} onPress={() => router.push(routes.myFav)}>{lang({ id: 'favorites' })}</Button>
                    </View> */}

                    <View
                        style={{
                            flex: 1,
                            gap: 18
                        }}
                    >
                        {links?.filter(item => !item?.level || item?.level?.includes(mbData?.rideShare ? 3 : mbData?.carpool ? 2 : 0))?.map((x, i) => {
                            return (
                                <TouchableOpacity key={i} activeOpacity={0.7} style={styles.list} onPress={() => {
                                    router.push({
                                        pathname: x?.route,
                                        params: x?.param
                                    })
                                }}>
                                    <Text style={styles.listTitle}>{lang({ id: x?.title })}</Text>
                                    <Image source={images.link} style={rootStyle.default} />
                                </TouchableOpacity>
                            )
                        })}

                        <View style={[rootStyle.flex, { justifyContent: 'space-between', borderTopColor: colors.sub_1, borderTopWidth: 1 }]}>
                            <TouchableOpacity style={{ paddingVertical: 14 }} activeOpacity={0.7} onPress={() => {
                                router.push(routes.myVersion)
                            }}>
                                <Text style={{ ...rootStyle.font(16, colors.sub_1) }}>{lang({ id: 'app_version' })} {Application.nativeApplicationVersion}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ paddingVertical: 14 }} activeOpacity={0.7} onPress={() => { logout(); }}>
                                <Text style={{ ...rootStyle.font(16, colors.text_popup) }}>{lang({ id: 'log_out' })}</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>

            </ScrollView>
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

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
        hp: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            letterSpacing: -0.48,
        },
        help: {
            color: colors.taseta,
            fontFamily: fonts.medium,
            fontSize: 16,
            letterSpacing: -0.32,
        },

        list: {
            height: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        listTitle: {
            fontSize: 16,
            letterSpacing: -0.32,
            fontFamily: fonts.medium,
            color: colors.main,
        },
        badge: {
            width: '100%',
            height: 80,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 7,
            borderRadius: 12,
            backgroundColor: colors.white,
            paddingHorizontal: 12,

            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        }
    })

    return { styles }
}
