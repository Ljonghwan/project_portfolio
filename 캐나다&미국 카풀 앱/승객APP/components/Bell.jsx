import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from "expo-router";

import colors from '@/libs/colors';
import images from '@/libs/images';
import routes from '@/libs/routes';

import API from '@/libs/api';
import rootStyle from '@/libs/rootStyle';

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
        const { data, error } = await API.post('/v2/my/alarmList');
        setCheck(data?.filter(x => !x?.read )?.length > 0);
    }

    return (
        <TouchableOpacity
            style={[
                styles.root,
                style
            ]}
            onPress={() => router.push(routes.alarm)}
        >
            <Image source={check ? images.bell_on : images.bell} style={rootStyle.default} transition={100}/>
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
   
});
