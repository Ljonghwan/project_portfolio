import { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';

import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    component,
    list=[],
    style,
    listStyle,
    top,
    right,
    onPress=()=>{}
}) {

    const { width: scrennWidth, height: scrennHeight } = useWindowDimensions();
    const { styles } = useStyle();

    const [view, setView] = useState(false);

    const [position, setPosition] = useState({});
    const [boxHeight, setBoxHeight] = useState(0);

    useEffect(() => {
        console.log('position', position, scrennWidth, scrennHeight);
    }, [position])

    const handlePress = (event) => {
        if(list?.length < 1) return;

        const { pageX, pageY, locationX, locationY } = event.nativeEvent;

        const x = scrennWidth - pageX;
        const y = (scrennHeight - pageY) < boxHeight ? pageY - boxHeight : pageY + 20;
        setPosition({ x, y });

        setView(true)
    }
    const handleClose = () => {
        setView(false)
    }

    const onLayout = useCallback((event) => {

        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                console.log('x, y, width, height, pageX, pageY', { x, y, width, height, pageX, pageY });
                // setPosition({ x: scrennWidth - pageX - width, y: pageY });
                setBoxHeight(height);
            },
        );

    }, []);
    
    return (
        <>
            <TouchableOpacity
                style={[
                    styles.root,
                    style
                ]}
                onPress={handlePress}
            >
                {component ? component : (
                    <Image source={images.more} style={rootStyle.default} />
                )}
                
            </TouchableOpacity>

            <View style={{ width: "100%", height: "100%", position: "absolute" }}>
                <Modal 
                    visible={view} 
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
                        <TouchableWithoutFeedback >
                            <View style={[styles.main, listStyle, { top: top || position?.y, right: right || position?.x } ]} collapsable={false} onLayout={onLayout}>
                                {list?.map((x, i) => {
                                    return (
                                        <TouchableOpacity 
                                            key={i} 
                                            hitSlop={10}
                                            style={[ styles.listOne ]} 
                                            onPress={() => {
                                                onPress(x);
                                                handleClose()
                                            }}
                                        >
                                            <Text style={[styles.listText]} >{x?.title}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </TouchableWithoutFeedback>
                    </Pressable>
                    
                </Modal>
            </View>
        </>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();
        
    const styles = StyleSheet.create({
        root: {

        },

        modal: {
            position: 'absolute',
            top: 0,
            left: 0, 
            right: 0, 
            bottom: 0, 
            margin: 0,
            flex: 1,
        },
        main: {
            position: 'absolute',
            backgroundColor: colors.white,
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.main,
            padding: 20,
            gap: 16
        },
        listOne: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        listText: {
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            letterSpacing: -0.35
        }

    });


  	return { styles }
}
