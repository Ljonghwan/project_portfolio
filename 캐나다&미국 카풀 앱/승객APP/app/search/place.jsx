import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable, FlatList } from 'react-native';

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
import InputSearch from '@/components/InputSearch';
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

import { useUser, useLang, useAlert, useLoader, useCarpool } from '@/libs/store';


export default function Page() {

    const pathname = usePathname();
    const { route, key } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();
    const { country } = useLang();
    const { setCarpoolData } = useCarpool();

    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const iref = useRef(null);

    const [stx, setStx] = useState("");


    const [searchLoad, setSearchLoad] = useState(false);
    const [load, setLoad] = useState(false);
    const [list, setList] = useState([]);

    const [boxHeight, setBoxHeight] = useState(0);

    const stxDebounce = useDebounce(stx, 200);

    useEffect(() => {

        searchFunc(stxDebounce)

    }, [stxDebounce])

    const searchFunc = async (addr) => {
        if (!addr) {
            setList([]);
            return;
        }
        if (searchLoad) return;

        setSearchLoad(true);

        const sender = {
            text: addr,
            lang: country
        }
        const { data, error } = await API.post('/v2/map/searchAddress', sender);

        setList(data || []);

        setSearchLoad(false);
    }

    const renderItem = ({ item, index }) => {

        return (
            <ListItemAddrSearch item={item} onPress={() => submitFunc(item)} />
        )
    }

    const submitFunc = (item) => {
        console.log('press !!');
        if(typeof(item) !== 'object') return;

        router.dismissTo({
            pathname: route,
            params: {
                key: key,
                place: JSON.stringify(item)
            }
        });
    }


    const onContentLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};

    return (
        <Layout>
            <View style={styles.root}>
                <View style={styles.headerBox}>
                    <InputSearch
                        iref={iref}
                        autoFocus
                        name={'stx'}
                        state={stx}
                        setState={setStx}
                        placeholder={lang({ id: 'place_address' })}
                        onReset={() => setStx("")}
                    />
                </View>

                <View style={{ flex: 1 }} onLayout={onContentLayout}>
                    {searchLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.black} entering={false} exiting={false} fixed />}

                    <FlatList
                        data={list}
                        renderItem={renderItem}
                        numColumns={1}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingBottom: insets?.bottom,
                            paddingHorizontal: rootStyle.side
                        }}
                        keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"handled"}

                        // onEndReached={() => dataFunc()}
                        // onEndReachedThreshold={0.6}
                        // stickyHeaderIndices={[0]}
                        ListEmptyComponent={
                            <Empty style={{ height: boxHeight }} msg={lang({ id: 'no_search' })} image={false} />
                        }
                    />
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
            paddingTop: insets?.top
        },
        headerBox: {
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingBottom: 15,
            paddingHorizontal: rootStyle.side,
        },
        historyNull: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
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