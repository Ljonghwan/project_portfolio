import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    View
} from 'react-native';

import colors from '@/libs/colors';

// zustand
import { useLoader } from '@/libs/store';

export default function Loader() {

    const { styles } = useStyle();

    const { 
        open, 
        closeLoader
    } = useLoader();

    useEffect(() => {
        console.log('open', open);
    },[open])
    
    const handleClose = () => {
        closeLoader();
    }

    return (
        <Modal 
            visible={Boolean(open)} 
            animationType={'fade'}
            transparent
            statusBarTranslucent
            navigationBarTranslucent={true}
        >
            <View style={styles.modal}>
                <ActivityIndicator size="small" color={colors.white} />
            </View>
        </Modal>
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
