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
import Counter from '@/components/Counter';
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
        dataFunc();
    }, [])

    useEffect(() => {
        if (key && place) {
            onChange({ name: key, value: JSON.parse(place), index: index });
            router.setParams({ key: '', place: '', index: '' });
        }
    }, [key, place, index])

    useEffect(() => {
        if (pay > 0) {
            setError(null);

            setEstimated(prev => prev?.map((x, i) => {
                return { ...x, pay: estimatePay(x?.distance, pay) }
            }))
        }
    }, [pay])

    const dataFunc = async () => {

        const { data, error } = await API.post('/v2/driver/user/driveInfo');

        setMaxSeats(data?.seater || 4);
        onChange({ name: 'seats', value: seats ? Math.min(seats, (data?.seater || 4)) : data?.seater }); // 기본값 차량 시트수
    }

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

    const confirmFunc = async () => {

        // 유효성검사
        setError(null);

        console.log({ start, end, way });
        if (!start?.lat || !end?.lat || way?.filter(x => !x?.lat)?.length > 0) {
            ToastMessage(lang({ id: 'post_addr_invalid' }), { type: 'error' });
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

        setLoad(true);

        const sender = {
            wayPoint: [
                start,
                ...way,
                end
            ]
        }

        const { data, error } = await API.post('/v2/driver/post/estimated', sender);

        console.log({ data, error });

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            sheetRef.current?.present();

            setPay(data?.pay);
            setEstimated(data?.wayPoint);

        }, consts.apiDelay)
    }

    const submitAlert = () => {
        setError(null);

        openAlertFunc({
            label: lang({ id: 'would_you_like_to_post' }),
            title: lang({ id: 'would_you_like_to_post_comment' }),
            onCencleText: lang({ id: 'no' }),
            onPressText: lang({ id: 'yes' }),
            onCencle: () => { },
            onPress: submitFunc
        })
    }

    const submitFunc = async () => {
        setSubmitLoad(true);

        const sender = {
            pay: pay,
            wayPoint: estimated,
            rideType: type,
            seats: seats,
            startTime: `${dayjs(date).format('YYYY-MM-DD')} ${dayjs(time).format('HH:mm')}`,
            desc: desc,

        }

        console.log('sender', JSON.stringify(sender, null, 4));

        const { data, error } = await API.post('/v2/driver/post/insert', sender);

        console.log(data, error);

        setTimeout(() => {
            setSubmitLoad(false);

            if (error) {
                setError(lang({ id: error?.message }));
                return;
            }

            sheetRef.current?.dismiss();

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

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const { handleSheetPositionChange } = useBottomSheetBackHandler(sheetRef, () => { });

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'pickup-drop-location' }),
        longTitle: true,
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
                        <View style={styles.headerBox}>
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
                                    let tempStart = start;
                                    let tempEnd = end;
                                    let tempWay = way;

                                    onChange({ name: 'start', value: tempEnd });
                                    onChange({ name: 'end', value: tempStart });
                                    setPostData({
                                        key: 'way', value: tempWay?.reverse()
                                    })
                                }}
                            />
                            {way?.map((x, i) => {
                                return (
                                    <Animated.View
                                        key={i}
                                        entering={SlideInLeft}
                                    >
                                        <InputAddr
                                            type={'way'}
                                            name={'way'}
                                            state={x?.name}
                                            placeholder={lang({ id: 'where_are_you_1' })}
                                            onPress={() => {
                                                console.log('!!!!!!!!');
                                                router.push({
                                                    pathname: routes.searchPlace,
                                                    params: {
                                                        route: pathname,
                                                        key: 'way',
                                                        index: i
                                                    }
                                                })
                                            }}
                                            onReset={() => onChange({ name: 'way', index: i, value: {} })}
                                            onMinusFunc={() => {
                                                setPostData({
                                                    key: 'way', value: way?.filter((xx, ii) => ii !== i)
                                                })
                                            }}
                                        />
                                    </Animated.View>
                                )
                            })}
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
                                onAddFunc={() => {
                                    if (way?.length >= 3) {
                                        ToastMessage(lang({ id: 'no_add' }), { type: 'error' })
                                        return;
                                    }
                                    setPostData({
                                        key: 'way', value: [...way, {}]
                                    })
                                }}
                                onReset={() => onChange({ name: 'end', value: {} })}
                            />
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
                            <Animated.View style={{ gap: 13 }} entering={ZoomIn}>
                                <Counter value={seats} setValue={v => onChange({ name: 'seats', value: Math.max(1, Math.min(maxSeats, v)) })} unit={lang({ id: 'seats' })} />
                            </Animated.View>
                            {/* {type === 2 && (
                                <Animated.View style={{ gap: 13 }} entering={ZoomIn}>
                                    <Counter value={seats} setValue={v => onChange({ name: 'seats', value: Math.max(1, Math.min(maxSeats, v)) })} unit={lang({ id: 'seats' })} />
                                </Animated.View>
                            )} */}
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
                                placeholder={lang({ id: 'tell_passengers_about' })}
                                blurOnSubmit={false}
                                maxLength={255}
                                multiline
                            />
                        </View>



                        <Button type={2} onPress={() => { router.push(routes.myCarpoolStyle) }} >{lang({ id: 'choose_your_ride' })}</Button>
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.bottom} >
                    <Button style={{ width: 120 }} onPress={confirmFunc} load={load}>{lang({ id: 'continue' })}</Button>
                </View>
            </View>

            <BottomSheetModal
                ref={sheetRef}
                index={0}
                style={styles.sheet}
                handleStyle={[{ height: 40, justifyContent: 'center' }]}
                handleIndicatorStyle={[{ backgroundColor: colors.sub_2, width: 100, height: 5 }]}
                backdropComponent={renderBackdrop}
                onChange={handleSheetPositionChange}
                enableOverDrag={false}
                enableDynamicSizing={true}
                animatedPosition={sheetPosition}
                backgroundStyle={{ backgroundColor: colors.white, borderRadius: 12 }}
            >
                <BottomSheetView >
                    {load && <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />}
                    <View style={styles.component}>
                        <View style={{ gap: 20 }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold) }}>{lang({ id: 'ride_information' })}</Text>

                            <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                                <View style={[rootStyle.default]}>
                                    <Image source={images.calendar2} style={{ width: '100%', height: '100%' }} />
                                </View>
                                <Text numberOfLines={1} style={{ flex: 1, ...rootStyle.font(18, colors.sub_1, fonts.medium) }}>
                                    {dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${dayjs(time).format('HH:mm')}`).format('MMM DD, YYYY, h:mm A')}
                                </Text>
                            </View>

                            <RoutesView way={estimated} />

                            <View style={{ gap: 15 }}>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.sub_1 }]}>
                                    <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium) }}>{lang({ id: 'total' })}</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.taseta, fonts.medium) }}>{numDoler(estimated?.reduce((a, b) => a + (b?.pay || 0), 0))}</Text>
                                </View>

                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={{ ...rootStyle.font(16, colors.main, fonts.medium) }}>{lang({ id: 'per_1km' })}</Text>
                                    <Counter style={{ gap: 15 }} textStyle={{ width: 65, textAlign: 'center' }} value={pay} setValue={v => setPay(Math.max(0.01, Math.min(1, sumDecimal(0, v))))} depth={0.01} unit={'$'} />
                                </View>
                            </View>

                            <View style={{ gap: 10 }}>
                                <Button onPress={submitAlert} load={submitLoad}>{lang({ id: 'write_post' })}</Button>
                                {error && <ErrorMessage msg={error} />}
                            </View>
                        </View>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>


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