import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    View
} from 'react-native';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    FadeOut,
    runOnJS,
} from "react-native-reanimated";
import {
    GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";
import LottieView from 'lottie-react-native';


import BadgeUpdate from '@/components/Popup/BadgeUpdate';

import colors from '@/libs/colors';
import images from '@/libs/images';
import lang from '@/libs/lang';

import { getTreeBadge } from '@/libs/utils';

import { useUser, useAlert, useLottie, useConfig } from '@/libs/store';
import consts from '@/libs/consts';

export default function Loader() {

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const {
        open,
        source,
        type,
        closeLottie
    } = useLottie();
    const { badges } = useConfig();

    const lottieRef = useRef(null);

    const [afterView, setAfterView] = useState(false);
    const [treeBadge, setTreeBadge] = useState(null);

    const diameter = useSharedValue(0);

    useEffect(() => {
    }, [open])

    useEffect(() => {
        setTreeBadge(mbData ? getTreeBadge({ badges: badges, userBadges: mbData?.badges }) : null);
    }, [mbData])

    const handleNext = () => {
        // /v2/my/badgeUpdateCheck

        // setAfterView(true);
        handleClose();

        openAlertFunc({
            alertType: 'Sheet',
            component: <BadgeUpdate treeBadge={treeBadge}/>
        })

    }

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
                        if (type === 'badge') {
                            handleNext();
                        } else {
                            handleClose();
                        }

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
        badge: {
            ...StyleSheet.absoluteFillObject,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
        }
    })

    return { styles }
}
