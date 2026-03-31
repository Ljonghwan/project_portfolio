import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Platform,
    Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeInRight, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

// component
import Loading from '@/components/Loading';
import InputFlirting from '@/components/InputFlirting';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import ListText from '@/components/ListText';
import GradientButton from '@/components/GradientButton';
import Icon from '@/components/Icon';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useAlert, useConfig } from '@/libs/store';

import API from '@/libs/api';

export default function Page({ item }) {

    const {
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const iref = useRef(null);

    const [accept, setAccept] = useState(true);

    const [view, setView] = useState(false);

    const [flirting, setFlirting] = useState(0);
    const [todayFlirting, setTodayFlirting] = useState(0);
    const [target, setTarget] = useState(null);

    const [comment, setComment] = useState("");

    const [toggle, setToggle] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [disabled, setDisabled] = useState(true);

    const [error, setError] = useState(null);


    useEffect(() => {
        roomInfo();
    }, [roomIdx])

    useEffect(() => {

        setDisabled(!(comment?.length > (accept ? 9 : 19)));
        if (comment?.length > 0 && comment?.length < (accept ? 10 : 20)) {
            setError({ ...error, comment: `${(accept ? 10 : 20)}자 이상으로 작성해야 합니다.` })
        } else {
            setError({ ...error, comment: `` })
        }

    }, [accept, comment])

    const roomInfo = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/finalInfo', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        console.log('roominfo', data);

        // setFlirting(data?.flirting);
        // setTodayFlirting(data?.todayFlirting);
        setTarget(data?.targetUser);
        setFlirting(data?.topFlirting);
        // setComment(data?.message);

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay);
    }


    const submitAlert = () => {

        if (load) return;

        const inputReplace = comment?.replace(/\s+/g, '');
        if (!comment || inputReplace?.length < 1) {
            ToastMessage('내용을 입력 해 주세요.');
            return;
        }

        openAlertFunc({
            label: `결정의 날 선택`,
            title: `상대방과의 만남을 ${accept ? '수락' : '거절'}하시겠습니까?`,
            help: !accept && `*거절 시 탑 플러팅을 수령 할 수 없어요.`,
            onCencleText: "취소",
            onPressText: accept ? '수락' : '거절',
            onCencle: () => { },
            onPress: submitFunc
        })
    }

    const submitFunc = async () => {

        setLoad(true);

        let sender = {
            roomIdx: roomIdx,
            status: accept,
            message: comment
        }

        console.log('sender', sender);

        const { data, error } = await API.post('/v1/capsule/finalSelect', sender);

        if (error) {
            ToastMessage(error?.message);
            setLoad(false);
            return;
        }

        setTimeout(() => {
            setLoad(false);
            router.back();
        }, consts.apiDelay);

    }

    const header = {
        leftTitleWithIcon: '결정의 날',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };
    // {
    //     "type": "finalSelectVisual",
    //     "profile": "/profiles/e5022bc3-efa5-49ea-a1e4-d7aebb68658a.jpg"
    // }

    return (
        <Layout header={header} >

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={100}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"never"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >

                <View style={{ flex: 1 }}>

                    <View style={[rootStyle.flex, { padding: 20 }]}>
                        <Image source={images.final} style={[rootStyle.final, { width: 281 }]} />
                    </View>

                    <View style={{ padding: 20, gap: 20 }}>
                        <View style={{ gap: 8 }}>
                            <Text style={styles.title}>결정의 날입니다!</Text>
                            <Text style={styles.subTitle}>{`최종 결정을 하면 더 이상 수정할 수 없으니,\n신중하게 결정해 주세요.\n* 수락 시, 등록한 사진과 함께 연락처가 상대에게 공개됩니다.\n* 거절 시에는 사진만 전달되며, 연락처는 공유되지 않습니다.`}</Text>
                            <Text style={styles.subTitle2}>상대방과의 만남 의향이 있으신가요?</Text>

                            <View style={[rootStyle.flex, { gap: 8 }]}>
                                <GradientButton
                                    style={{ flex: 1 }}
                                    type={accept ? 1 : 2}
                                    icon={accept ? images.heart_white : images.heart_dark}
                                    iconStyle={rootStyle.default}
                                    onPress={() => {
                                        setAccept(true);
                                        setView(false);
                                        setComment('');
                                    }}
                                >
                                    수락
                                </GradientButton>
                                <GradientButton
                                    style={{ flex: 1 }}
                                    type={!accept ? 1 : 2}
                                    icon={!accept ? images.heart_off_white : images.heart_off_dark}
                                    iconStyle={rootStyle.default}
                                    onPress={() => {
                                        setAccept(false);
                                        setView(false);
                                        setComment('');
                                    }}
                                >
                                    거절
                                </GradientButton>
                            </View>
                        </View>

                        <Animated.View key={accept ? 'accept' : 'reject'} entering={FadeInRight} style={{ gap: 20 }} >
                            <Text style={styles.subTitle2}>{accept ? '축하드립니다! 마음을 담은 한마디를 적어 주세요!' : '아쉽지만.. 이해를 구하는 따뜻한 사유를 부탁드려요.'}</Text>
                            <Text style={styles.subTitle}>{`상대방의 마음을 헤아려서 매너 있고 정중한 표현 부탁드립니다.`}</Text>

                            <TouchableOpacity style={[rootStyle.flex, { justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4 }]} activeOpacity={0.7} onPress={() => { setView(!view) }}>
                                <Image source={images.info} style={rootStyle.default} />
                                <Text style={[styles.subTitle, { color: colors.main, textAlign: 'left', lineHeight: 24, flex: 1 }]}>{`답변하기가 어렵다면 아이콘을 눌러 예시를 확인해 보세요!`}</Text>
                            </TouchableOpacity>

                            {view && (
                                <Animated.View entering={FadeIn.duration(200)} style={styles.infoBox}>
                                    {configOptions?.finalOptions?.[accept ? 'success' : 'fail']?.map((x, i) => {
                                        return (
                                            <ListText key={i} style={styles.infoBoxText} selectable={true}>{x}</ListText>
                                        )
                                    })}
                                </Animated.View>
                            )}

                            <TextArea
                                name={'comment'}
                                state={comment}
                                setState={setComment}
                                placeholder={`${accept ? '수락 사유를 10자' : '거절 사유를 20자'} 이상 입력해 주세요.`} 
                                blurOnSubmit={false}
                                inputWrapStyle={{ height: 150 }}
                                maxLength={255}
                                multiline
                                error={error}
                            />


                            {flirting > 0 && (
                                <View style={{ gap: 20 }}>
                                    <View style={[rootStyle.flex, { gap: 15 }]}>
                                        <Image source={target?.profile ? consts.s3Url + target?.profile : images.profile} style={styles.profile} />
                                        <Image source={images.flirting} style={[rootStyle.flirting, { width: 18 }]} />
                                        <View style={{ gap: 4 }}>
                                            <Text style={styles.flirting}>현재 이 결정에 걸려있는 탑 플러팅</Text>
                                            <Text style={styles.flirtingCount}>{numFormat(flirting)}개</Text>
                                        </View>
                                    </View>

                                    {mbData?.level === 1 ? (
                                        <Text style={[styles.subTitle, { color: colors.red2 }]}>{accept ? '*수락 시 탑 플러팅이 전송 됩니다.' : '*거절 시 탑 플러팅은 전송되지 않습니다.'}</Text>
                                    ) : (
                                        <Text style={[styles.subTitle, { color: colors.red2 }]}>{accept ? '*수락 시 탑 플러팅을 수령할 수 있습니다.' : '*거절 시 탑 플러팅을 수령할 수 없습니다.'}</Text>
                                    )}

                                </View>
                            )}



                        </Animated.View>

                    </View>

                </View>

            </KeyboardAwareScrollView>

            <Button bottom type={'2'} onPress={submitAlert} disabled={disabled} load={load}>결정하기</Button>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        title: {
            fontSize: 24,
            lineHeight: 30,
            color: colors.main,
            letterSpacing: -0.6,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        subTitle: {
            fontSize: 14,
            lineHeight: 22,
            color: colors.grey6,
            letterSpacing: -0.35,
            textAlign: 'center'
        },
        subTitle2: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            letterSpacing: -0.4,
            fontFamily: fonts.medium,
            textAlign: 'center'
        },

        infoBox: {
            padding: 12,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 8,
            gap: 8
        },
        infoBoxText: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },

        profile: {
            width: 40,
            aspectRatio: 1 / 1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },

        flirting: {
            color: colors.dark,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        flirtingCount: {
            color: colors.dark,
            fontSize: 32,
            lineHeight: 36,
            letterSpacing: -0.8,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
    })

    return { styles }
}
