import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable, Share } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { io } from 'socket.io-client';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import LoadingRipple from '@/components/LoadingRipple';
import Select from '@/components/Select';
import BottomSheetTemplate from '@/components/BottomSheetTemplate';

import RoutesViewSimple from '@/components/Call/RoutesViewSimple';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen, numDoler, useBackHandler } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, useEtc } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { idx } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { appActiveStatus } = useEtc();

    const [item, setItem] = useState(null);

    const [boxHeight, setBoxHeight] = useState(0);

    const [initLoad, setInitLoad] = useState(true);


    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [appActiveStatus, idx])
    );

    const dataFunc = async () => {

        let sender = {
            postIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/post/detail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'check_route' })
    };


    return (
        <Layout header={header}>

            {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

            <ScrollView
                style={styles.root}
                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 20
                }}
            >
                <View >

                    <View style={{ gap: 20 }}>
                        {item?.itinerary?.map((x, i) => {
                            return (
                                <View key={i} style={[styles.item, i === (item?.currentIndex || 0) && styles.itemActive ]}>

                                    {/* <View style={{...rootStyle.default32, marginTop: -4 }}>
                                        {i === (item?.currentIndex || 0) && <Image source={images.car_black} style={{ width: '100%', height: '100%' }} />}
                                    </View> */}
                                    
                                    <View style={[rootStyle.default, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                        {i === 0 ? (
                                            <Image source={images.start_point} style={{ width: '100%', height: '100%' }} />
                                        ) : i === item?.itinerary?.length - 1 ? (
                                            <Image source={images.end_point} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <Text style={{...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i}</Text>
                                        )}
                                    </View>

                                    <View style={{ flex: 1, gap: 12 }}>
                                        <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium), lineHeight: 24 }}>
                                            {lang({ id: i === 0 ? 'departure' : i === item?.itinerary?.length - 1 ? 'destination' : 'stop' })} : {x?.name}
                                        </Text>

                                        {item?.joins?.filter(xx => xx?.startIdx === x?.idx)?.length > 0 && (
                                            <View style={{ gap: 8 }}>
                                                <Text style={{...rootStyle.font(18, colors.taseta, fonts.medium) }}>{lang({ id: 'pickup' })}</Text>
                                                {item?.joins?.filter(xx => xx?.startIdx === x?.idx)?.map((xx, ii) => {
                                                    return (
                                                        <View key={`${i}_start_${ii}`} style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                                            <Image source={consts.s3Url + xx?.user?.profile} style={{ width: 30, height: 30, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                                                            <Text style={{...rootStyle.font(16, colors.main, fonts.semiBold)}}>{xx?.user?.firstName} {xx?.user?.lastName}</Text>
                                                        </View>
                                                    )
                                                })}
                                            </View>
                                        )}
                                       
                                        
                                        {item?.joins?.filter(xx => xx?.endIdx === x?.idx)?.length > 0 && (
                                            <View style={{ gap: 8 }}>
                                                <Text style={{...rootStyle.font(18, colors.taseta, fonts.medium) }}>{lang({ id: 'dropoff' })}</Text>
                                                {item?.joins?.filter(xx => xx?.endIdx === x?.idx)?.map((xx, ii) => {
                                                    return (
                                                        <View key={`${i}_end_${ii}`} style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                                            <Image source={consts.s3Url + xx?.user?.profile} style={{ width: 30, height: 30, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                                                            <Text style={{...rootStyle.font(16, colors.main, fonts.semiBold)}}>{xx?.user?.firstName} {xx?.user?.lastName}</Text>
                                                        </View>
                                                    )
                                                })}
                                            </View>
                                         )}

                                    </View>
                                </View>
                            )
                        })}
                        {/*                        
                        {way?.map((x, i) => {
                            return (
                                <View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                                    <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                        <Text style={{...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i + 1}</Text>
                                    </View>
                                    <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}}>{x?.name}</Text>
                                </View>
                            )
                        })}
                        <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                            <View style={[rootStyle.default19]}>
                                <Image source={images.end_point} style={{ width: '100%', height: '100%'}}/>
                            </View>
                            <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}}>{end}</Text>
                        </View> */}
                    </View>
                </View>

            </ScrollView>

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
        bar: {
            position: 'absolute',
            left: 19 / 2 - 1,
            top: 15,
            height: '100%',
            borderRightWidth: 1,
            borderRightColor: colors.taseta,
            borderStyle: Platform.OS === 'ios' ? 'solid' : 'dashed'
        },
        item: {
            flexDirection: 'row',
            gap: 12, 
            alignItems: 'flex-start', 
            justifyContent: 'flex-start',
            paddingHorizontal: 20,
            paddingVertical: 12,
        },
        itemActive: {
            backgroundColor: colors.sub_3
        }
    })

    return { styles }
}