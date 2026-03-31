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
    ActivityIndicator
} from 'react-native';

import { router } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ListText from '@/components/ListText';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Button from '@/components/Button';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import { useUser, useAlert, usePhotoPopup } from '@/libs/store';

import API from '@/libs/api';

const max = 3;
export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();
    const { openAlertFunc } = useAlert();

    const [photos, setPhotos] = useState([]);

    const [item2, setItem2] = useState(null);
    const [agree2, setAgree2] = useState(false);

    const [disabled, setDisabled] = useState(false);
    const [load, setLoad] = useState(false); // 데이터 추가 로딩


    useEffect(() => {
        setDisabled(!(photos?.length >= max));
    }, [photos])



    const photoFunc = (index) => {

        openPhotoFunc({
            setPhoto: (v) => setPhoto({ v: v?.[0], i: index }),
            deleteButton: true
        })

    }

    const photoAddFunc = () => {

        openPhotoFunc({
            setPhoto: (v) => {
                setPhotos(v)
            },
            selectionLimit: max,
            photoMode: 'library'
        })

    }

    const setPhoto = ({ v, i }) => {

        if (!v) {
            setPhotos(photos?.filter((item, index) => index !== i))
        } else {
            setPhotos(photos?.map((item, index) => {
                if (index === i) return v;
                return item
            }))
        }

    }

    const submitFunc = async () => {
        if (load) return;

        setLoad(true);

        let sender = {
            photoList: photos
        }
        const { data, error } = await API.post('/v1/main/topApply', sender);


        setTimeout(() => {

            setLoad(false);

            if (error) {
                if(error?.data?.subMessage) {
                    openAlertFunc({
                        icon: images.warning,
                        label: error?.message,
                        title: error?.data?.subMessage,
                        titleStyle: { fontSize: 14, color: colors.text_info },
                        onPressText: "확인",
                    })
                } else {
                    ToastMessage(error?.message);
                }
               
                return;
            }

            openAlertFunc({
                icon: images.alert_info,
                // badge: true,
                label: `1% 회원 신청이 완료 되었습니다!`,
                title: "담당자가 지원서 검토 후, 제공해 주신 연락처로 개별 연락드릴 예정입니다.",
                onPressText: "닫기",
                onCencle: () => {
                    router.back()
                },
                onPress: () => {
                    router.back()
                }
            })

        }, consts.apiDelay)
    }


    const header = {
        title: '1% 회원 지원하기',
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_top2',
            style: {
                width: 32,
                height: 32,
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

            <ScrollView
                style={{
                    flex: 1,
                    height: '100%'
                }}
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 10,
                    gap: 30
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 10 }}>
                    {photos?.length > 0 ? (
                        <View style={{ paddingVertical: 10, gap: 10 }}>
                            <View style={styles.itemList}>
                                {[...Array(max)]?.map((item, index) => {
                                    return (
                                        <View key={index} style={[styles.item]}>
                                            {photos?.[index] && (
                                                <Image
                                                    source={photos?.[index]?.uri || consts.s3Url + photos?.[index]}
                                                    style={[styles.itemImage]}
                                                    transition={200}
                                                />
                                            )}
                                        </View>
                                    )
                                })}
                            </View>
                            <TouchableOpacity style={[styles.uploadButton, { flexDirection: 'row', aspectRatio: 'auto', paddingVertical: 20, gap: width <= 320 ? 12 : 20 }]} activeOpacity={0.5} onPress={photoAddFunc}>
                                <Image source={images.upload} style={{ width: 36, aspectRatio: 1 }} />
                                <View>
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 14 : 18, colors.primary, fonts.medium), lineHeight: 26, textAlign: 'center', letterSpacing: -0.63 }}>터치하여 이미지를 다시 업로드</Text>
                                    <Text style={{ ...rootStyle.font(width <= 320 ? 11 : 14, colors.primary, fonts.light), lineHeight: 26, letterSpacing: -0.49 }}>{`* 이미지 3장을 선택하여 업로드 해주세요.`}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.5} onPress={photoAddFunc}>
                            <Image source={images.upload} style={{ width: 80, aspectRatio: 1 }} />
                            <View>
                                <Text style={{ ...rootStyle.font(18, colors.primary, fonts.medium), textAlign: 'center', lineHeight: 26 }}>터치하여 이미지를 업로드</Text>
                                <Text style={{ ...rootStyle.font(14, colors.primary, fonts.light), textAlign: 'center', lineHeight: 26 }}>{`* 이미지 3장을 선택하여 업로드 해주세요.`}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>


                <View style={{ gap: 18 }}>
                    <View style={[rootStyle.flex, { gap: 7, justifyContent: 'flex-start' }]}>
                        <Image source={images.info} style={rootStyle.default}/>
                        <Text style={[rootStyle.font(18, colors.primary, fonts.semiBold)]}>1% 회원 지원시 확인해 주세요</Text>
                    </View>
                    <View style={{ gap: 7 }}>
                        <ListText style={styles.help}>{`담당자가 지원서 검토 후,\n제공해 주신 연락처로 개별 연락드릴 예정입니다.`}</ListText>
                        <ListText style={styles.help}>{`내부 심사 기준에 적합하지 않을 시\n별도의 연락을 드리지 않고 있습니다.`}</ListText>
                    </View>
                </View>


            </ScrollView>

            <Button 
                type={'2'} 
                load={load} 
                disabled={disabled}
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'my_top'} 
                frontIconTintColor={colors.white}
                onPress={submitFunc}
            >
                1% 회원 지원하기
            </Button>


        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        uploadButton: {
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary5,
            width: '100%',
            aspectRatio: 360/250,
            gap: 20
        },
        list: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4,
            paddingBottom: insets.bottom + 100,
            paddingTop: 20
        },
        itemList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 7.5,
            overflow: 'hidden',
        },
        itemMain: {
            width: '100%',
            flex: '3/4'
        },
        item: {
            flex: 1,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: colors.greyD9,
            borderRadius: 12,
        },
        itemImage: {
            width: '100%',
            height: '100%'
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
