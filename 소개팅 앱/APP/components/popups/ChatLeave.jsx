import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { Image } from "expo-image";
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import images from '@/libs/images';

import API from '@/libs/api';
import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';


export default function Component({ room }) {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser();
    const { closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    useEffect(() => {
    }, [room]);

    const handleClose = () => {
        closeAlertFunc();
    }



    const handleSubmit = async () => {

        handleClose();

        const sender = {
            roomIdx: room?.idx
        }

        const { data, error } = await API.post('/v1/chat/cancelChat', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        console.log('data', data);

        if (mbData?.level === 1 && data?.refundIdx) {
            router.navigate({
                pathname: routes.refundDetail,
                params: {
                    idx: data?.refundIdx
                }
            })
        } 

        // ToastMessage('소개팅이 취소되었습니다.');
        return;


        if (mbData?.level === 1 && data?.refundIdx) {
            router.replace({
                pathname: routes.refundDetail,
                params: {
                    idx: data?.refundIdx
                }
            })
        } else {
            router.back();
        }

        return;

        // router.back();
        // return;

        router.navigate({
            pathname: routes.paymentRefund,
            params: {
                roomIdx: room?.idx
            }
        })
        return;

        if (!data?.amount) {

            const sender2 = {
                roomIdx: room?.idx
            }

            const { data, error } = await API.post('/v1/refund/insert', sender2);

            return;
        }

        router.navigate({
            pathname: routes.paymentRefund,
            params: {
                roomIdx: room?.idx
            }
        })

        // router.navigate();
    }


    return (
        <View
            style={[styles.root]}
        >
            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                <Image source={images.exit} style={rootStyle.exit}/>
            </TouchableOpacity> */}

            <View style={{ gap: 24 }}>
                <View style={{ gap: 24, alignItems: 'center' }}>
                    <Image source={images.warning} style={rootStyle.default36} />
                    <Text style={styles.label} >{'소개팅을 종료하시겠습니까?'}</Text>
                    {/* <Text style={styles.title}>지금 소개팅을 취소하면…</Text> */}
                </View>

                <View style={styles.infoBox}>
                    {mbData?.level === 1 ? (
                        <>
                            {/* <Text style={styles.infoText}>ㆍ상대방이 사용 정지되어 일차별 환불이 적용됩니다.</Text> */}
                            {/* <Text style={styles.infoText}>ㆍ대화 내용이 모두 삭제되고 채팅 목록에서도 사라집니다.</Text> */}
                            {/* <Text style={styles.infoText}>ㆍ사계로그의 모든 내용이 사라집니다.</Text> */}
                            <Text style={styles.infoText}>ㆍ종료후에는 상대방과 대화할 수 없어요.</Text>
                            <Text style={styles.infoText}>ㆍ소개팅을 취소 시 현재 일차의 비례해 수수료가 부과됩니다.</Text>
                            {room?.superPicket > 0 && <Text style={styles.infoText}>ㆍ사용한 슈퍼 픽켓은 만남이 이루어지지 않아 돌려받습니다.</Text>}
                        </>
                    ) : (
                        <>
                            {/* <Text style={styles.infoText}>ㆍ상대방이 사용 정지되어 전달받았던 픽켓을 모두 수령 가능합니다.</Text> */}
                            <Text style={styles.infoText}>ㆍ종료후에는 상대방과 대화할 수 없어요.</Text>
                            <Text style={styles.infoText}>{`ㆍ3박4일 소개팅 조건을 미충족 시\n픽켓 수령 페널티를 받을 수 있습니다.`}</Text>
                            {/* <Text style={styles.infoText}>ㆍ대화 내용이 모두 삭제되고 채팅 목록에서도 사라집니다.</Text> */}
                            {/* <Text style={styles.infoText}>ㆍ사계로그의 모든 내용이 사라집니다.</Text> */}
                        </>
                    )}
                </View>

                {mbData?.level === 1 && (
                    <View style={{ gap: 16 }}>
                        {room?.superPicket > 0 && (
                            <View style={styles.picketBox}>
                                <View style={{ gap: 10 }}>
                                    <Text style={styles.picketText}>수령할 슈퍼 픽켓</Text>
                                    <View style={[rootStyle.flex, { gap: 5 }]}>
                                        <Image source={images.super_picket} style={[rootStyle.default]} />
                                        <Text style={styles.picketText}>{`${numFormat(room?.superPicket)}장`}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {mbData?.level === 1 && (
                            <View style={styles.refundBox}>
                                <View style={{ gap: 8 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={styles.refundText}>결제금액</Text>
                                        <Text style={styles.refundText}>{`${numFormat(room?.refundInfo?.amount)}원`}</Text>
                                    </View>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={[styles.refundText, { fontSize: width <= 360 ? 11 : 12 }]}>ㆍ취소 수수료 ({room?.refundInfo?.desc})</Text>
                                        <Text style={[styles.refundText, { fontSize: width <= 360 ? 11 : 12 }]}>{`- ${numFormat(room?.refundInfo?.amount - room?.refundInfo?.refundAmount)}원`}</Text>
                                    </View>
                                </View>
                                <View style={styles.bar} />
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', marginTop: 5 }]}>
                                    <Text style={[styles.refundText, { fontFamily: fonts.medium, fontSize: 14 }]}>환불 금액</Text>
                                    <Text style={styles.refundTextRed}>{`${numFormat(room?.refundInfo?.refundAmount)}원`}</Text>
                                </View>
                            </View>
                        )}

                    </View>
                )}

            </View>
            <View style={styles.buttonBox}>
                <Button style={{ flex: 1 }} type={4} onPress={handleClose}>아니요</Button>
                <Button style={{ flex: 1 }} type={2} textStyle={{ fontSize: 16 }} onPress={handleSubmit}>소개팅 종료</Button>
            </View>
        </View >

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 24
        },
        label: {
            fontSize: 18,
            color: colors.dark,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.5
        },
        title: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey9,
            textAlign: 'center',
            letterSpacing: -0.35
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },

        infoBox: {
        },
        infoText: {
            fontSize: 12,
            lineHeight: 22,
            color: colors.text_info,
            letterSpacing: -0.35,
            textAlign: 'center'
        },

        picketBox: {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 16
        },
        picketText: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
            letterSpacing: -0.45,
            textAlign: 'center'
        },
        refundBox: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.greyD,
            paddingHorizontal: 16,
            paddingVertical: 10
        },
        refundText: {
            fontSize: 12,
            color: colors.grey5,
        },
        refundTextRed: {
            fontSize: 15,
            color: colors.red,
            fontFamily: fonts.semiBold,
        },
        bar: {
            width: '100%',
            height: 0.5,
            backgroundColor: colors.greyD9,
            marginVertical: 12
        }
    })

    return { styles }
}
