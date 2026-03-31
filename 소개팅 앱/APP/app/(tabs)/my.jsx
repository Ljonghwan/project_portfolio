import { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";

import dayjs from 'dayjs';
import * as Application from 'expo-application';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Term from '@/components/Term';
import Profile from '@/components/Profile';
import Button from '@/components/Button';
import Icon from '@/components/Icon';

import Level from '@/components/badges/Level';
import Simple from '@/components/badges/Simple';

import { useUser, useAlert, useEtc } from '@/libs/store';

import consts from '@/libs/consts';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import { ToastMessage } from '@/libs/utils';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';

import API from '@/libs/api';
import fonts from '@/libs/fonts';

const links = [

    // { title: '전화 소명', route: routes.chatCallObjection, icon: images.my_top },
    // { title: '1% 회원 승인', route: routes.topJoinAgree, icon: images.my_top },

    { title: '1% 회원 지원하기', route: routes.topJoin, level: 1, icon: images.my_top },
    { title: '소개팅 환불 내역', route: routes.refund, level: 1, icon: images.wallet2},
    
    // { title: '리매치 라운지', route: routes.rematchAcceptList, level: 2 },

    { title: '공지사항', route: routes.notice, icon: images.my_notice },
    // { title: '이벤트', route: routes.event },

    { title: '1:1문의', route: routes.cs, icon: images.my_cs },
    { title: 'FAQ', route: routes.faq, icon: images.my_faq },
    
    { title: '개인정보 처리 방침', route: routes.terms, param: { idx: 2, title: '개인정보 처리 방침' }, icon: images.my_term },
    { title: '이용약관', route: routes.terms, param: { idx: 1, title: '이용약관' }, icon: images.my_term2 },
    
    // { title: '탑 비주얼 소개팅 서비스 가이드', route: routes.terms, param: { idx: 7, title: '탑 비주얼 소개팅 서비스 가이드' }, level: 2 },

    { title: '앱 정보', route: routes.version, icon: images.my_app },
    { title: '차단 목록', route: routes.block, icon: images.my_block },
]

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const { isInitialized, isRegistered, currentCall, callInvite, audioDevices, deviceToken, error, makeCall, unregister } = useTwilioVoice();

    const { token, pushToken, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { goTop } = useEtc();

    const listRef = useRef(null);

    useFocusEffect(
        useCallback(() => {
            if (mbData?.level === 2 && !mbData?.isVisual) {
                setTimeout(() => {
                    router.canDismiss() && router.dismissAll();
                    router.replace(routes.topJoinAgree); // 탑비주얼 신청 승인 됬고, 가이드 확인 안한경우
                }, 200)
            }
        }, [mbData])
    );

    useEffect(() => {
        console.log(Platform.OS, ' - isInitialized', isInitialized);
        console.log(Platform.OS, ' - isRegistered', isRegistered);
        console.log(Platform.OS, ' - error', error);
    }, [isInitialized, isRegistered, currentCall, callInvite, error]);

    useEffect(() => {

    }, [mbData])


    useEffect(() => {
        if(goTop) listRef?.current?.scrollTo(0);
    }, [goTop])

    const setProfileFunc = async (v) => {

        const { data, error } = await API.post('/v1/user/changeProfile', {
            profile: v
        });
        console.log('data', data);

        if(error) {
            ToastMessage(error?.message);
            return;
        }

        ToastMessage('저장 되었습니다.');
        reload();
    }

    const testFunc = () => {
        openAlertFunc({
            label: `소개팅 종료`,
            title: `채팅방을 나가면 대화내용이\n모두 삭제되고 채팅목록에서도 사라집니다.`,
            onCencleText: "닫기",
            onPressText: "확인",
            onCencle: () => {},
            onPress: () => {}
        })
        return;
        
        openAlertFunc({
            alertType: 'Sheet',
            component: <Term />
        })
    }

    const header = {
        title: '마이',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.medium,
        },
        left: {
            icon: 'menu_3_on',
            iconStyle: {
                width: 32,
                height: 32,
            }
        },
        right: {
            bell: true
        }
    };
    return (
        <Layout header={header} statusBar={'dark'} backgroundColor={colors.white}>

            <ScrollView
                ref={listRef}
                style={{
                    flex: 1,
                }}
                contentContainerStyle={{
                    paddingTop: 13,
                    paddingBottom: rootStyle.bottomTabs.height + insets?.bottom + 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* <Text>{isRegistered ? "Registered" : "Unregistered"}</Text>
                <Text>{error ? error : "No error"}</Text>

                <Button onPress={() => {
                    makeCall(Platform.OS === 'ios' ? 'client:sasohan_user_100029' : 'client:sasohan_user_100006');
                }}>Make Call</Button>

                <Button onPress={async () => {
                    const { data, error } = await API.post('/v1/user/createTwilioToken');
                    console.log('data', data, error);
                    if(error) return;
            
                    TwilioVoiceService.init(data);
                }}>register</Button>
                <Button onPress={() => {
                    unregister()
                }}>Unregister</Button> */}
                
                <View style={styles.top}>

                    <View style={styles.profileBox}>
                        <View style={{ }}>
                            <Profile style={{ width: width <= 320 ? 48 : 64 }} styleCamera={{ width: 24 }} profile={mbData?.profile} setProfile={setProfileFunc} />
                        </View>
                        <View style={{ gap: width <= 320 ? 5 : 10, flex: 1 }}>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                                <Text style={[styles.name, { fontSize: width <= 320 ? 16 : 18 }]} numberOfLines={1}>{mbData?.nickName}</Text>
                                <Level level={mbData?.level} />
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 9 }]}>
                                {mbData?.type !== 'email' && <Image source={images?.[mbData?.type]} style={rootStyle.default} /> }
                                <Text style={styles.email} numberOfLines={1}>{mbData?.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.settingButton, { width: width <= 320 ? 54 : 64 }]} onPress={() => { router.navigate(routes.setting) }} >
                            <Image source={images.setting} style={rootStyle.default} />
                            <Text style={{...rootStyle.font(width <= 320 ? 10 : 12, colors.primary, fonts.medium)}}>프로필 설정</Text>
                        </TouchableOpacity>
                    </View>



                    {/* <View style={[styles.profileBox, { justifyContent: 'space-between' }]}>
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                            <Simple title={mbData?.userDetail?.sido}/>
                            <Simple title={mbData?.userDetail?.sigungu}/>
                            <Simple title={dayjs(mbData?.birth).format('YY')}/>
                        </View>
                        <TouchableOpacity style={styles.button1} onPress={() => router.navigate(routes.settingProfile)}>
                            <Text style={styles.button1Text}>프로필</Text>
                        </TouchableOpacity>
                    </View> */}


                    <View style={styles.menu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => router.navigate(routes.orderFlirting)}>
                            <Image source={images.picket} style={[rootStyle.picket, { height: 48 }]} />
                            <Text style={styles.menuItemText}>{mbData?.level === 1 ? "픽켓 내역" : "픽켓 및 정산 내역"}</Text>
                        </TouchableOpacity>

                        <View style={styles.bar}/>

                        {mbData?.level === 1 ? (
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.navigate(routes.orderPayment)}>
                                <Image source={images.wallet} style={rootStyle.default48} />
                                <Text style={styles.menuItemText}>결제 내역</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.navigate(routes.paymentFlirtingSettlement)}>
                                <Image source={images.settlement} style={rootStyle.default48} />
                                <Text style={styles.menuItemText}>정산하기</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.bar}/>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.navigate(routes.orderMeet)}>
                            <Image source={images.meeting_history} style={rootStyle.default48} />
                            <Text style={styles.menuItemText}>소개팅 내역</Text>
                        </TouchableOpacity>
                    </View>

                    
                </View>

                <View
                    style={{
                        flex: 1,
                        paddingBottom: 16
                    }}
                >
                    
                    {links?.filter(item => !item?.level || item?.level === mbData?.level )?.map((x, i) => {
                        return (
                            <TouchableOpacity key={i} activeOpacity={0.7} style={styles.list} onPress={() => {
                                router.navigate({
                                    pathname: x?.route,
                                    params: x?.param
                                })
                            }}>
                                <View style={[rootStyle.flex, { gap: 10 }]}>
                                    <Image source={x?.icon} style={rootStyle.default26} />
                                    <Text style={styles.listTitle}>{x?.title}</Text>
                                </View>
                                <Image source={images.link} style={rootStyle.default} />
                            </TouchableOpacity>
                        )
                    })}

                    <TouchableOpacity style={styles.logout} activeOpacity={0.7} onPress={() => { logout();}}>
                        <Image source={images.logout} style={rootStyle.default} />
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>


            
        </Layout>
    )
}



const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        top: {
            gap: 24,
            paddingHorizontal: rootStyle.side,
            marginBottom: 12
        },
        profileBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 24,
            backgroundColor: colors.white,
            elevation: 10, // 안드로이드 그림자
			shadowColor: colors.black, // iOS 그림자
			shadowOffset: { width: 0, height: 0 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
        },
        name: {
            fontSize: 18,
            lineHeight: 24,
            letterSpacing: -0.45,
            color: colors.dark,
            fontFamily: fonts.medium,
            flexShrink: 1
        },
        email: {
            fontSize: 12,
            lineHeight: 20,
            letterSpacing: -0.3,
            color: colors.text_sub,
            flexShrink: 1
        },

        settingButton: {
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            width: 64,
            aspectRatio: 1,
            backgroundColor: colors.main2,
            borderRadius: 16
        },
        menu: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            borderRadius: 24,
            backgroundColor: colors.white,
            elevation: 10, // 안드로이드 그림자
			shadowColor: colors.black, // iOS 그림자
			shadowOffset: { width: 0, height: 0 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
        },
        menuItem: {
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: 11,
            flex: 1
        },
        menuItemText: {
            fontSize: width <= 320 ? 12 : 14,
            lineHeight: 20,
            letterSpacing: width <= 320 ? -0.5 : -0.35,
            fontFamily: fonts.medium,
            color: colors.primary3,
            textAlign: 'center',
        },
        bar: {
            width: 1,
            height: 62,
            backgroundColor: colors.greyC
        },
        list: {
            paddingHorizontal: 24,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        listTitle: {
            fontSize: 16,
            letterSpacing: -0.4,
            fontFamily: fonts.medium,
            color: colors.text_link,
        },

        logout: {
            height: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            paddingHorizontal: 36,
            backgroundColor: colors.greyD9,
            borderRadius: 20,
            gap: 10,
            marginTop: 16
        },
        logoutText: {
            fontSize: 16,
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold,
            color: colors.grey6D,
        },



















       
        



        button1: {
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 12,
            backgroundColor: colors.mainOp5,
            borderRadius: 8
        },
        button1Text: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            color: colors.main,
        },
        
    })

    return { styles }
}