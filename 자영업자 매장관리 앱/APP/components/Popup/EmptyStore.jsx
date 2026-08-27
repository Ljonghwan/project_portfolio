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
import { setStatusBarStyle } from 'expo-status-bar';

import dayjs from 'dayjs';
import { shuffle } from 'lodash';

import Text from '@/components/Text';
import Carousel from '@/components/Carousel';
import Button from '@/components/Button';

import { useBackHandler, useBottomSheetModalBackHandler, getDateStatus } from '@/libs/utils';

import { useConfig } from '@/libs/store';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

export default function Component({  }) {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { emptyStore, setEmptyStore } = useConfig();

    const bottomSheetModalRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [popup, setPopup] = useState(null);

    // useFocusEffect(
    //     useCallback(() => {
    //         bottomSheetModalRef.current?.present();
    //     }, [])
    // );
    useEffect(() => {
        bottomSheetModalRef.current?.present();
    }, [])

    const handleClose = () => {
        bottomSheetModalRef.current?.dismiss();
        setEmptyStore(true);
    }


    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose() );

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


    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetPositionChange}
            backdropComponent={renderBackdrop}
            handleStyle={[{ display: 'none' }]}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            enablePanDownToClose={false}
            backgroundStyle={[{ backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden' }]}
            stackBehavior={'push'}
        >
            <BottomSheetView style={{ paddingBottom: insets?.bottom + 20, borderRadius: 20, overflow: 'hidden' }}>

                <TouchableOpacity style={styles.exit} onPress={handleClose}>
                    <Image source={images.exit} style={rootStyle.default} />
                </TouchableOpacity>

                <View style={{ paddingTop: 34, paddingHorizontal: rootStyle.side }}>
                    <Text style={{...rootStyle.font(20, colors.textPrimary, fonts.semiBold), lineHeight: 34 }}>{`서비스 이용을 위해\n매장 등록을 시작할게요.`}</Text>

                    <Image source={images.store} style={[rootStyle.store, { alignSelf: 'center', marginTop: 100, marginBottom: 40 }]} />
                    <Button onPress={() => {
                        handleClose();
                        router.push(routes.storeAdd);
                        // router.push(routes.businessTypeSearch);
                    }}>등록하기</Button>
                </View>
            </BottomSheetView>
        </BottomSheetModal>

    );
}

const useStyle = () => {

    const styles = StyleSheet.create({
        exit: {
            position: 'absolute',
            top: 16,
            right: 21,
            zIndex: 1000,
        }
    })

    return { styles }
}
