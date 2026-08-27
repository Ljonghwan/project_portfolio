import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Dimensions,
    useWindowDimensions,
    Modal,
    View,
    Image as RNImage
} from 'react-native';

import Svg, { Rect, Circle, Defs, Mask } from 'react-native-svg';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

const ratio = 4 / 3;

export default function Component({
    onLayout=()=>{},
    size=300,
    boxRatio=1
}) {

    const { styles } = useStyle();

    return (
        <View style={styles.maskContainer}>
            <View style={styles.cropArea}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <Mask id="mask" x="0" y="0" width="100%" height="100%">
                            {/* 전체 흰색 (보여지는 영역) */}
                            <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {/* 가운데 원은 검정 (가려지지 않음) */}
                            <Circle
                                cx={'50%'}
                                cy={'50%'}
                                r={size / 2}
                                fill="black"
                            />
                        </Mask>
                    </Defs>

                    <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="black"
                        opacity={0.6}
                        mask="url(#mask)"
                    />
                </Svg>

                <View style={[styles.maskContainer]}>
                    <View
                        style={[{ width: size, height: size }]}
                        collapsable={false}
                        onLayout={onLayout}
                    />
                </View>
            </View>

            
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        maskContainer: {
            ...StyleSheet.absoluteFillObject,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cropArea: {
            width: width,
            height: width * ratio
        },
    })

    return { styles }
}
