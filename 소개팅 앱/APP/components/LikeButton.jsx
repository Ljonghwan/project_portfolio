import { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from "expo-image";
import LottieView from 'lottie-react-native';

import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({
    active,
    count,
    type='1',
    load=false,
    onPress=()=>{}
}) {

    const insets = useSafeAreaInsets();

    const lottieRef = useRef(null);

    const backgroundColor = useSharedValue(styles[`type_${type}`]?.backgroundColor);
    const opacity = useSharedValue(1);
    const textColor = useSharedValue(styles[`type_${type}_text`]?.color);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 1 }),
        };
    });
    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 300 }),
        };
    });
    useEffect(() => {
        backgroundColor.value = active ? colors.mainOp5Hex : styles[`type_${type}`]?.backgroundColor; 
        textColor.value = active ? colors.pink : styles[`type_${type}_text`]?.color; 

        if(active) {
            setTimeout(() => {
                lottieRef.current?.play(15, 50);
            }, 10)
        } else {
            setTimeout(() => {
                lottieRef.current?.play(0, 0);
            }, 10)
        }
    }, [active])


    return (
        <>
            <View style={styles.root}>
                <AnimatedTouchable 
                    style={[
                        styles[`type_${type}`],
                        {
                            backgroundColor: active ? colors.mainOp5Hex : styles[`type_${type}`]?.backgroundColor
                        }
                    ]}
                    onPress={onPress} 
                    disabled={load}
                >
                    {({pressed}) => (
                        <>
                            <LottieView
                                ref={lottieRef}
                                source={images.lottie_like}
                                autoPlay={false}
                                loop={false}
                                style={styles.lottie}
                                resizeMode={'cover'}
                                // onAnimationFailure={(err) => {
                                //     lottieRef?.current?.reset()
                                // }}
                                onAnimationFinish={() => {
                                    // lottieRef?.current?.reset()
                                }}
                            />
                            {/* <Image source={active ? images.heart_on : images.heart_off} style={rootStyle.default} /> */}
                            <Animated.Text
                                style={[
                                    styles[`type_${type}_text`],
                                    pressed && { opacity: 0.5 },
                                    {
                                        color: active ? colors.pink : styles[`type_${type}_text`]?.color
                                    }
                                ]}
                                allowFontScaling={false}
                            >
                                {count}
                            </Animated.Text>
                            {load && (
                                <Loading style={{ position: 'absolute', backgroundColor: styles[`type_${type}`]?.backgroundColor, borderRadius: styles[`type_${type}`]?.borderRadius }}/>
                            )}
                        </>
                    )}
                </AnimatedTouchable>
                
            
                
            </View>

           
        </>
    );
}

const styles = StyleSheet.create({
    
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
    },
    type_1: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingLeft: 50,
        borderRadius: 100,
        gap: 4,
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.greyF1,
    },
    type_1_text: {
        color: colors.grey9,
        textAlign: "center",
        fontSize: 14,
        letterSpacing: -0.35
    },
    lottie: {
        position: 'absolute',
        left: -30,
        // backgroundColor: 'rgba(0, 0, 0, 0.2)',
        width: 120, 
        height: 120 
    }
});
