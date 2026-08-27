import React, { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    View
} from 'react-native';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from "react-native-reanimated";
import {
    GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";
import LottieView from 'lottie-react-native';


import lotties from '@/libs/lotties';
import colors from '@/libs/colors';

// zustand
import { useLottie } from '@/libs/store';

export default function Loader() {

    const { styles } = useStyle();

    const {
        open,
        source,
        closeLottie
    } = useLottie();

    const lottieRef = useRef(null);

    useEffect(() => {

    }, [open])

    const handleClose = () => {
        closeLottie();
    }

    return (
        <OverKeyboardView visible={open}>
            <GestureHandlerRootView style={styles.fullScreen}>
                <LottieView
                    ref={lottieRef}
                    source={source}
                    autoPlay={true}
                    loop={false}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={'cover'}
                    onAnimationFailure={(err) => {
                        handleClose();
                    }}
                    onAnimationFinish={() => {
                        handleClose();
                    }}
                />
            </GestureHandlerRootView>
        </OverKeyboardView>
    );
}

const useStyle = () => {

    const styles = StyleSheet.create({
        fullScreen: {
            flex: 1,
        },
    })

    return { styles }
}
