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

const ratio = 4 / 3;

export default function Component({
    onLayout=()=>{},
    size=300,
    boxRatio=1
}) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    return (
        <View style={styles.maskContainer}>
            <View style={styles.cropArea}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <Mask id="mask" x="0" y="0" width="100%" height="100%">
                            {/* 전체 흰색 (보여지는 영역) */}
                            <Rect x="0" y="0" width="100%" height="100%" fill="white" />

                            <Rect 
                                x={(styles.cropArea.width - size) / 2} 
                                y={(styles.cropArea.height - size * boxRatio) / 2} 
                                width={size} 
                                height={size * boxRatio}
                                fill="black" 
                                rx={28}
                                ry={28}
                            />
                        </Mask>
                    </Defs>

                    {/* 어두운 반투명 마스크, 가운데는 투명 */}
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
                        style={[{ width: size, height: size * boxRatio }]}
                        collapsable={false}
                        onLayout={onLayout}
                    />
                </View>
            </View>

            
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

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
