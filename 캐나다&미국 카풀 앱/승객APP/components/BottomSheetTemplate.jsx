import React, { useCallback } from 'react';

import {
    StyleSheet,
    useWindowDimensions,
    Text
} from 'react-native';

import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/libs/colors';

import { useBottomSheetBackHandler } from '@/libs/utils';

export default function BottomSheetTemplate({
    children,
    sheetRef,
    snapPoints = [],
    onChange = () => { },
    onAnimate = () => { },
    animatedPosition = null,
    enableHandlePanningGesture = true,
    handleStyle,
    handleIndicatorStyle
}) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const handleClose = () => {
        // sheetRef?.current?.forceClose();
    }

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.1}
                pressBehavior={0}
            />
        ),
        []
    );

    // const { handleSheetPositionChange } = useBottomSheetBackHandler(sheetRef, () => handleClose());


    return (
        <BottomSheet
            ref={sheetRef}
            index={0}
            snapPoints={snapPoints}
            style={styles.sheet}
            handleStyle={[{ height: 40, justifyContent: 'center' }, handleStyle]}
            handleIndicatorStyle={[{ backgroundColor: colors.sub_2, width: 100, height: 5 }, handleIndicatorStyle]}
            backdropComponent={renderBackdrop}
            enableOverDrag={false}
            enableDynamicSizing={true}
            enableHandlePanningGesture={enableHandlePanningGesture}
            onChange={onChange}
            onAnimate={onAnimate}
            animatedPosition={animatedPosition}
            backgroundStyle={{ backgroundColor: colors.white, borderRadius: 12 }}
        >
            <BottomSheetView style={styles.component}>
                {children}
            </BottomSheetView>
        </BottomSheet>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        sheet: {
            elevation: 20, // 안드로이드 그림자

            shadowColor: colors.dark, // iOS 그림자
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,

            borderWidth: 0
        },
        component: {
            overflow: 'hidden',
            paddingTop: 0,
        },


    })

    return { styles }
}