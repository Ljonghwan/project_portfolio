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
    view,
    setView,
    position,
    onPress=()=>{}
}) {

    const { width: scrennWidth, height: scrennHeight } = useWindowDimensions();
    const { styles } = useStyle();

    const [boxHeight, setBoxHeight] = useState(0);

    useEffect(() => {
        console.log('position', position, scrennWidth, scrennHeight);
    }, [position])

   
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
                            <View style={[styles.main, { top: position?.y } ]} collapsable={false} onLayout={onLayout}>
                                {component}
                            </View>
                        </TouchableWithoutFeedback>
                    </Pressable>
                    
                </Modal>
            </View>
        </>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
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
            overflow: 'hidden',
            width: width - 40,
            left: 20
        },
        

    });


  	return { styles }
}
