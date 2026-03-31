import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    View
} from 'react-native';

import {
    GestureHandlerRootView
} from "react-native-gesture-handler";
import { OverKeyboardView } from "react-native-keyboard-controller";

import colors from '@/libs/colors';

// zustand
import { useLoader } from '@/libs/store';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function Loader() {

    const { styles } = useStyle();

    const { 
        open, 
        closeLoader
    } = useLoader();

    const [view, setView] = useState(false);

    useEffect(() => {
        console.log('open', open);
		if(open) setView(true);
        else {
            setTimeout(() => {
                setView(false);
            }, 200)
        }
    },[open])
    
    const handleClose = () => {
        closeLoader();
    }

    return (
        <OverKeyboardView visible={Boolean(view)}>
			<GestureHandlerRootView style={{ flex: 1}}>
                {open && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={styles.modal}
                    >
                        <ActivityIndicator size="small" color={colors.white} />
                    </Animated.View>
                )}
            </GestureHandlerRootView>
        </OverKeyboardView>

        // <Modal 
        //     visible={Boolean(open)} 
        //     animationType={'fade'}
        //     transparent
        //     statusBarTranslucent
        //     navigationBarTranslucent={true}
        // >
        //     <View style={styles.modal}>
        //         <ActivityIndicator size="small" color={colors.white} />
        //     </View>
        // </Modal>
    );
}

const useStyle = () => {

    const styles = StyleSheet.create({
        modal: {
            position: 'absolute',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            margin: 0,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
    })
  
    return { styles }
}
