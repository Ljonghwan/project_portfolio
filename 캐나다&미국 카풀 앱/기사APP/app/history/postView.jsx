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

import { ToastMessage, regEmail, numDoler } from '@/libs/utils';

import { useLang, useUser, useAlert, useConfig } from '@/libs/store';

export default function Page({ }) {

    const { postIdx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    const [item, setItem] = useState(null);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [joins, setJoins] = useState([]);
    const [pay, setPay] = useState(null);

    const [email, setEmail] = useState("");

    const [view, setView] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            dataFunc()
        }, [postIdx])
    );

    useEffect(() => {

        setDisabled(!(regEmail.test(email)));

    }, [email])

    useEffect(() => {

    }, [item])

    const dataFunc = async () => {
        
        let sender = {
            idx: postIdx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/driver/history/carpoolDetail', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            // setList([]);

            setInitLoad(false);

        }, consts.apiDelay)
    }

    const submitFunc = async () => {

        Keyboard.dismiss();
        if (load) return;

        setLoad(true);

        let sender = {
            idx: postIdx,
            email: email
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v2/driver/history/sendCarpoolDetail', sender);

        console.log('sender', data, error);
        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            ToastMessage(lang({ id: 'it_has_been_sent_to_you_by_email' }));
            setEmail("");

        }, consts.apiDelay)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'detailed_ride_inform' }),
        longTitle: true
    };


    return (
        <Layout header={header} >
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={100}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                keyboardDismissMode={'on-drag'}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={styles.root}
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingBottom: insets?.bottom + 20,
                    gap: 18
                }}
            >
              
                <View style={{ gap: 13 }}>
                    <View style={styles.list}>
                        <Tag msg={lang({ id: item?.rideType === 1 ? 'solo_ride' : 'carpoling' })} />
                        <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{lang({ id: 'driver' })} - {lang({ id: 'end_ride' })}</Text>
                    </View>

                    <Text style={{ ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
                        {dayjs(item?.driveDate).format('MMM DD, YYYY, h:mm A')}
                    </Text>
                </View>

                <View style={{ gap: 18 }}>

                    <View style={{ gap: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'ride_information' })}</Text>

                        {item?.rideInfo?.itinerary?.map((x, i) => {
                            return (
                                <View key={i} style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: i === 0 ? 'departure' : i === item?.rideInfo?.itinerary?.length - 1 ? 'destination' : 'stop' })}</Text>
                                    <Text numberOfLines={1} style={styles.content}>{x}</Text>
                                </View>
                            )
                        })}

                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'ride_time' })}</Text>
                            <Text numberOfLines={1} style={styles.content}>
                                {dayjs(item?.rideInfo?.startDate).format('h:mm A')} - {dayjs(item?.rideInfo?.endDate).format('h:mm A')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ gap: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'vehicle_information' })}</Text>
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'driver' })}</Text>
                            <Text numberOfLines={1} style={styles.content}>{item?.vehicleInfo?.firstName} {item?.vehicleInfo?.lastName}</Text>
                        </View>

                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>
                            <Text numberOfLines={1} style={styles.content}>{item?.vehicleInfo?.carType}</Text>
                        </View>

                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>
                            <Text numberOfLines={1} style={styles.content}>
                                {item?.vehicleInfo?.carNumber}
                            </Text>
                        </View>
                    </View>

                    <View style={{ gap: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'passenger_information' })}</Text>

                        {item?.joins?.map((x, i) => {
                            return (
                                <View key={i} style={styles.list}>
                                    <Text style={styles.label}>{lang({ id: 'passenger' })} {i + 1}</Text>
                                    <Text numberOfLines={1} style={styles.content}>{x?.firstName} {x?.lastName}</Text>
                                </View>
                            )
                        })}
                    </View>

                    <View style={{ gap: 15, borderBottomWidth: 1, borderColor: colors.sub_1, paddingBottom: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'payment_information' })}</Text>

                        <View style={{ gap: 15, borderBottomWidth: 1, borderColor: colors.sub_1, paddingBottom: 15 }}>
                            <View style={styles.list}>
                                <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'ride_fare' })}</Text>
                                <Text style={[styles.content, { color: colors.taseta }]}>{numDoler( item?.paymentInfo?.reduce((acc, item) => acc + item?.fare, 0))}</Text>
                            </View>
                            <View style={styles.list}>
                                <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'taseta_service_fee' })}</Text>
                                <Text style={[styles.content, { color: colors.taseta }]}>{numDoler( item?.paymentInfo?.reduce((acc, item) => acc + item?.fee, 0))}</Text>
                            </View>
                            <View style={styles.list}>
                                <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'total' })}</Text>
                                <Text style={[styles.content, { color: colors.taseta }]}>{numDoler( item?.paymentInfo?.reduce((acc, item) => acc + item?.amount, 0))}</Text>
                            </View>
                        </View>
                        
                        {item?.paymentInfo?.map((x, i) => {
                            return (
                                <View key={i} style={{ gap: 15, borderWidth: 1, borderColor: colors.sub_1, paddingHorizontal: 15, paddingVertical: 20 }}>
                                    <View style={styles.list}>
                                        <Text style={styles.label}>{lang({ id: 'payer' })}</Text>
                                        <Text numberOfLines={1} style={styles.content}>{x?.firstName} {x?.lastName}</Text>
                                    </View>
                                    <View style={styles.list}>
                                        <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'ride_fare' })}</Text>
                                        <Text style={[styles.content, { color: colors.taseta }]}>{numDoler(x?.fare)}</Text>
                                    </View>
                                    <View style={styles.list}>
                                        <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'taseta_service_fee' })}</Text>
                                        <Text style={[styles.content, { color: colors.taseta }]}>{numDoler(x?.fee)}</Text>
                                    </View>
                                    <View style={styles.list}>
                                        <Text style={[styles.label, { color: colors.taseta }]}>{lang({ id: 'total' })}</Text>
                                        <Text style={[styles.content, { color: colors.taseta, fontFamily: fonts.semiBold }]}>{numDoler(x?.amount)}</Text>
                                    </View>
                                    <View style={styles.list}>
                                        <Text style={styles.label}>{lang({ id: 'payment_date' })}</Text>
                                        <Text numberOfLines={1} style={styles.content}>{dayjs(x?.createAt).format('MMM DD, YYYY, h:mm A')}</Text>
                                    </View>
                                    <View style={styles.list}>
                                        <Text style={styles.label}>{lang({ id: 'payment_id' })}</Text>
                                        <Text numberOfLines={1} style={styles.content}>{x?.paymentIdx}</Text>
                                    </View>
                                </View>
                            )
                        })}
                        
                    </View>

                    <View style={{ gap: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'my_review' })}</Text>

                        {item?.joins?.map((x, i) => {
                            let review = item?.review?.find(xx => xx?.targetIdx === x?.idx);
                            return (
                                <View key={i} style={{ gap: 8 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]}>
                                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 10 }]}>
                                            <Image source={consts.s3Url + x?.profile} style={{ width: 34, aspectRatio: 1/1, borderRadius: 1000, backgroundColor: colors.placeholder}}/>
                                            <Text numberOfLines={1} style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{x?.firstName} {x?.lastName}</Text>
                                        </View>
                                        {!review && (
                                            <Button type={3} style={{ width: 'auto' }} onPress={() => {
                                                router.push({
                                                    pathname: routes.reviewsForm,
                                                    params: {
                                                        idx: x?.idx,
                                                        targetPost: postIdx
                                                    }
                                                });
                                            }}>{lang({ id: 'write' })}</Button>
                                        )}
                                        
                                    </View>

                                    {review ? (
                                        <View style={{ gap: 8 }}>
                                            <Rating
                                                size={width < 330 ? 16 : 22}
                                                rating={review?.rate}
                                                disabled={true}
                                                baseColor={colors.sub_3}
                                                fillColor={colors.taseta_sub_4}
                                                touchColor={colors.taseta_sub_4}
                                            />
                                            <Text numberOfLines={1} style={{ ...rootStyle.font(18, colors.main, fonts.medium) }}>{mbData?.firstName} {mbData?.lastName}</Text>
                                            <Text numberOfLines={2} style={{ ...rootStyle.font(16, colors.sub_1), lineHeight: 22 }}>{review?.message}</Text>
                                            <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                                                {review?.tags?.map((x, i) => {
                                                    return (
                                                        <Tag key={`tag_${i}`} type={4} msg={lang({ id: x })} />
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={{ ...rootStyle.font(14, colors.taseta, fonts.medium) }}>{lang({ id: 'i_havent_written_a_review_yet' })}</Text>
                                    )}
                                    
                                </View>
                                
                            )
                        })}
                    </View>

                    <View style={{ gap: 15 }}>
                        <Text style={styles.title}>{lang({ id: 'send_details_via_email' })}</Text>

                        <Input
                            name={'email'}
                            state={email}
                            setState={setEmail}
                            placeholder={lang({ id: 'enter_your_email_address' })}
                            maxLength={50}
                        />
                        <Button disabled={disabled} load={load} onPress={submitFunc}>{lang({ id: 'send' })}</Button>
                    </View>

                </View>

            </KeyboardAwareScrollView>
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
    })

    return { styles }
}
