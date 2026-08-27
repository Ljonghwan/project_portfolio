import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { SequencedTransition, FadeIn, FadeOut, SlideInLeft, ZoomIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import InputAddr from '@/components/InputAddr';
import InputDate from '@/components/InputDate';
import InputTime from '@/components/InputTime';
import TextArea from '@/components/TextArea';
import Radio from '@/components/Radio';
import ErrorMessage from '@/components/ErrorMessage';

import RoutesView from '@/components/Post/RoutesView';

import Empty from '@/components/Empty';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { useBottomSheetBackHandler, ToastMessage, estimatePay, numDoler, sumDecimal } from '@/libs/utils';

import { useUser, useLang, useAlert, useLoader, usePost } from '@/libs/store';
import dayjs from 'dayjs';


export default function Page() {

    const pathname = usePathname();

    const { key, place, index } = useLocalSearchParams();

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { country } = useLang();
    const { start, end, way, date, time, type, seats, desc, setPostData } = usePost();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const listRef = useRef(null);
    const startref = useRef(null);
    const endref = useRef(null);
    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [maxSeats, setMaxSeats] = useState(4);

    const [pay, setPay] = useState(0);
    const [estimated, setEstimated] = useState([]);

    const [view, setView] = useState(false);
    const [load, setLoad] = useState(false);
    const [submitLoad, setSubmitLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
    }, [])

    useEffect(() => {
        if (key && place) {
            onChange({ name: key, value: JSON.parse(place), index: index });
            router.setParams({ key: '', place: '', index: '' });
        }
    }, [key, place, index])

    const onChange = ({ name, value, index }) => {
        if (name === 'way') {

            console.log(name, value, index, way?.map((x, i) => {
                if (i != index) return x;
                return value
            }));

            setPostData({
                key: name,
                value: way?.map((x, i) => {
                    if (i != index) return x;
                    return value
                })
            })
        } else {
            console.log({ name, value, index })
            setPostData({
                key: name,
                value: value
            })
        }

    }

    const submitAlert = () => {
        // 유효성검사
        setError(null);

        console.log({ start, end, way });
        if (!start?.lat || !end?.lat ) {
            ToastMessage(lang({ id: 'post_addr_invalid2' }), { type: 'error' });
            return;
        }
        if (!type) {
            ToastMessage(lang({ id: 'post_type_invalid' }), { type: 'error' });
            return;
        }
        if (!date || !time) {
            ToastMessage(lang({ id: 'post_date_invalid' }), { type: 'error' });
            return;
        }

        openAlertFunc({
            label: lang({ id: 'would_you_like_to_post' }),
            title: `${lang({ id: 'would_you_like_to_post_comment' })}\n${lang({ id: 'the_drivers_will_review' })}`,
            onCencleText: lang({ id: 'no' }),
            onPressText: lang({ id: 'yes' }),
            onCencle: () => { },
            onPress: submitFunc
        })
    }

    const submitFunc = async () => {
       

        setSubmitLoad(true);

        const sender = {
            wayPoint: [start, end],
            rideType: type,
            startTime: `${dayjs(date).format('YYYY-MM-DD')} ${dayjs(time).format('HH:mm')}`,
            desc: desc
        }

        console.log('sender', JSON.stringify(sender, null, 4));

        const { data, error } = await API.post('/v2/passenger/reqpost/insert', sender);

        console.log(data, error);

        setTimeout(() => {
            setSubmitLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            // router.canDismiss() && router.dismissAll();
            router.canDismiss() && router.dismissAll();
            router.replace({
                pathname: routes.find,
                params: {
                    tabIndex: 2
                }
            });

            ToastMessage(lang({ id: 'the_post_has_been_registered' }));

        }, consts.apiDelay)

    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'post_request' })
    };

    return (
        <Layout header={header}>
            <View style={styles.root}>
                <KeyboardAwareScrollView
                    ref={listRef}
                    decelerationRate={'normal'}
                    bottomOffset={250}
                    showsVerticalScrollIndicator={false}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    keyboardShouldPersistTaps={"handled"}
                    keyboardDismissMode={'on-drag'}
                >
                    <View style={{ gap: 35, paddingHorizontal: rootStyle.side }}>
                        <View style={[rootStyle.flex, { gap: 10 }]}>
                            <View style={[styles.headerBox, { flex: 1 }]}>
                                <InputAddr
                                    iref={startref}
                                    type={'start'}
                                    name={'start'}
                                    state={start?.name}
                                    placeholder={lang({ id: 'where' })}
                                    onPress={() => {
                                        console.log('!!!!!!!!');
                                        router.push({
                                            pathname: routes.searchPlace,
                                            params: {
                                                route: pathname,
                                                key: 'start'
                                            }
                                        })
                                    }}
                                    onReset={() => onChange({ name: 'start', value: {} })}
                                    onSwapFunc={() => {
                                        let start_cp = start;
                                        let end_cp = end;
                                        onChange({ name: 'start', value: end_cp });
                                        onChange({ name: 'end', value: start_cp });
                                    }}
                                />
                                <InputAddr
                                    iref={endref}
                                    type={'end'}
                                    name={'end'}
                                    state={end?.name}
                                    placeholder={lang({ id: 'tell_your_destinatio' })}
                                    onPress={() => {
                                        console.log('!!!!!!!!');
                                        router.push({
                                            pathname: routes.searchPlace,
                                            params: {
                                                route: pathname,
                                                key: 'end'
                                            }
                                        })
                                    }}
                                    onReset={() => onChange({ name: 'end', value: {} })}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'ride_type' })}</Text>
                            <Radio
                                state={type}
                                setState={(v) => onChange({ name: 'type', value: v })}
                                list={
                                    consts.carpoolTypeOptions?.filter(x => x?.idx === 2)?.map(x => {
                                        return { ...x, title: lang({ id: x.title }) }
                                    })
                                }
                            />
                          
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'ride_date' })}</Text>
                            <InputDate state={date} setState={(v) => onChange({ name: 'date', value: v })} placeholder={lang({ id: 'what_date_are' })} />
                            <InputTime state={time} setState={(v) => onChange({ name: 'time', value: v })} placeholder={lang({ id: 'what_time_are' })} />
                            {/* <Text>{dayjs(date).format('YYYY-MM-DD')} {dayjs(time).format('HH:mm')}</Text> */}
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'description' })}</Text>
                            <TextArea
                                name={'desc'}
                                state={desc}
                                setState={(v) => onChange({ name: 'desc', value: v })}
                                placeholder={lang({ id: 'tell_drivers_about' })}
                                blurOnSubmit={false}
                                maxLength={255}
                                multiline
                            />
                        </View>



                        <Button type={2} onPress={() => { router.push(routes.myCarpoolStyle) }} >{lang({ id: 'choose_your_ride' })}</Button>
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.bottom} >
                    <Button style={{ width: 120 }} onPress={submitAlert} load={submitLoad}>{lang({ id: 'write_post' })}</Button>
                </View>
            </View>

        </Layout>
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
        headerBox: {
            display: "flex",
            flexDirection: "column",
            gap: 10,
        },
        bottom: {
            paddingTop: 10,
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end',
        },
        sheet: {
            elevation: 20, // 안드로이드 그림자

            shadowColor: colors.dark, // iOS 그림자
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,

            borderWidth: 0,
        },
        component: {
            overflow: 'hidden',
            paddingTop: 0,
            minHeight: 200,
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
        },
    })

    return { styles }
}