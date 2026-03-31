import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from "expo-router";

import colors from '@/libs/colors';
import images from '@/libs/images';
import routes from '@/libs/routes';

import API from '@/libs/api';

export default function Component({
    style,
}) {
    
    const [ check, setCheck ] = useState(false);


    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [])
    );

    const dataFunc = async () => {
        
        const { data, error } = await API.post('/v1/alarm/count');
        setCheck(data?.alarmCount > 0)
    }
    return (
        <TouchableOpacity
            style={[
                styles.root,
                style
            ]}
            onPress={() => router.navigate(routes.alarm)}
        >
            <Image source={images.bell} style={styles.icon} />
            {check && <View style={styles.dot}/>}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    root: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 24,
        height: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 100,
        backgroundColor: colors.red,
        position: 'absolute',
        top: 16,
        right: 20
    }
});
