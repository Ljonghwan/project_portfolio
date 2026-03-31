import React, { useRef, useState, useEffect } from 'react';
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
    Platform
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Input from '@/components/Input';
import InputPhone from '@/components/InputPhone';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat } from '@/libs/utils';

import { useLang, useUser, useAlert, useConfig } from '@/libs/store';

export default function Page({ }) {

    const { idx, item } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    const nameref = useRef(null);
    const memoref = useRef(null);
    const hpref = useRef(null);


    const [name, setName] = useState("");
    const [memo, setMemo] = useState("");
    const [hp, setHp] = useState("");
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {

        if(item) {
            let parse = JSON.parse(item);
            setName(parse?.name);
            setMemo(parse?.memo);
            setHp(parse?.hp);
        }

    }, [item])

    useEffect(() => {

        setDisabled(!(name && memo && hp?.length > 9));

    }, [name, memo, hp])

    const submitFunc = async () => {

        Keyboard.dismiss();

        if (disabled || load) return;

        setLoad(true);

        const sender = {
            idx: idx * 1,
            name,
            memo,
            hp
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/contactInsert', sender);

        console.log('error', error);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            router.back();
        }, consts.apiDelay)

    }

    const deleteFunc = async () => {

        Keyboard.dismiss();

        const sender = {
            idx: idx * 1,
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/my/contactDelete', sender);

        console.log('error', error);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            router.back();
        }, consts.apiDelay)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
    };


    return (
        <Layout header={header} input>
            <View
                style={styles.root}
            >
                <View style={{ gap: 25 }}>
                    <View style={[{ gap: 15, paddingHorizontal: rootStyle.side }]}>

                        <Input
                            iref={nameref}
                            name={'name'}
                            inputLabel={lang({ id: 'name' })}
                            state={name}
                            setState={setName}
                            placeholder={lang({ id: 'subject' })}
                            returnKeyType={"next"}
                            onSubmitEditing={() => memoref.current?.focus()}
                            blurOnSubmit={false}
                        />

                        <Input
                            iref={memoref}
                            name={'memo'}
                            inputLabel={lang({ id: 'note' })}
                            state={memo}
                            setState={setMemo}
                            placeholder={lang({ id: 'subject' })}
                            returnKeyType={"next"}
                            onSubmitEditing={() => hpref.current?.focus()}
                            blurOnSubmit={false}
                        />

                        <InputPhone
                            iref={hpref}
                            inputLabel={lang({ id: 'phone_number' })}
                            valid={'hp'}
                            name={'hp'}
                            state={hp}
                            setState={setHp}
                            country={mbData?.country}
                            countryDisabled={true}
                            placeholder={lang({ id: 'phone_number' })}
                            blurOnSubmit={false}
                            maxLength={10}
                        />

                    </View>

                    <View style={[rootStyle.flex, { gap: 10, paddingHorizontal: rootStyle.side }]}>
                        {/* {Boolean(idx * 1) && (
                            <Button type={10} style={{ flex: 1 }} onPress={deleteFunc}>{lang({ id: 'delete' })}</Button>    
                        )} */}
                        <Button style={{ flex: 1 }} onPress={submitFunc} disabled={disabled} load={load}>{lang({ id: 'save' })}</Button>
                    </View>
                </View>

            </View>


        </Layout >
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingVertical: 20,
            flex: 1,
        },

        top: {
            alignSelf: 'flex-end',
            marginBottom: 8
        },
        title: {
            fontSize: 20,
            color: colors.main,
            fontFamily: fonts.extraBold,
            textAlign: 'center',
        },
        label: {
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.medium,
            letterSpacing: -0.36
        }
    })

    return { styles }
}
