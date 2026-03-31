import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from "expo-router";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import colors from '@/libs/colors';
import images from '@/libs/images';
import routes from '@/libs/routes';

import API from '@/libs/api';
import rootStyle from '@/libs/rootStyle';
import protectedRouter from '@/libs/protectedRouter';

import { useUser } from '@/libs/store';


export default function Component({
    style,
}) {
    
    const { badgeCount } = useUser();

    const [ check, setCheck ] = useState(false);


    return (
        <TouchableOpacity
            style={[
                styles.root,
                style
            ]}
            hitSlop={10}
            onPress={() => protectedRouter.push(routes.alarm)}
        >
            <Image source={images.bell} style={rootStyle.default} transition={100}/>
            {badgeCount > 0 && <Animated.View entering={FadeIn} style={styles.dot}/>}
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

    dot: {
        width: 7,
        height: 7,
        borderRadius: 100,
        backgroundColor: colors.primary,
        position: 'absolute',
        top: 10,
        right: 0
    }
   
});
