import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';

import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
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

import { useUser, useLang, useAlert, useLoader, usePhotoPopup } from '@/libs/store';


export default function Page() {

    const pathname = usePathname();
    const { key } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { country } = useLang();
    
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const listRef = useRef(null);
    const startref = useRef(null);
    const endref = useRef(null);

    const [boxHeight, setBoxHeight] = useState(0);

    const [start, setStart] = useState({});
    const [startAddr, setStartAddr] = useState("");
    const [startCheck, setStartCheck] = useState(false);

    const [endCheck, setEndCheck] = useState(false);


    const [focusing, setFocusing] = useState(null);
    const [focusingIndex, setFocusingIndex] = useState(null);

    const [searchList, setSearchList] = useState([]);

    const [mode, setMode] = useState(1);

    const [ searchLoad, setSearchLoad ] = useState(false);
    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    const startAddrDebounce = useDebounce(startAddr, 200);

    useEffect(() => {
        setDisabled(!(startCheck ))
    }, [startCheck ]);

    useEffect(() => {

        listRef?.current?.scrollTo(0);

    }, [mode]);

    useEffect(() => {

        searchFunc(startAddrDebounce)

    }, [startAddrDebounce])

    useEffect(() => {

        setStartCheck( (start?.name === startAddr));

    }, [start, startAddr ]);

    useEffect(() => {
        
        if (startAddr && !startCheck) setMode(2);
        else setMode(1);

    }, [startAddr]);



    const pinMap = async (v) => {

        let init = {};
        
        if(v) {
            init = v;
        } else {
            init = await getPositionAndPlace();
        }

        Keyboard.dismiss();

        router.push({
            pathname: routes.pinMap,
            params: {
                route: pathname,
                type: 'fav',
                typeIndex: key,
                init: JSON.stringify(init),
                initLat: init?.lat,
                initLng: init?.lng
            }
        })
    }

    const searchFunc = async (addr) => {
        if(!addr) {
            setSearchList([]);
            return;
        }
        if(searchLoad) return;

        setSearchLoad(true);

        const sender = {
            text: addr,
            lang: country
        }
        const { data, error } = await API.post('/v2/passenger/call/searchAddress', sender);

        setSearchList(data || []);
        
        setSearchLoad(false);
    }

    const onReset = ({type, index}) => {
        Keyboard.dismiss();

        if(type === 'start') {
            setStart({});
            setStartAddr("");
        } else if(type === 'end') {
            setEnd({});
            setEndAddr("");
        } else if(type === 'way') {
            setMode(1);
            setWayPoint(prev => prev?.map((x, i) => {
                if(i !== index) return x;
                return {nameInput: ""}
            }))
        }
    }


    const completeFunc = () => {

    }

    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: key == 1 ? 'register_home_addres' : key == 2 ? 'office_address_regis' : 'favorite_address_reg'}),
        longTitle: true
    };
    return (
        <Layout header={header}>
            <View style={styles.root}>
                <View style={styles.headerBox}>
                    <InputAddr
                        iref={endref}
                        autoFocus
                        type={'start'}
                        name={'startAddr'}
                        state={startAddr}
                        setState={setStartAddr}
                        placeholder={lang({ id: 'search_for_a_place' })}
                        onFocusFunc={() => setFocusing('start')}
                        onBlurFunc={() => setFocusing(null)}
                        onReset={() => onReset({ type: 'start' })}
                        readOnly={startCheck}
                        icon={key == 1 ? images.house_green : key == 2 ? images.building_green : images.fav_green}
                    />

                        <TouchableOpacity onPress={() => pinMap()}>
                            <View style={styles.favLocationBox}>
                                <Image source={images.map_grey} style={rootStyle.size_27} />
                                <Text style={styles.favLocationBoxText}>{lang({ id: 'set_fav_location' })}</Text>
                            </View>
                        </TouchableOpacity>

                </View>

                <View style={{ flex: 1 }} onLayout={onContentLayout}>
                    <KeyboardAwareScrollView
                        ref={listRef}
                        decelerationRate={'normal'}
                        bottomOffset={250}
                        showsVerticalScrollIndicator={false}
                        disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                        keyboardShouldPersistTaps={"always"}
                        keyboardDismissMode={'on-drag'}
                        contentContainerStyle={{ paddingBottom: insets?.bottom }}
                    >
                        <View>
                            {/* search list */}
                            {searchLoad ? (
                                <Loading style={{ backgroundColor: colors.white, height: boxHeight }} color={colors.black} entering={false} exiting={false} fixed/>
                            ) : (
                                searchList?.length > 0 ? searchList.map((item, index) => {
                                    return (
                                        <ListItemAddrSearch key={index} item={item} onPress={() => pinMap(item)}/>
                                    )
                                }) : (
                                    <Empty style={{ height: boxHeight }} msg={lang({ id: 'no_search' })} image={false} />
                                )
                            )}
                        </View>
                    </KeyboardAwareScrollView>
                </View>
                

                {/* <View style={styles.bottom} >
                    <Button style={styles.completeBtn} onPress={completeFunc} disabled={disabled} load={load}>{lang({ id: 'register' })}</Button>
                </View> */}
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
            paddingVertical: 30,
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
        }
    })

    return { styles }
}