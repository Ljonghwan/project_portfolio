import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Rating } from '@kolking/react-native-rating';
import { useKeyboardState, KeyboardAwareScrollView } from "react-native-keyboard-controller";

// component
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';

import RadioButton from '@/components/Radio2';
import Radio from '@/components/Radio3';

import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import Select from '@/components/Select';

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

import { useLang, useAlert, useConfig } from '@/libs/store';

export default function Page({ }) {

    const { idx, targetPost, targetDispatch } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    const titleref = useRef(null);
    const tipref = useRef(null);

    const [user, setUser] = useState(null);
    const [rating, setRating] = useState(0);
    const [tags, setTags] = useState([]);
    const [title, setTitle] = useState("");

    const [tip, setTip] = useState(false);
    const [tipPrice, setTipPrice] = useState(1);
    const [tipPriceInput, setTipPriceInput] = useState("");

    const [type, setType] = useState(null);
    const [content, setContent] = useState("");

    const [load, setLoad] = useState(false);
    const [initLoad, setInitLoad] = useState(true);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        dataFunc();
        console.log('configOptions?.reviewPassenge', configOptions?.reviewPassenger);
    }, [idx])

    useEffect(() => {

        setDisabled(!(rating && title));

    }, [rating, title])

    useEffect(() => {
        setTipPrice(1);
    }, [tip])

    useEffect(() => {
        if (tipPrice === 'other') tipref?.current?.focus();
    }, [tipPrice])

    const handleChange = useCallback(
        (value) => {
            console.log('value', value, Math.round((value) * 5) / 10)
            // setRating(Math.round((value) * 5) / 10)
            setRating(value)
        },
        [rating],
    );

    const dataFunc = async () => {

        let sender = {
            userIdx: idx
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v2/info/userInfo', sender);

        if (error) {
            ToastMessage(lang({ id: error?.message }), { type: 'error' });
            goBack();
            return;
        }

        console.log('data', JSON.stringify(data, null, 2));

        // setItem(data);

        setUser(data);

        setTimeout(() => {

            setInitLoad(false);

        }, consts.apiDelay)
    }

    const tagsChange = async (v) => {

    }


    const submitFunc = async () => {

        Keyboard.dismiss();

        if (disabled || load) return;

        setLoad(true);

        const sender = {
            targetIdx: idx,
            targetDispatch: targetDispatch,
            targetPost: targetPost,
            rate: rating,
            tags,
            message: title,
            tip: tip ? tipPrice : false
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v2/info/review', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                console.log('error', error);
                ToastMessage(lang({ id: error?.message }), { type: 'error' });
                return;
            }

            ToastMessage(lang({ id: 'thank_you_for_your_review' }));
            goBack();
        }, consts.apiDelay)

    }

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace(routes.tabs);
    }

    const header = {
        left: {
            icon: 'menu_2_on',
            onPress: () => {
                goBack()
            }
        },
    };


    return (
        <>
            <Layout header={header} >

                {initLoad && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed />}

                <KeyboardAwareScrollView
                    decelerationRate={'normal'}
                    bottomOffset={100}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    keyboardDismissMode={'on-drag'}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom
                    }}
                >
                    <View
                        style={styles.root}
                    >
                        <View style={styles.titleBox}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold), textAlign: 'center' }}>{lang({ id: 'write_review' })}</Text>
                            <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: 'share_your_feedback' })}</Text>
                        </View>

                        <View style={{ gap: 14 }}>
                            <View style={styles.profileBox}>
                                <Image source={consts.s3Url + user?.profile} style={styles.profile} />
                                <View style={{ gap: 5 }}>
                                    <Text style={{ ...rootStyle.font(20, colors.main, fonts.semiBold), textAlign: 'center' }}>{user?.firstName} {user?.lastName}</Text>
                                    <Text style={{ ...rootStyle.font(16, colors.sub_1, fonts.medium), textAlign: 'center' }}>{lang({ id: 'how_was_your' })} {user?.firstName} {user?.lastName}?</Text>
                                </View>
                            </View>

                            <View style={{ gap: 14, alignItems: 'center' }}>
                                {!initLoad && (
                                    <View style={{ marginVertical: 10 }}>
                                        <Rating
                                            rating={rating}
                                            onChange={handleChange}
                                            baseColor={colors.sub_3}
                                            fillColor={colors.taseta_sub_4}
                                            touchColor={colors.taseta_sub_4}
                                        />
                                    </View>
                                )}

                                <Text style={{ ...rootStyle.font(18, colors.main, fonts.medium), textAlign: 'center' }}>{lang({ id: 'what_did_you' })}</Text>
                                <Radio
                                    state={tags}
                                    setState={setTags}
                                    max={3}
                                    list={configOptions?.reviewDriver?.map((x) => {
                                        return { idx: x, title: lang({ id: x }) }
                                    })}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13, }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'tip_your_driver' })}</Text>
                            <RadioButton
                                state={tip}
                                setState={setTip}
                                list={[
                                    { idx: false, title: lang({ id: 'no' }) },
                                    { idx: true, title: lang({ id: 'yes' }) }
                                ]}
                            />

                            {tip && (
                                <>
                                    <Animated.View entering={FadeInRight}>
                                        <RadioButton
                                            state={tipPrice}
                                            setState={setTipPrice}
                                            numColumns={4}
                                            list={[
                                                { idx: 1, title: '$1' },
                                                { idx: 3, title: '$3' },
                                                { idx: 5, title: '$5' },
                                                { idx: 10, title: '$10' },
                                                // { idx: 'other', title: lang({ id: 'other' }) },
                                            ]}
                                        />
                                    </Animated.View>

                                    {tipPrice === 'other' && (
                                        <Animated.View entering={FadeInRight}>
                                            <Input
                                                iref={tipref}
                                                valid={"number"}
                                                name={'tipPriceInput'}
                                                state={tipPriceInput}
                                                setState={setTipPriceInput}
                                                placeholder={lang({ id: 'enter_amount' })}
                                                maxLength={3}
                                                unit={'$'}
                                            />
                                        </Animated.View>
                                    )}
                                </>
                            )}


                        </View>

                        <View style={{ gap: 13, }}>
                            <Text style={{ ...rootStyle.font(20, colors.main, fonts.extraBold) }}>{lang({ id: 'share_your_complimen' })}</Text>
                            <Input
                                iref={titleref}
                                name={'title'}
                                state={title}
                                setState={setTitle}
                                placeholder={lang({ id: 'maximum_50_character' })}
                                maxLength={50}
                            />
                        </View>

                        <Button style={{ flex: 1 }} onPress={submitFunc} disabled={disabled} load={load}>{lang({ id: 'leave_review' })}</Button>
                    </View>
                </KeyboardAwareScrollView>
            </Layout >
        </>
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
            paddingHorizontal: rootStyle.side,
            gap: 40
        },
        titleBox: {
            alignItems: 'center',
            gap: 5,

        },
        profileBox: {
            alignItems: 'center',
            gap: 10
        },
        profile: {
            width: 85,
            height: 85,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },


        keyboardExtend: {
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
        },
        priceText: {
            fontSize: 18,
            fontWeight: "600",
            padding: 20,
        },
        lightKeyboardText: {
            color: "black",
        },
        darkKeyboardText: {
            color: "white",
        },
    })

    return { styles }
}
