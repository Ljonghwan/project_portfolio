import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Alert,
    Platform
} from 'react-native';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIAP } from 'react-native-iap';

import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';

import API from '@/libs/api';

import { useUser, useAlert, useConfig, useLoader } from '@/libs/store';

import { numFormat, useBottomSheetModalBackHandler, ToastMessage } from '@/libs/utils';

export default function Component({
    view,
    handleClose,
    item
}) {
    const {
        currentPurchase,
        currentPurchaseError,
        requestPurchase,
        finishTransaction,
        verifyPurchase,
    } = useIAP({
        onPurchaseSuccess: async (purchase) => {
            await verifyReceipt(purchase);
            return;

            const validation = await verifyPurchase({ apple: { sku: purchase?.productId } });
            console.log('validation', validation);
            if (validation.isValid) {
                await verifyReceipt(purchase);
            }
        },
        onPurchaseError: (error) => {
            console.log('error', error);
            closeLoader();
        }
    });

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();


    const { reload } = useUser();
    const { openLoader, closeLoader } = useLoader();

    const bottomSheetModalRef = useRef(null);

    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose());


    useEffect(() => {
        if (view && item) {
            Keyboard.dismiss();

            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [view, item, bottomSheetModalRef])


    useEffect(() => {
        console.log('currentPurchaseError', currentPurchaseError);
        if (currentPurchaseError) closeLoader();
    }, [currentPurchaseError]);



    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    // 구매 요청
    const handlePurchase = async (sku) => {
        if (!sku) return;

        openLoader();

        try {
            requestPurchase({
                request: {
                    ios: { sku }
                }
            });
        } catch (error) {
            console.log('error', error);
            closeLoader();
        }
       

        // await requestPurchase({ ios: { sku } });
    };


    // 서버에 영수증 검증 요청
    const verifyReceipt = async (purchase) => {

        const sender = {
            idx: item?.idx
        }

        console.log('sender', JSON.stringify(sender, null, 2));

        const { data, error } = await API.post('/pay/verifyApple', sender);

        // 구매를 마무리하고 트랜잭션 종료
        await finishTransaction({ purchase: purchase, isConsumable: false });
        closeLoader();

        if (error) {
            Alert.alert('알림', error?.message);
            return;
        }

        reload();
        handleClose();
        // router.back();
        ToastMessage(data);
    }


    return (

        <BottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetPositionChange}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            backgroundStyle={{ backgroundColor: 'transparent', borderRadius: 36 }}
        >
            <View>
                <BottomSheetView style={styles.component}>
                    <View
                        style={[
                            styles.container
                        ]}
                    >
                        <View style={styles.titleBox}>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={styles.title} >픽켓 구매</Text>
                                {/* <Icon img={images.exit_grey} imgStyle={rootStyle.default} onPress={handleClose} /> */}
                            </View>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={[rootStyle.flex, { gap: 4, flex: 1, justifyContent: 'flex-start' }]}>
                                    <Image source={images.info_black} style={rootStyle.default} tintColor={colors.text_info}/>
                                    <Text style={styles.help}>구매 전 환불 약관을 꼭 확인 해 주세요.</Text>
                                </View>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                    if (Platform.OS === 'android') {
                                        handleClose();
                                    }
                                    router.navigate({
                                        pathname: routes.terms,
                                        params: { idx: 4, title: '환불 약관' }
                                    })
                                }}>
                                    <Text style={[styles.help, { color: colors.text_sub, textDecorationLine: 'underline' }]}>보기</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <LinearGradient
                            style={[styles.infoBox]}
                            colors={colors.rankGradient1}
                        >
                            <View style={{ gap: 16 }}>
                                <Text style={styles.itemTitle}>{`${item?.name} ${item?.count}장`}</Text>
                                <Text style={styles.itemPrice} >{numFormat(item?.price)}원</Text>
                            </View>
                            <Image source={images.picket} style={[rootStyle.picket, styles.itemImage]} tintColor={colors.white}/>
                        </LinearGradient>

                        {Platform.OS === 'ios' && item?.appleSku ? (
                            <View style={{ gap: 12 }}>
                                {/* <Text style={styles.message}>다른 결제 방법</Text> */}

                                <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={() => {
                                    handlePurchase(item?.appleSku);
                                }}>
                                    <View style={[rootStyle.flex, { gap: 8 }]}>
                                        <Image source={images.apple_logo} style={rootStyle.default20} />
                                        <Text style={styles.buttonText}>App Store 결제</Text>
                                    </View>
                                    {/* <View style={[rootStyle.flex, { gap: 8 }]}>
                                        <Image source={images.flirting_white} style={[rootStyle.flirting, { width: 10 }]} />
                                        <Text style={[styles.buttonTextSmall]}>{`${item?.count}개 / ${numFormat(item?.price)}원`}</Text>
                                    </View> */}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Button 
                                textStyle={{ fontSize: 16 }} 
                                onPress={() => {
                                    handleClose();
                                    router.navigate({
                                        pathname: routes.payment,
                                        params: {
                                            type: 1,
                                            idx: item?.idx
                                        }
                                    });
                                }}
                            >카드결제</Button>
                        )}





                    </View>
                </BottomSheetView>

            </View>
        </BottomSheetModal>


    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        component: {
            overflow: 'hidden',
        },

        container: {
            padding: 21,
            paddingTop: 32,
            paddingBottom: 20 + insets?.bottom,
            gap: 17,
            backgroundColor: colors.white,
            borderRadius: 36,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
        },
        titleBox: {
            gap: 17,
        },
        title: {
            color: colors.dark,
            fontSize: 24,
            lineHeight: 32,
            fontFamily: fonts.semiBold,
        },
        infoBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            paddingHorizontal: 24,
            paddingVertical: 26,

            borderRadius: 20,
            overflow: 'hidden',
        },
        itemTitle: {
            fontSize: 28,
            letterSpacing: -0.7,
            color: colors.white,
            fontFamily: fonts.medium,
        },
        itemPrice: {
            fontSize: 20,
            letterSpacing: -0.35,
            color: colors.white,
            fontFamily: fonts.light,
        },
        itemImage: {
            width: 84,
        },
        help: {
            fontSize: width <= 320 ? 14 : 16,
            letterSpacing: -0.35,
            color: colors.text_info,
        },





        message: {
            fontSize: 16,
            letterSpacing: -0.35,
            color: colors.grey6,
            textAlign: 'center'
        },
        button: {
            backgroundColor: colors.black,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            height: 52,
            // paddingVertical: 12,
            gap: 6,
        },
        buttonText: {
            color: colors.white,
            fontFamily: fonts.semiBold,
            fontSize: 16,
        },
        buttonTextSmall: {
            color: colors.white,
            fontSize: 12,
            fontFamily: fonts.medium
        }
    })

    return { styles }
}
