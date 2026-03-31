import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert, Pressable } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Constants from 'expo-constants';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextList from '@/components/TextList';
import Loading from '@/components/Loading';
import Checkbox from '@/components/CheckBox';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

import StoreList from '@/components/Popup/StoreList';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, handleIntentUrl, handleIntentUrlCert } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { type } = useLocalSearchParams();

    const { pushToken, mbData, reload } = useUser();
    const { signData, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();


    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const [mode, setMode] = useState(null);

    const [load, setLoad] = useState(true);
    const [disabled, setDisabled] = useState(true);
    const [modal, setModal] = useState(false);


    const header = {
        title: "서비스 연동",
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} statusBar={'dark'} >

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >
                <View style={styles.banner}>
                    <Image source={images.my_service} style={rootStyle.my_service} />
                    <View style={[styles.circle, { width: 123, left: -36 }]} />
                    <View style={[styles.circle, { width: 100, left: '30%' }]} />
                    <View style={[styles.circle, { width: 67, left: '30%', bottom: 30 }]} />
                    <View style={[styles.circle, { width: 186, right: -30 }]} />
                </View>

                <View
                    style={styles.root}
                >
                    <Text style={[styles.title, { marginBottom: 40 }]}>{`서비스에 연결하고, 사장님의 매장을\n손쉽게 관리하세요`}</Text>

                    <View style={{ gap: 12 }}>
                        <TouchableOpacity style={[styles.item]} onPress={() => {
                            setMode('cardsales');
                            sheetRef.current?.present();
                            // router.push(routes.certCardSales)
                        }}>
                            <View style={[rootStyle.flex, { gap: 26, justifyContent: 'flex-start' }]}>
                                <View style={{ borderRadius: 8, width: 43, aspectRatio: 1, backgroundColor: colors.fafafa, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={images.my_service_1} style={{ width: 28, aspectRatio: 1 }} />
                                </View>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.medium) }}>여신금융협회 연동</Text>
                            </View>
                        </TouchableOpacity>


                        {/* <TouchableOpacity style={[styles.item]} onPress={() => {
                            setMode(null);
                            sheetRef.current?.present();
                            // router.push(routes.certCardSales)
                        }}>
                            <View style={[rootStyle.flex, { gap: 26, justifyContent: 'flex-start' }]}>
                                <View style={{ borderRadius: 8, width: 43, aspectRatio: 1, backgroundColor: colors.fafafa, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={images.my_service_1} style={{ width: 28, aspectRatio: 1 }} />
                                </View>
                                <Text style={{ ...rootStyle.font(16, colors.header, fonts.medium) }}>AAA 연동</Text>
                            </View>
                        </TouchableOpacity> */}

                    </View>

                </View>
            </KeyboardAwareScrollView>


            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >
                <StoreList
                    filter={mode}
                    onSubmit={(idx) => {
                        sheetRef.current?.dismiss();
                        router.push({
                            pathname: routes.certCardSales,
                            params: {
                                idx: idx
                            }
                        })
                    }}
                    onClear={(x) => {
                        sheetRef.current?.dismiss();

                        setTimeout(() => {
                            openAlertFunc({
                                label: '서비스 연동 해제',
                                title: `"${x?.title}" 매장의 서비스 연동을 해제하시겠습니까?`,
                                onCencleText: '취소',
                                onPressText: '해제하기',
                                onPress: async () => {

                                    openLoader();

                                    const sender = {
                                        store_idx: x?.idx,
                                    }

                                    const { data, error } = await API.post('/v1/storeService/cardsalesClear', sender);

                                    setTimeout(() => {
                                        closeLoader();

                                        if (error) {
                                            ToastMessage(error?.message);
                                            return;
                                        }

                                        ToastMessage('서비스 연동이 해제되었습니다.');
                                        reload();

                                    }, consts.apiDelay)
                                }
                            })
                        }, consts.apiDelay)
                    }}
                />
            </BottomSheetModalTemplate>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: 33,
            paddingBottom: 100 + insets?.bottom
        },
        banner: {
            paddingTop: 27,
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 60
        },
        circle: {
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.fff7ed,
            position: 'absolute',
            zIndex: -1
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.semiBold,
            color: colors.textPrimary,
            lineHeight: 32,
            letterSpacing: -0.5,
            textAlign: 'center'
        },

        item: {
            height: 65,
            borderWidth: 1,
            borderColor: colors.e9e9e9,
            borderRadius: 20,
            backgroundColor: colors.white,
            paddingHorizontal: 23,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }
    })

    return { styles }
}