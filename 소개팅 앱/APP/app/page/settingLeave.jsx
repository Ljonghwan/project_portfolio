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
    Keyboard,
    Platform
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import ListText from '@/components/ListText';
import CheckBox2 from '@/components/CheckBox2';

import UserLeave from '@/components/popups/UserLeave';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser, useAlert } from '@/libs/store';

import { ToastMessage, hpHypen, regNick, randomNumberCreate, numFormat } from '@/libs/utils';

import API from '@/libs/api';
import consts from '@/libs/consts';

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout } = useUser();
    const { openAlertFunc } = useAlert();

    const iref = useRef(null);

    const [comment, setComment] = useState("");
    const [agree, setAgree] = useState(false);
    const [seasonLog, setSeasonLog] = useState(0);

    const [disabled, setDisabled] = useState(false);
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [error, setError] = useState({});

    useEffect(() => {
        dataFunc();
    }, []);

    useEffect(() => {
        setDisabled(!(comment?.length > 0));

    }, [comment])

    const dataFunc = async () => {
        const { data, error } = await API.post('/v1/user/meetHistory');

        setSeasonLog(data?.reduce((acc, item) => acc + item?.count, 0));
    }

    const submitAlert = () => {
        let flirting = mbData?.level === 1 ? mbData?.flirting : mbData?.receiveflirting;
        
        openAlertFunc({
            component: <UserLeave flirting={flirting} seasonLog={seasonLog} onSubmit={submitFunc}/>
        })
        return;
        openAlertFunc({
            label: `회원탈퇴`,
            title: `소개팅 진행 중에 탈퇴를 하면,\n소개팅 정보가 삭제되고, 환불 받을 수 없습니다.\n\n${flirting > 0 ? `보유중인 플러팅 ${numFormat(flirting)}개가 소멸됩니다.` : ''}\n\n탈퇴하시겠습니까?`,
            onCencleText: "취소",
            onPressText: "탈퇴하기",
            onPress: submitFunc
        })
    }

    const submitFunc = async () => {
        Keyboard.dismiss();

        if (load) return;

        setLoad(true);

        const sender = {
            content: comment
        }

        const { data, error } = await API.post('/v1/user/delete', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            openAlertFunc({
                icon: images.alert_info,
                iconStyle: rootStyle.default36,
                label: `회원 탈퇴 되었습니다.`,
                onPressText: "확인",
                onCencle: logout,
                onPress: logout
            })
            
        }, consts.apiDelay)

    }

    const header = {
        title: '회원 탈퇴',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting_leave',
            style: {
                width: 26,
                height: 26,
            },
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={colors.white}>

            <KeyboardAwareScrollView
                bottomOffset={150}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 100,
					paddingHorizontal: rootStyle.side,
                }}
            >
                <View style={{ flex: 1, gap: 12 }}>
                    <View style={{ gap: 8, paddingHorizontal: 10 }}>
                        <Text style={styles.title}>{`사소한 1%앱을 탈퇴하시겠어요?`}</Text>
                        <Text style={styles.subTitle}>회원 탈퇴 전 내용을 확인해 주세요.</Text>
                    </View>

                    <View style={{ gap: 26, paddingHorizontal: 12, paddingVertical: 16 }}>
                        <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                            <Image source={images.leave_info} style={rootStyle.default20} />
                            <Text style={styles.messageBold}>{`회원님의 활동 내역과 픽켓이 모두 사라져요!`}</Text>
                        </View>

                        <View style={styles.flirtingBox}>
                            <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                <Image source={images.picket} style={[rootStyle.picket, { width: 30 }]} />
                                <Text style={styles.flirting}>픽켓</Text>
                            </View>
                            <Text style={[styles.flirting]}>{numFormat(mbData?.level === 1 ? mbData?.flirting : mbData?.receiveflirting)}장</Text>
                        </View>

                        <View style={{ gap: 8 }}>
                            <ListText style={styles.help}>회원 탈퇴 시 계정과 관련된 복구가 불가능합니다.</ListText>
                            <ListText style={styles.help}>현재 보유 중인 픽켓, 소개팅 주선 대화방은 모두 소멸되며, 재화는 재가입 후에도 복구할 수 없습니다.</ListText>
                            <ListText style={styles.help}>회원 탈퇴를 신청하시면 해당 아이디는 즉시 탈퇴처리 되며, 이후 영구적으로 사용이 중지되므로 새로운 아이디로 재가입이 가능합니다.</ListText>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 19, paddingVertical: 16, gap: 15 }}>
                        <Text style={[styles.title, { fontSize: 16, lineHeight: 20, fontFamily: fonts.medium }]}>{`회원 탈퇴 사유를 작성해 주세요.`}</Text>
                        <TextArea
                            iref={iref}
                            name={'comment'}
                            state={comment}
                            setState={setComment}
                            placeholder={`탈퇴 사유를 입력해 주세요.`}
                            blurOnSubmit={false}
                            maxLength={255}
                            multiline
                            error={error}
                            setError={setError}
                        />
                    </View>
                </View>
{/* 
                <View style={{ padding: 20 }}>
                    <CheckBox2
                        label={`위 내용에 모두 동의합니다.`}
                        checked={agree}
                        onCheckedChange={(v) => {
                            setAgree(v)
                        }}
                    />
                </View> */}
            </KeyboardAwareScrollView>

            <Button 
                type={'2'} 
                disabled={disabled} 
                onPress={submitAlert} 
                load={load} 
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'setting_leave'} 
                frontIconTintColor={colors.white}
            >
                {header?.title}
            </Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        title: {
            fontSize: width <= 320 ? 20 :24,
            lineHeight: 32,
            fontFamily: fonts.semiBold,
            color: colors.dark
        },
        subTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            color: colors.grey6
        },
        messageBold: {
            fontSize: width <= 320 ? 14 : 18,
            letterSpacing: -0.35,
            color: colors.primary,
            fontFamily: fonts.semiBold,
        },
        flirtingBox: {
            paddingHorizontal: 26,
            paddingVertical: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        flirting: {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.primary,
            fontFamily: fonts.semiBold,
        },
        help: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.text_info,
        }
    })

    return { styles }
}
