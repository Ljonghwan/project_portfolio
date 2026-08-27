import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

export default function useBottomSheetBackHandler(sheetRef, isOpen) {
    useEffect(() => {
        if (Platform.OS !== 'android' || !isOpen) return;

        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            sheetRef.current?.dismiss();
            return true;
        });

        return () => handler.remove();
    }, [sheetRef, isOpen]);
}
