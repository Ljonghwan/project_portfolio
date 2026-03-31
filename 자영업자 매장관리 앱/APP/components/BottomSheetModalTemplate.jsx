import React, { useCallback } from 'react';

import {
    StyleSheet,
    useWindowDimensions,
    Text
} from 'react-native';

import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/libs/colors';

import { useBottomSheetBackHandler } from '@/libs/utils';

export default function BottomSheetTemplate({
    children,
    index = 0,
    sheetRef,
    snapPoints = [],
    onChange = () => { },
    onAnimate = () => { },
    animatedPosition = null,
    enableHandlePanningGesture = true,
    handleStyle,
    handleIndicatorStyle,
    componentStyle,
    backdrop = false,
    stackBehavior = 'switch',
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const handleClose = () => {
        // sheetRef?.current?.forceClose();
    }

   const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const { handleSheetPositionChange } = useBottomSheetBackHandler(sheetRef, () => {});

    return (
        <BottomSheetModal
            ref={sheetRef}
            style={styles.sheet}
            handleStyle={[{ height: 40, justifyContent: 'center' }, handleStyle]}
            handleIndicatorStyle={[{ backgroundColor: colors.cdcfd0, width: 50, height: 5 }, handleIndicatorStyle]}
            backdropComponent={renderBackdrop}
            onChange={handleSheetPositionChange}
            enableOverDrag={false}
            enableDynamicSizing={true}
            animatedPosition={animatedPosition}
            backgroundStyle={{ backgroundColor: colors.white, borderRadius: 12 }}

			keyboardBlurBehavior={'restore'}
            enableBlurKeyboardOnGesture={true}
            stackBehavior={stackBehavior}
        >
            
            <BottomSheetView style={[styles.component, componentStyle]}>
                {children}
            </BottomSheetView>
        </BottomSheetModal>
        
    );
}


const useStyle = () => {

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
            paddingBottom: insets?.bottom + 20
        },


    })

    return { styles }
}