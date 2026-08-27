import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { SequencedTransition, FadeIn, FadeOut, SlideInLeft, SlideOutRight, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import InputAddr from '@/components/InputAddr';
import FavAddr from '@/components/FavAddr';
import Empty from '@/components/Empty';

import ListItemAddrHistory from "@/components/Item/ListItemAddrHistory"
import ListItemAddrSearch from "@/components/Item/ListItemAddrSearch"


import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, getPositionAndPlace, useDebounce } from '@/libs/utils';

import { useUser, useLang, useAlert, useLoader, useCall } from '@/libs/store';


export default function Page() {

    const pathname = usePathname();
    const { callType, initStart, type, typeIndex, info } = useLocalSearchParams(); // callType = 라이드셰어, 카풀, 전부 
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { country } = useLang();
    const { start, end, way, setCallData } = useCall();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const listRef = useRef(null);
    const startref = useRef(null);
    const endref = useRef(null);

    // const [start, setStart] = useState(initStart ? JSON.parse(initStart) : {});
    const [startAddr, setStartAddr] = useState(initStart ? JSON.parse(initStart)?.name : "");
    const [startCheck, setStartCheck] = useState(false);

    // const [end, setEnd] = useState({});
    const [endAddr, setEndAddr] = useState("");
    const [endCheck, setEndCheck] = useState(false);

    const [wayCheck, setWayCheck] = useState(true);

    const [focusing, setFocusing] = useState('end');
    const [focusingIndex, setFocusingIndex] = useState(null);

    const [searchList, setSearchList] = useState([]);

    const [mode, setMode] = useState(1);

    const [searchLoad, setSearchLoad] = useState(false);
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [historyList, setHistoryList] = useState([]);

    const startAddrDebounce = useDebounce(startAddr, 200);
    const endAddrDebounce = useDebounce(endAddr, 200);

    useEffect(() => {
        historyFunc()
    }, [])

    useEffect(() => {
        setDisabled(!(startCheck && endCheck && wayCheck))
    }, [startCheck, endCheck, wayCheck]);

    useEffect(() => {

        listRef?.current?.scrollTo(0);

    }, [mode]);

    useEffect(() => {

        searchFunc(startAddrDebounce)

    }, [startAddrDebounce])

    useEffect(() => {

        searchFunc(endAddrDebounce)

    }, [endAddrDebounce])

    useEffect(() => {

        setStartCheck((start?.name === startAddr));
        setEndCheck((end?.name === endAddr));

    }, [start, startAddr, end, endAddr]);

    useEffect(() => {

        setWayCheck(way?.filter(x => x?.name !== x?.nameInput)?.length < 1);

    }, [way]);

    useEffect(() => {

        if (startAddr && !startCheck) setMode(2);
        else setMode(1);

    }, [startAddr, startCheck]);

    useEffect(() => {

        if (endAddr && !endCheck) setMode(2);
        else setMode(1);

    }, [endAddr, endCheck]);


    useEffect(() => {

        if (type, info) {
            const place = JSON.parse(info);
            console.log('type', type, place, typeIndex);

            if (type === 'start') {
                // setStart(place);
                setCallData({ key: type, value: place })
                setStartAddr(place?.name);
                setStartCheck(true);
            } else if (type === 'end') {
                setCallData({ key: type, value: place })
                setEndAddr(place?.name);
                setEndCheck(true);
            } else if (type === 'way') {
                setMode(1);
                setCallData({
                    key: type, value: way?.map((x, i) => {
                        if (i !== typeIndex * 1) return x;
                        return { ...place, nameInput: place?.name }
                    })
                })
            }
            setFocusing('end');
            setFocusingIndex(null);
        }

    }, [type, typeIndex, info])


    const pinMap = async (v) => {

        let init = {};

        if (v) {
            init = v;
        } else {
            init = await getPositionAndPlace();
        }

        Keyboard.dismiss();

        router.push({
            pathname: routes.pinMap,
            params: {
                route: pathname,
                type: focusing || 'end',
                typeIndex: focusingIndex,
                init: JSON.stringify(init),
                initLat: init?.lat,
                initLng: init?.lng
            }
        })
    }

    const historyFunc = async () => {

        const { data, error } = await API.post('/v2/passenger/call/recentHistory');
        setHistoryList(data || []);
        // setHistoryList([]);
    }

    const searchFunc = async (addr) => {
        if (!addr) {
            setSearchList([]);
            return;
        }
        if (searchLoad) return;

        setSearchLoad(true);

        const sender = {
            text: addr,
            lang: country
        }
        const { data, error } = await API.post('/v2/passenger/call/searchAddress', sender);

        setSearchList(data || []);

        setSearchLoad(false);
    }

    const onReset = ({ type, index }) => {
        Keyboard.dismiss();

        if (type === 'start') {
            setCallData({ key: type, value: {} })
            setStartAddr("");
        } else if (type === 'end') {
            setCallData({ key: type, value: {} })
            setEndAddr("");
        } else if (type === 'way') {
            setMode(1);
            setCallData({
                key: type, value: way?.map((x, i) => {
                    if (i !== index) return x;
                    return { nameInput: "" }
                })
            })
        }
    }
    const onChangeWay = ({ name, value, index }) => {
        setCallData({
            key: 'way', value: way?.map((x, i) => {
                if (i !== index) return x;
                return { ...x, [name]: value }
            })
        })
        if (name === 'nameInput') {
            searchFunc(value);
            if (value) setMode(2);
            else setMode(1);
        }
    }

    const favFunc = (place) => {
        if (focusing === 'start') {
            setCallData({ key: focusing, value: place })
            setStartAddr(place?.name);
            setStartCheck(true);
        } else if (focusing === 'way') {
            setMode(1);
            setCallData({
                key: focusing, value: way?.map((x, i) => {
                    if (i !== focusingIndex * 1) return x;
                    return { ...place, nameInput: place?.name }
                })
            })
        } else {
            setCallData({ key: focusing, value: place })
            setEndAddr(place?.name);
            setEndCheck(true);
        }
        setFocusing('end');
        setFocusingIndex(null);
    }

    const historyDeleteFunc = async (idx) => {

        const sender = {
            idx: idx
        }
        const { data, error } = await API.post('/v2/passenger/call/searchAddress', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            return;
        }

        historyFunc();
    }


    function loadFunc() {
        console.log("loadFunc")
    }

    function completeFunc() {
        router.push({
            pathname: routes.callSelectCall,
            params: {
            }
        })
    }


    useFocusEffect(useCallback(() => {
        loadFunc()

        return () => {
        };
    }, []));


    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'pickup-drop-location' }),
        longTitle: true
    };
    return (
        <Layout header={header}>
            <View style={styles.root}>
                <View style={styles.headerBox}>
                    <InputAddr
                        iref={startref}
                        type={'start'}
                        name={'startAddr'}
                        state={startAddr}
                        setState={setStartAddr}
                        placeholder={lang({ id: 'where' })}
                        onFocusFunc={() => setFocusing('start')}
                        // onBlurFunc={() => setFocusing(null)}
                        onReset={() => onReset({ type: 'start' })}
                        readOnly={startCheck}
                        isFocusing={focusing === 'start'}
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
                                    state={x?.nameInput}
                                    setState={(v) => onChangeWay({ name: 'nameInput', value: v, index: i })}
                                    placeholder={lang({ id: 'where_are_you_1' })}
                                    onFocusFunc={() => { setFocusing('way'); setFocusingIndex(i) }}
                                    // onBlurFunc={() => { setFocusing(null); setFocusingIndex(null) }}
                                    onReset={() => onReset({ type: 'way', index: i })}
                                    onMinusFunc={() => {
                                        setCallData({
                                            key: 'way', value: way?.filter((xx, ii) => ii !== i)
                                        })
                                    }}
                                    readOnly={x?.name === x?.nameInput}
                                    isFocusing={focusing === 'way' && focusingIndex === i}
                                />
                            </Animated.View>
                        )
                    })}
                    <InputAddr
                        iref={endref}
                        autoFocus
                        type={'end'}
                        name={'endAddr'}
                        state={endAddr}
                        setState={setEndAddr}
                        placeholder={lang({ id: 'tell_your_destinatio' })}
                        onFocusFunc={() => setFocusing('end')}
                        // onBlurFunc={() => setFocusing(null)}
                        onReset={() => onReset({ type: 'end' })}
                        onAddFunc={() => {
                            if (way?.length >= 2) {
                                ToastMessage(lang({ id: 'no_add' }), { type: 'error' })
                                return;
                            }
                            setCallData({
                                key: 'way', value: [...way, { nameInput: '' }]
                            })
                        }}
                        readOnly={endCheck}
                        isFocusing={focusing === 'end'}
                    />
                </View>

                <KeyboardAwareScrollView
                    ref={listRef}
                    decelerationRate={'normal'}
                    bottomOffset={250}
                    showsVerticalScrollIndicator={false}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    keyboardShouldPersistTaps={"always"}
                    keyboardDismissMode={'on-drag'}
                >


                    <View style={{ display: mode === 1 ? 'flex' : 'none' }}>
                        <TouchableOpacity onPress={() => pinMap()}>
                            <View style={styles.favLocationBox}>
                                <Image source={images.map_grey} style={rootStyle.size_27} />
                                <Text style={styles.favLocationBoxText}>{lang({ id: 'set_your_location_on_the_map' })}</Text>
                            </View>
                        </TouchableOpacity>

                        <FavAddr onPress={favFunc} />

                        {/* history list */}
                        <View style={{ marginTop: 30 }}>
                            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12 }}>
                                <Text style={rootStyle.font(18, colors.black, fonts.semiBold)}>{lang({ id: "recent_history" })}</Text>
                                <TouchableOpacity onPress={() => {
                                    console.log("history 삭제")
                                    openAlertFunc({
                                        label: lang({ id: 'do_you_want_1' }),
                                        onCencleText: lang({ id: 'no' }),
                                        onPressText: lang({ id: 'delete' }),
                                        onPress: () => {
                                            historyDeleteFunc(null);
                                        }
                                    })

                                }}>
                                    <Text style={rootStyle.font(16, colors.sub_1, fonts.medium)}>{lang({ id: "delete_all" })}</Text>
                                </TouchableOpacity>
                            </View>

                            {historyList?.length > 0 ? historyList.map((item, index) => {
                                return (
                                    <ListItemAddrHistory
                                        key={"his-item" + index}
                                        data={item}
                                        onPress={favFunc}
                                        onDelete={historyDeleteFunc}
                                    />
                                )
                            }) : (
                                <View style={styles.historyNull}>
                                    <Image source={images.sad} style={rootStyle.default} />
                                    <Text style={styles.historyNullText}>{lang({ id: 'dont_have_any' })}</Text>
                                    <Text style={styles.historyNullText2}>{lang({ id: 'go_new_place' })}</Text>
                                </View>
                            )}
                        </View>

                    </View>

                    <View style={{ display: mode === 2 ? 'flex' : 'none' }}>
                        {/* search list */}
                        {searchLoad ? (
                            <Loading style={{ backgroundColor: colors.white, height: 250 }} color={colors.black} entering={false} exiting={false} fixed />
                        ) : (
                            searchList?.length > 0 ? searchList.map((item, index) => {
                                return (
                                    <ListItemAddrSearch key={index} item={item} onPress={() => pinMap(item)} />
                                )
                            }) : (
                                <Empty style={{ height: 250 }} msg={lang({ id: 'no_search' })} image={false} />
                            )
                        )}
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.bottom} >
                    <Button style={styles.completeBtn} onPress={completeFunc} disabled={disabled} load={load}>{lang({ id: 'set_up_complete' })}</Button>
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
            paddingHorizontal: rootStyle.side,
        },
        headerBox: {
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingBottom: 15
        },
        completeBtn: {
            width: "100%",
        },
        bottom: {
            paddingTop: 15,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end',
        },

        favLocationBox: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            paddingVertical: 20,
            paddingTop: 15,
            paddingBottom: 30
        },
        favLocationBoxText: {
            fontSize: 18,
            fontFamily: fonts.semiBold,
            color: colors.main,
            letterSpacing: -0.36
        },
        flexBox: {
            display: "flex",
            width: "100%",
            flexDirection: "row",
            gap: 14
        },
        cardBox: {
            flex: 1,
            flexDirection: "column",
            padding: 15,
            backgroundColor: colors.taseta_sub_2,
            borderWidth: 1,
            borderRadius: 12,
            borderColor: colors.taseta
        },
        cardLargeText: {
            flex: 1,
            marginLeft: 29,
            ...rootStyle.font(18, colors.taseta, fonts.medium)
        },
        cardSmalText: {
            flex: 1,
            ...rootStyle.font(18, colors.taseta, fonts.medium)
        },
        cardLargeTopBox: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5
        },
        cardLargeBotBox: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 7
        },

        historyNull: {
            alignItems: 'center',
            justifyContent: 'center',
            height: 125,
            gap: 5
        },
        historyNullText: {
            fontSize: 18,
            fontFamily: fonts.semiBold,
            color: colors.sub_1,
            letterSpacing: -0.36
        },
        historyNullText2: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.sub_2,
            letterSpacing: -0.36
        },
    })

    return { styles }
}