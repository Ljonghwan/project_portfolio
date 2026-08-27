import React, { useEffect, useState, useRef } from 'react';

import { router } from "expo-router";
import { Image } from 'expo-image';
import {
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';

import { useUser } from '@/libs/store';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import { ToastMessage } from '@/libs/utils';

export default function Component({ style, styleImage, profile, setProfile }) {

    const { styles } = useStyle();

    const { mbData } = useUser();

    const startFunc = () => {
        if(!mbData?.passenger && mbData?.applyInfo?.status < 3) {
            ToastMessage(lang({ id: 'your_approval' }), { type: "error" });
            return;
        }
        
        router.push(routes.myEditProfile);
    }
   
    return (
        <>
            <TouchableOpacity style={[styles.profileBox, style]} onPress={startFunc} activeOpacity={0.7}>
                <Image 
                    source={profile?.uri || (profile ? consts.apiUrl + profile : images.profile)} 
                    style={[styles.profile, styleImage]} 
                    transition={200}
                />
                <Image 
                    source={images.pen} 
                    style={[styles.profileCamera]} 
                />
            </TouchableOpacity>
        </>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        
        profileBox: {
            width: 85,
            height: 85,
            
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        },
        profile: {
            width: '100%',
            height: '100%',
            borderRadius: 100,
            
            backgroundColor: colors.greyE,
            objectFit: 'cover'
        },
        profileCamera: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 21,
            height: 21
        },


        photoNull: {
            width: 24,
            height: 24
        },
        itemProfileOverlayBox: {
            position: 'absolute',
            bottom: 0,
            right: 0
        }
       
    })
  
    return { styles }
}