import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, Linking, Platform, useWindowDimensions, Pressable } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import ReanimatedDrawerLayout, {
    DrawerType,
    DrawerPosition,
    DrawerLayoutMethods,
} from 'react-native-gesture-handler/ReanimatedDrawerLayout';
import dayjs from "dayjs";
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Tag from '@/components/Tag';
import Icon from '@/components/Icon';

import Room from '@/components/Chat/Room';

import RoutesView from '@/components/Post/RoutesView';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import API from '@/libs/api';

import { useLang, useUser, useAlert } from '@/libs/store';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const router = useRouter();
    const { idx } = useLocalSearchParams();
    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { country } = useLang();

    const drawerRef = useRef(null);

    const [room, setRoom] = useState(null); // 
    const [title, setTitle] = useState(null); // 

    const [users, setUsers] = useState([]); // 

    const [alarm, setAlarm] = useState(true);

    const [load, setLoad] = useState(true);

    useEffect(() => {
        if(idx) roomInfo();
    }, [idx])

    const roomInfo = async () => {

        let sender = {
            chatIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/chat/chatInfo', sender);
        console.log('roominfo', data);

        setRoom(data);
        setTitle(data?.members?.filter(x => x?.idx !== mbData?.idx)?.map(x => `${x?.firstName} ${x?.lastName}`)?.join(", "));
        setUsers(data?.members?.sort((a, b) => getPriority(a) - getPriority(b)) || []);

        setAlarm(data?.alarm || false);

    }

    const getPriority = (item) => {
        if (item?.idx === mbData?.idx) return 0;
        if (item?.activeType === "driver") return 1;
        return 2;
    };

    const alertToggle = async () => {

        const sender = {
            chatIdx: idx,
            isAlarm: !alarm
        }

        const { data, error } = await API.post('/v2/chat/updateAlarm', sender);
        
        setAlarm(data);
    }


    const leaveAlert = () => {
        drawerRef.current?.closeDrawer();

        openAlertFunc({
            label: lang({ id: 'are_you_sure_4' }),
            title: lang({ id: 'leaving_chat_will' }),
            onCencleText: lang({ id: 'close' }),
            onPressText: lang({ id: 'exit' }),
            onPress: async () => {
                const sender = {
                    chatIdx: idx
                }
                console.log('sender', sender);
                const { data, error } = await API.post('/v2/chat/leave', sender);

                if (error) {
                    console.log('error', error);
                    ToastMessage(lang({ id: error?.message }), { type: 'error' });
                }

                router.back();
            }
        })
    }

    const filterPress = () => {
        Keyboard.dismiss();
        drawerRef.current?.openDrawer();
    }

    const DrawerPage = () => {

        return (
            <View style={styles.drawerContainer}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets?.top + 20, paddingBottom: 20, paddingHorizontal: rootStyle.side, gap: 20 }}>
                    <Pressable style={{ gap: 14 }} onPress={() => {
                        // router.push({
                        //     pathname: routes.postView,
                        //     params: {
                        //         idx: room?.postIdx
                        //     }
                        // })
                    }}
                    >
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ride_information' })}</Text>
                            {/* <Image source={images.link} style={rootStyle.default} /> */}
                        </View>
                        <View style={[rootStyle.flex, { gap: 9, justifyContent: 'flex-start' }]}>
                            <Tag msg={lang({ id: room?.postInfo?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
                        </View>
                        <RoutesView style={{ gap: 15 }} textStyle={{ fontSize: 14 }} way={room?.postInfo?.itinerary} />
                        <View style={{ gap: 15 }} >
                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default]}>
                                    <Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
                                </View>
                                <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(14, colors.sub_1, fonts.medium) }}>
                                    {dayjs(`${room?.postInfo?.itinerary?.[0]?.driveDate} ${room?.postInfo?.itinerary?.[0]?.driveTime}`).format('MMM DD, YYYY, h:mm A')}
                                </Text>
                            </View>
                        </View>
                    </Pressable>

                    <View style={{ gap: 26 }}>
                        <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'chat_partner' })}</Text>
                        <View style={{ gap: 24 }}>

                            {users?.map((x, i) => {
                                return (
                                    <Pressable key={`chatUsers_${i}`} style={[rootStyle.flex, { gap: 12 }]} onPress={() => {
                                        router.push({
                                            pathname: routes.userView,
                                            params: {
                                                idx: x?.idx
                                            }
                                        })
                                    }}>
                                        <Image source={(x?.profile ? consts.s3Url + x?.profile : images.profile)} style={styles.profile} />
                                        <View style={{ flex: 1 }}>
                                            <Text numberOfLines={1} style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{x?.firstName} {x?.lastName}</Text>
                                            <Text style={{ ...rootStyle.font(14, colors.taseta, fonts.medium) }}>{lang({ id: x?.idx === mbData?.idx ? 'me' : x?.activeType === 'driver' ? 'driver' : 'passenger' })}</Text>
                                        </View>
                                    </Pressable>
                                )
                            })}
                            
                        </View>

                    </View>
                </ScrollView>
                <View style={[rootStyle.flex, { justifyContent: 'space-between', backgroundColor: colors.sub_3, paddingHorizontal: rootStyle.side, paddingTop: rootStyle.side, paddingBottom: insets?.bottom + 20 }]}>
                    <Icon img={images.logout} imgStyle={rootStyle.default} onPress={leaveAlert} />
                    <Icon img={alarm ? images.chat_alert_on : images.chat_alert_off} imgStyle={rootStyle.default} onPress={alertToggle} />
                </View>
            </View>
        );
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            icon: 'dots',
            onPress: filterPress
        }

    };

    return (

        <ReanimatedDrawerLayout
            ref={drawerRef}
            renderNavigationView={() => <DrawerPage />}
            drawerPosition={DrawerPosition.RIGHT}
            drawerType={DrawerType.FRONT}
            drawerWidth={width * 0.7}
            overlayColor={colors.dim}
        >
            <Layout header={{
                ...header,
                title: title,
                subTitle: room?.type === 1 ? null : room?.members?.length,
                longTitle: true
            }} >
                <View style={styles.root}>
                    <Room />
                </View>
            </Layout>
        </ReanimatedDrawerLayout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            // borderTopColor: colors.sub_1,
            // borderTopWidth: 1,
            // paddingHorizontal: rootStyle.side
        },
        drawerContainer: {
            flex: 1,
            backgroundColor: colors.white,
        },
        profile: {
            width: 36,
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        }
    })

    return { styles }
}