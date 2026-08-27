import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    View,
    Pressable,
    TouchableOpacity,
    TouchableWithoutFeedback,
    BackHandler,
    Linking
} from 'react-native';

import { router, Stack, useFocusEffect } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView
} from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
    GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";
import { setStatusBarStyle } from 'expo-status-bar';

import dayjs from 'dayjs';
import { shuffle } from 'lodash';

import Text from '@/components/Text';
import Carousel from '@/components/Carousel';


import { useBackHandler, useBottomSheetModalBackHandler, getDateStatus } from '@/libs/utils';

import { useConfig } from '@/libs/store';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

export default function Loader({ page }) {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { configOptions, popupDisable, setPopupDisable } = useConfig();

    const bottomSheetModalRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [popup, setPopup] = useState(null);

    useFocusEffect(
        useCallback(() => {
            // setPopupDisable([]);
        }, [])
    );


    useFocusEffect(
        useCallback(() => {
            getPopups();

            return () => {
                onReset();
            };
        }, [popupDisable])
    );

    useEffect(() => {
        if (popup) {
            setOpen(true);
            bottomSheetModalRef.current?.present();
            setStatusBarStyle('light', true);
        }

        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            if (popup) return true;
            return false;
        });

        return () => {
            backHandler.remove();
        };
    }, [popup])


    useEffect(() => {

    }, [popupDisable])

    const getPopups = async () => {
        
        try {
            const { data, error } = await API.post('/popup');
            const popups = data?.filter(x => getDateStatus(x?.sdate, x?.edate) === 2);
            const now = dayjs();
            const disables = popupDisable.filter(x => !dayjs(x?.date).isBefore(now)).map(x => x?.idx);

            let findData = popups?.find(x => !disables?.includes(x?.idx) && x?.target === page) || null;
            if (findData?.image_type === 2) findData = { ...findData, image: findData?.image.sort(() => Math.random() - 0.5) };

            setPopup(findData);
        } catch (error) {
            console.log('error', error);
        }

    }

    const handleClose = (option = false) => {
        // router.push(routes.myNews);
        // return;

        let day = 1;
        if (option) {
            day = popup?.close === 2 ? popup?.close_day : popup?.close === 3 ? 9999 : 1;
        }
        const now = dayjs();

        setPopupDisable([
            ...popupDisable.filter(x => !dayjs(x?.date).isBefore(now) && x?.idx !== popup?.idx),
            { idx: popup?.idx, date: now.add(day, 'days').format('YYYY-MM-DD HH:mm:ss') }
        ])

        onReset();
    }

    const onReset = () => {
        setStatusBarStyle('dark', true);
        bottomSheetModalRef.current?.dismiss();
        setOpen(false);
        setPopup(null);
    }

    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose());

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior={'none'}
            />
        ),
        []
    );

    const renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity style={{ width: Math.min(width - 40, 340), aspectRatio: 3 / 4 }} activeOpacity={1} onPress={() => {
                Linking.openURL(item?.link);
            }}>
                <Image source={consts.s3Url + item?.image} style={{ width: '100%', height: '100%', backgroundColor: colors.placeholder }} transition={100}/>
            </TouchableOpacity>
        )

    };
    const renderSheetItem = ({ item, index }) => (
        <TouchableOpacity style={{ width: width, aspectRatio: 4 / 3 }} activeOpacity={1} onPress={() => {
            Linking.openURL(item?.link);
        }}>
            <Image source={consts.s3Url + item?.image} style={{ width: '100%', height: '100%', backgroundColor: colors.placeholder }} transition={100}/>
        </TouchableOpacity>
    );

    return (
        popup?.type === 1 ? (
            <OverKeyboardView visible={open} >
                <GestureHandlerRootView style={styles.fullScreen}>
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{ flex: 1 }}
                    // onPress={handleClose}
                    >
                        <View style={styles.modal}>
                            <View style={{ borderRadius: 8, overflow: 'hidden' }}>
                                <View style={{ width: Math.min(width - 40, 340), aspectRatio: 3 / 4, backgroundColor: colors.white }}>
                                    <Carousel
                                        list={popup?.image}
                                        renderItem={renderItem}
                                        paginationType={'page'}
                                    />
                                </View>
                                <View style={styles.bottom}>
                                    <Pressable hitSlop={10} onPressIn={() => handleClose(true)}>
                                        <Text style={styles.bottomText}>
                                            {popup?.close === 2 && popup?.close_day}{configOptions?.popupCloseType?.find(x => x?.idx === popup?.close)?.title || ''}
                                        </Text>
                                    </Pressable>
                                    <Pressable hitSlop={10} onPressIn={handleClose}>
                                        <Text style={styles.bottomText}>닫기</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </GestureHandlerRootView>
            </OverKeyboardView >

        ) : popup?.type === 2 ? (
            <BottomSheetModal
                ref={bottomSheetModalRef}
                // onChange={handleSheetPositionChange}
                backdropComponent={renderBackdrop}
                handleStyle={[{ display: 'none' }]}
                topInset={rootStyle.header.height}
                enableOverDrag={false}
                enableDynamicSizing={true}
                enablePanDownToClose={false}
                activeOffsetX={[-20, 20]} // 좌우 스와이프를 허용
                activeOffsetY={[-5, 5]}   // 세로 스크롤 감도 조정
                failOffsetX={[-5, 5]}     // 세로 스크롤 우선
                backgroundStyle={[{ backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden' }]}
                stackBehavior={'push'}
            >
                <BottomSheetView style={{ paddingBottom: insets?.bottom, borderRadius: 20, overflow: 'hidden' }}>
                    <Carousel
                        list={popup?.image}
                        renderItem={renderSheetItem}
                        paginationType={'page'}
                    />
                    <View style={styles.bottom}>
                        <Pressable hitSlop={10} onPressIn={() => handleClose(true)}>
                            <Text style={styles.bottomText}>
                                {popup?.close === 2 && popup?.close_day}{configOptions?.popupCloseType?.find(x => x?.idx === popup?.close)?.title || ''}
                            </Text>
                        </Pressable>
                        <Pressable hitSlop={10} onPressIn={handleClose}>
                            <Text style={styles.bottomText}>닫기</Text>
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        ) : (
            <></>
        )

    );
}

const useStyle = () => {

    const styles = StyleSheet.create({
        fullScreen: {
            flex: 1,
        },
        modal: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
        bottom: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.white,
            height: 55,
            paddingHorizontal: 23
        },
        bottomText: {
            fontSize: 14,
            color: colors.text757575,
            fontFamily: fonts.medium
        },
        slide: {
            width: '100%',
            height: '100%'
        }
    })

    return { styles }
}
