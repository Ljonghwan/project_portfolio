import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

import Postcode from '@actbase/react-daum-postcode';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';


import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, usePageContext } from '@/libs/store';

import { useBackHandler, useBottomSheetModalBackHandler, getDateStatus } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const router = useRouter();
    const { type } = useLocalSearchParams();

    const { reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { context, setContext } = usePageContext();

    const iref = useRef();

    const [addr, setAddr] = useState('');
    const [addr2, setAddr2] = useState('');

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(true);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelayLong)
    }, [])

    // useEffect(() => {
    //     if (addr) {
    //         console.log('addr effect');
    //         iref.current?.focus();
    //     }
    // }, [addr])

    useEffect(() => {
        setDisabled(!(addr2?.length > 0));
    }, [addr2])


    const header = {
        title: '주소 검색',
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
                <Postcode
                    style={{ width: '100%', height: '100%', paddingBottom: insets?.bottom }}
                    jsOptions={{ animation: true, theme: { bgColor: colors.white } }}
                    onSelected={data => {
                        console.log('data', data);
                        if (!data?.address) return;
                        // setAddr(data?.address);
                        setContext({
                            key: 'addr',
                            data: {
                                addr: data?.address,
                            },
                        });
                        router.back();
                    }}
                />
            </View>
                
            {/* {!addr ? (
                <View>
                    {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}
                    <Postcode
                        style={{ width: '100%', height: '100%', paddingBottom: insets?.bottom }}
                        jsOptions={{ animation: true, theme: { bgColor: colors.white } }}
                        onSelected={data => {
                            console.log('data', data);
                            if (!data?.address) return;

                            // setAddr(data?.address);
                            setContext({
                                key: 'addr',
                                data: {
                                    addr: data?.address,
                                },
                            });
                            router.back();
                        }}
                    />
                </View>
            ) : (
                <>
                    <View style={{ paddingTop: 20, paddingHorizontal: rootStyle.side, gap: 24 }}>
                        <Text style={{ ...rootStyle.font(20, colors.text2B2B2B, fonts.bold) }}>{`상세주소 입력`}</Text>
                        <TextInput
                            iref={iref}
                            placeholder="상세주소를 입력해주세요."
                            value={addr2}
                            onChangeText={setAddr2}
                            maxLength={50}
                        />

                    </View>
                    <Button bottom disabled={disabled} onPress={() => {
                        setContext({
                            key: 'addr',
                            data: {
                                addr: addr,
                                addr2: addr2,
                            },
                        });
                        router.back();
                    }}>완료</Button>
                </>
            )} */}

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        exit: {
            position: 'absolute',
            top: 16,
            right: 21,
            zIndex: 1000,
        },
        inputWrap: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 48,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
            paddingHorizontal: 16,
            gap: 10,

            marginTop: 20,
            marginBottom: 40,
        },
        input: {
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: colors.textPrimary,
            padding: 0,
        },
    })

    return { styles }
}