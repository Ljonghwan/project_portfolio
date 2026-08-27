import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
    Keyboard
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Text from '@/components/Text';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import { useAlert } from '@/libs/store';

export default function Alert() {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const { 
        openAlert, 
        theme,
        label,
        title,
        component,
        input,
        onCencle,
        onPress,
        onDismiss=()=>{},
        onEnd,
        onCencleText,
        onPressText,
        onPressTheme,
        closeAlertFunc
    } = useAlert();

    const [view, setView] = useState(false);

   
    
    const opacity = useSharedValue(0);
    const transform = useSharedValue(0);
    const transformY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(opacity.value, { duration: 300 }),
            transform: [
                { scale: withTiming(transform.value, { duration: 300 }) },
            ],
        };
    });

    useEffect(() => {
        console.log('openAlert', openAlert);
        
        opacity.value = openAlert ? 1 : 1; 
        transform.value = openAlert ? 1 : 0.8; 
        transformY.value = openAlert ? 0 : 20; 
        

        // NavigationBar.setVisibilityAsync('hidden');
        // NavigationBar.setBackgroundColorAsync('#ffffff00');
        
    }, [openAlert]);


    useEffect(() => {
        
    }, [openAlert])

    const handleClose = () => {
        if(input) Keyboard.dismiss();

        closeAlertFunc();

        if(onCencle) onCencle();
        if(onEnd) onEnd();
    }
    const handleSubmit = () => {
        closeAlertFunc();

        if(onPress) onPress();
        if(onEnd) onEnd();
    }


    return (
        <Modal 
            visible={Boolean(openAlert)} 
            animationType={'fade'}
            onRequestClose={handleClose}
            transparent
            statusBarTranslucent={true}
            navigationBarTranslucent={true}
            onDismiss={onDismiss}
        >
            <GestureHandlerRootView>
                <Pressable 
                    style={styles.modal}
                    onPress={handleClose}
                >   
                    <TouchableWithoutFeedback>
                        <KeyboardStickyView style={{ width: '100%', maxWidth: 380 }} offset={{ closed: 0, opened: input }} enabled={Boolean(input)}>
                            <Animated.View 
                                style={[styles.main, animatedStyle]}
                            >
                                {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                                    <Image source={images.exit} style={rootStyle.exit}/>
                                </TouchableOpacity> */}
                                
                                {component ? component : (
                                    <View style={{ gap: 16, paddingHorizontal: 28, paddingVertical: 33 }}>
                                        <View style={{ gap: 5 }}>
                                            {label && ( 
                                                <Text style={styles.label} >{label}</Text>
                                            )}
                                            {title && (
                                                <Text style={styles.title}>{title}</Text>
                                            )}
                                        </View>

                                        <View style={styles.buttonBox}>
                                            {onCencleText && (
                                                <Button style={{ flex: 1, maxWidth: 200 }} type={2} onPress={handleClose}>{onCencleText}</Button>
                                            )}
                                            {onPressText && (
                                                <Button style={{ flex: 1, maxWidth: 200 }} onPress={handleSubmit}>{onPressText}</Button>
                                            )}
                                        </View>
                                    </View>
                                )}

                            </Animated.View>
                        </KeyboardStickyView>
                    </TouchableWithoutFeedback>
                </Pressable>
            </GestureHandlerRootView>
        </Modal>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const { theme, onPressTheme } = useAlert();

    const styles = StyleSheet.create({
        modal: {
            position: 'absolute',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            margin: 0,
            flex: 1,
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
        main: {
            backgroundColor: colors.white,
            borderRadius: 13,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 380,
        },
        top: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
        },
        label: {
            fontSize: 20,
            color: colors.main,
            fontFamily: fonts.extraBold,
            textAlign: 'center',
        },
        title: {
            fontSize: 16,
            lineHeight: 22,
            color: colors.sub_1,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.64
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14
        },
        buttonCencle: {
            flex: 1,
            backgroundColor: colors.greyE,
            borderRadius: 8,
            maxWidth: '50%',
            height: 52,
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonOk: {
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 8,
            maxWidth: '50%',
            height: 52,
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonText: {
            fontSize: 16,
            color: theme === 'dark' ? colors.white : colors.grey6,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        buttonTextOk: {
            fontSize: 16,
            color: theme === 'dark' ? colors.white : colors.white,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },

    })
  
    return { styles }
}
