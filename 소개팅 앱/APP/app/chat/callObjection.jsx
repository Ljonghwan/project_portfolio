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

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import CallObjection from '@/components/CallObjection';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser, useAlert, usePhotoPopup, useConfig } from '@/libs/store';

import { ToastMessage, hpHypen, regNick, randomNumberCreate, numFormat } from '@/libs/utils';

import API from '@/libs/api';
import consts from '@/libs/consts';

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { roomIdx } = useLocalSearchParams();

    const { mbData, reload, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();
    const { configOptions } = useConfig();

    const iref = useRef(null);
    const commentRef = useRef(null);

    const [title, setTitle] = useState("");
    const [reportType, setReportType] = useState(null);
    const [reportDesc, setReportDesc] = useState("");
    const [comment, setComment] = useState("");

    const [file, setFile] = useState(null);
    const [photo, setPhoto] = useState([]);

    const [report, setReport] = useState(false);

    const [agree, setAgree] = useState(false);

    const [disabled, setDisabled] = useState(false);
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [error, setError] = useState({});

    useEffect(() => {
        setDisabled(!(photo?.length > 0 && reportType));
    }, [photo, reportType, comment])


    const photoAddFunc = () => {
        if (photo?.length >= 4) {
            ToastMessage('최대 4장까지 등록 가능합니다.');
            return;
        }

        openPhotoFunc({
            setPhoto: (v) => {
                setPhoto([...photo, ...v])
            },
            selectionLimit: 4 - photo?.length,
            photoMode: 'library'
        })

    }


    const submitFunc = async () => {

        Keyboard.dismiss();

        if (load) return;

        setLoad(true);

        const sender = {
            roomIdx: roomIdx,
            optionIdx: reportType,
            desc: reportDesc,
            content: comment,
            file: photo
        }

        const { data, error } = await API.post('/v1/chat/objection', sender);

        setTimeout(() => {
            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('접수가 완료되었습니다.');
            router.back();

        }, consts.apiDelay)

    }

    const header = {

        title: '3박 4일 소개팅 전화 소명',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'call_objection',
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
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                contentContainerStyle={{
                    paddingBottom: insets?.bottom + 100,
                }}
            >
                <View style={{ flex: 1, padding: 20, gap: 30 }}>
                    <Text style={[styles.title, { marginBottom: -10 }]}>{`전화 소명할 이미지와 내용을 적어주세요.`}</Text>

                    <View style={{ gap: 10 }}>
                        <Text style={{ ...rootStyle.font(15, colors.dark), lineHeight: 20, letterSpacing: -0.35 }}>1. 사진 첨부 (필수)</Text>

                        {photo?.length > 0 && (
                            <View style={[rootStyle.flex, { width: '100%', gap: 4, justifyContent: 'flex-start' }]}>
                                {photo?.map((item, index) => (
                                    <View key={index} style={{ width: '24%', aspectRatio: 1 }}>
                                        <TouchableOpacity style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }} hitSlop={10} activeOpacity={0.5} onPress={() => {
                                            setPhoto(photo?.filter((_, i) => i !== index))
                                        }}>
                                            <Image source={images.close} style={rootStyle.default20} />
                                        </TouchableOpacity>
                                        <Image key={index} source={item} style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} transition={100} />
                                    </View>
                                ))}
                            </View>
                        )}



                        <TouchableOpacity style={[styles.uploadButton, { flexDirection: 'row', aspectRatio: 'auto', paddingVertical: 20, gap: width <= 320 ? 12 : 20 }]} activeOpacity={0.5} onPress={photoAddFunc}>
                            <Image source={images.upload} style={{ width: 36, aspectRatio: 1 }} />
                            <View>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 14 : 18, colors.primary, fonts.medium), lineHeight: 26, textAlign: 'center', letterSpacing: -0.63 }}>터치하여 이미지를 업로드</Text>
                                <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 14, colors.primary, fonts.light), letterSpacing: -0.49 }}>{`* 최대 4장까지 등록 가능합니다.`}</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={{ ...rootStyle.font(12, colors.red1), lineHeight: 20, letterSpacing: -0.3, textAlign: 'center' }}>※날짜 / 통화 시간(지속시간) / 통화 대상 정보 포함 필수</Text>
                    </View>

                    <View style={{ gap: 10 }}>
                        <Text style={{ ...rootStyle.font(15, colors.dark), lineHeight: 20, letterSpacing: -0.35 }}>2. 통화 단축/불인정 사유 선택 (필수)</Text>

                        <View style={[rootStyle.flex, { gap: 8 }]}>
                            <TouchableOpacity style={[styles.select]} onPress={() => setReport(!report)} >
                                <Text style={styles.selectText} numberOfLines={1}>
                                    {
                                        reportType === 9 ? reportDesc?.replace(/\n/g, ' ')
                                            : (configOptions?.objectionOptions?.find((x) => x?.idx === reportType)?.title?.replace(/\n/g, ' ')
                                                || "아래 항목 중 해당되는 사유를 선택해 주세요.")
                                    }
                                </Text>
                                <Image source={images.down} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ gap: 10 }}>
                        <Text style={{ ...rootStyle.font(width <= 320 ? 13 : width <= 340 ? 14 : 15, colors.dark), lineHeight: 20, letterSpacing: -0.35 }}>3. 추가로 전달할 내용이 있다면 간단히 기재해 주세요.</Text>

                        <TextArea
                            name={'comment'}
                            inputStyle={{ fontSize: 14 }}
                            inputWrapStyle={{ height: 150 }}
                            state={comment}
                            setState={setComment}
                            placeholder={`내용을 입력해 주세요.`}
                            blurOnSubmit={false}
                            maxLength={255}
                            multiline
                            error={error}
                            setError={setError}
                        />
                    </View>

                </View>

            </KeyboardAwareScrollView>

            <Button type={'2'} disabled={disabled} onPress={submitFunc} load={load} bottom>작성하기</Button>

            <CallObjection
                view={report}
                value={reportType}
                desc={reportDesc}
                handleClose={() => setReport(false)}
                onSubmit={(v) => {
                    setReport(false);
                    setReportType(v?.optionIdx || null);
                    setReportDesc(v?.desc || "");
                }}
            />

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        title: {
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.semiBold,
            color: colors.dark
        },
        subTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            color: colors.grey6
        },
        uploadButton: {
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.main2,
            width: '100%',
            aspectRatio: width > 500 ? 2 : 1,
            gap: 20
        },

        select: {
            flex: 1,
            height: 48,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyC,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        selectText: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.3
        },
    })

    return { styles }
}
