import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react';

import {
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    View,
    Modal,
    Pressable,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';

import { regPhone, useBottomSheetBackHandler } from '@/libs/utils';

export default function BottomSheetTemplate({ 
    children,
    sheetRef,
    onChange
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
				disappearsOnIndex={-1}
				appearsOnIndex={0}
			/>
		),
		[]
	);

    const { handleSheetPositionChange } = useBottomSheetBackHandler(sheetRef, () => handleClose() );

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            style={{  }}
            handleStyle={{ display: 'none' }}
            backdropComponent={renderBackdrop}
            enableOverDrag={false}
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            onChange={onChange ? onChange : handleSheetPositionChange}
            backgroundStyle={{ backgroundColor: colors.white, borderRadius: 20 }}
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
        component: {
            overflow: 'hidden',
            paddingTop: 20,
        },

        blur: {
            width: '100%',
            height: 40,
            position: 'absolute',
            bottom: 0,
            zIndex: 1,
        }
      
    })
  
    return { styles }
}