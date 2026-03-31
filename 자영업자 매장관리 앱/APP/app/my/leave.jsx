import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, Linking } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOutRight, FadeInLeft } from 'react-native-reanimated';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';
import { unlink, isLogined } from '@react-native-kakao/user';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import TextList from '@/components/TextList';
import TextInput from '@/components/TextInput';

import Tab from '@/components/Ui/Tab';

import Feedback from '@/components/Item/Feedback';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat } from '@/libs/utils';

import { useUser, useStore, useConfig, useEtc, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout } = useUser();
    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const { configOptions } = useConfig();

    const [selected, setSelected] = useState(null);
    const [comment, setComment] = useState("");

    const [load, setLoad] = useState(true);
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setDisabled(!(selected && (selected !== 99) || (selected === 99 && comment?.trim()?.length > 1)));
    }, [selected, comment])

    const leaveAlert = () => {
        openAlertFunc({
            label: '회원탈퇴 하시겠습니까?',
            onCencleText: '취소',
            onPressText: '탈퇴하기',
            onCencle: () => { },
            onPress: leaveFunc
        })
    }

    const leaveFunc = async () => {
        openLoader();

        const sender = {
            type: configOptions?.leaveOptions?.find(x => x?.idx === selected)?.title,
            desc: selected === 99 ? comment : ""
        }
        const { data, error } = await API.post('/v1/auth/leave', sender);

        setTimeout(async () => {
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            // 카카오 로그인중이면 연동해제 처리
            if (await isLogined()) {
                await unlink();
            }

            ToastMessage("탈퇴되었습니다.");
            logout();



        }, consts.apiDelay)
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '회원탈퇴',
    };

    return (
        <Layout header={header} >

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={100}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 100, paddingHorizontal: 30 }}
            >
                <View style={{ gap: 24 }}>
                    <Text style={{ ...rootStyle.font(24, colors.text2B2B2B, fonts.bold) }}>😢 정말 탈퇴하시겠어요?</Text>

                    <View style={{}}>
                        <Text style={styles.msg}>회원 탈퇴 시 다음 정보가 모두 삭제되며 복구가 불가능합니다.</Text>
                        <TextList style={styles.msg}>등록한 직원 및 노무대장</TextList>
                        <TextList style={styles.msg}>매입/매출 내역</TextList>
                        <TextList style={styles.msg}>이벤트(쿠폰) 발송 기록</TextList>
                        <TextList style={styles.msg}>커뮤니티 게시글 및 댓글</TextList>
                        <TextList style={styles.msg}>고객관리 정보</TextList>
                    </View>

                    <View style={{ gap: 16 }}>
                        <Text style={{ ...rootStyle.font(16, colors.text2B2B2B, fonts.bold) }}>계정을 삭제하려는 이유가 궁금해요</Text>

                        <View>
                            {configOptions?.leaveOptions?.map((x, i) => {
                                return (
                                    <TouchableOpacity key={i} activeOpacity={0.7} style={[rootStyle.flex, { justifyContent: 'space-between', paddingVertical: 12, gap: 10 }]} onPress={() => setSelected(x?.idx)}>
                                        <Text style={{ ...rootStyle.font(15, colors.black), flexShrink: 1 }}>{x?.title}</Text>
                                        <Image source={selected === x?.idx ? images.radio_on : images.radio_off} style={rootStyle.default} transition={100} />
                                    </TouchableOpacity>
                                )
                            })}

                            {selected === 99 && (
                                <Animated.View key={selected} entering={FadeInRight} style={{}}>
                                    <TextInput
                                        autoFocus
                                        value={comment}
                                        onChangeText={setComment}
                                        placeholder="계정을 삭제하려는 이유를 알려주세요."
                                        maxLength={50}
                                        style={{
                                            fontSize: 14
                                        }}
                                    />
                                </Animated.View>
                            )}

                        </View>
                    </View>
                </View>

            </KeyboardAwareScrollView>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={disabled} onPress={leaveAlert}>탈퇴하기</Button>
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({

        msg: {
            fontSize: 14,
            color: colors.text757575,
            lineHeight: 24
        }
    })

    return { styles }
}