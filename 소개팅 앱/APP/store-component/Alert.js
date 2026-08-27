import React, {useRef, useState, useEffect, useCallback, useFocusEffect} from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  View,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  Modal
} from 'react-native';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, FadeOut, withTiming, Easing, ReduceMotion } from 'react-native-reanimated';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

import Text from '@/components/Text';
import TopVisual from '@/components/badges/TopVisual';

import images from '@/libs/images';
import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import { useAlert } from '@/libs/store';

export default function Alert() {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const { 
        openAlert, 
        theme,
        badge,
        icon,
        iconStyle,
        label,
        title,
        titleStyle,
        help,
        component,
        componentStyle,
        input,
        onCencle,
        onPress,
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
            transform: [
                { 
                    scale: withTiming(transform.value, {
                        duration: 400,
                        easing: Easing.elastic(1.2)
                    })
                }
            ],
        };
    });

    useEffect(() => {
        console.log('openAlert', openAlert);
        
        opacity.value = openAlert ? 1 : 1; 
        transform.value = openAlert ? 1 : 0.7; 

        transformY.value = openAlert ? 0 : 20; 
        
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
            statusBarTranslucent
            navigationBarTranslucent
        >
            <Pressable 
                style={styles.modal}
                onPress={handleClose}
            >   
                <TouchableWithoutFeedback>
                    <KeyboardStickyView style={{ width: '100%', maxWidth: 350 }} offset={{ closed: 0, opened: input }} enabled={Boolean(input)}>
                        <Animated.View 
                            style={[styles.main, animatedStyle, componentStyle]}
                        >
                            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                                <Image source={images.exit} style={rootStyle.exit}/>
                            </TouchableOpacity> */}
                            {component ? component : (
                                <View style={{ gap: 24, paddingHorizontal: 12, paddingBottom: 8 }}>
                                    <View style={{ gap: 24 }}>
                                        {badge && (
                                            <View style={[ rootStyle.flex ]}>
                                                <TopVisual />
                                            </View>
                                        )}
                                        {icon && ( 
                                            <View style={{ alignItems: 'center' }}>
                                                <Image source={icon} style={iconStyle || rootStyle.default36} />
                                            </View>
                                        )}
                                        {label && ( 
                                            <Text style={[styles.label, { paddingVertical: !title ? 7.5 : 0 }]} >{label}</Text>
                                        )}
                                        {title && (
                                            <Text style={[styles.title, titleStyle]}>{title}</Text>
                                        )}
                                        {help && (
                                            <Text style={styles.help}>{help}</Text>
                                        )}
                                    </View>

                                    <View style={styles.buttonBox}>
                                        {onCencleText && (
                                            <Pressable style={styles.buttonCencle} onPress={handleClose}>
                                                {({pressed}) => (
                                                    <Text style={[styles.buttonText, pressed && { opacity: 0.5 }]} >{onCencleText}</Text>
                                                )}
                                            </Pressable>
                                        )}

                                        {onPressText && (
                                            <Pressable style={styles.buttonOk} onPress={handleSubmit}>
                                                {({pressed}) => (
                                                    <Text style={[styles.buttonTextOk, pressed && { opacity: 0.5 }]} >{onPressText}</Text>
                                                )}
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            )}
                        </Animated.View >
                    </KeyboardStickyView>
                </TouchableWithoutFeedback>
            </Pressable>
            
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
            backgroundColor: theme === 'dark' ? colors.dark : colors.white,
            borderRadius: 20,
            overflow: 'hidden',
            width: '100%',
            padding: 8,
            paddingTop: 16
        },
        top: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
        },
        label: {
            fontSize: 18,
            color: theme === 'dark' ? colors.white : colors.dark,
            fontFamily: fonts.medium,
            textAlign: 'center',
        },
        title: {
            fontSize: 16,
            lineHeight: 20,
            color: theme === 'dark' ? colors.white : colors.dark,
            textAlign: 'center',
        },
        help: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.grey9,
            textAlign: 'center',
            marginTop: 10
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        buttonCencle: {
            flex: 1,
            backgroundColor: colors.greyE,
            borderRadius: 16,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonOk: {
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 16,
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
