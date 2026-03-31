import React, {useRef, useState} from 'react';

import {
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    View,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";

import { usePhotoPopup } from '@/libs/store';

import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

export default function Component({ style, styleImage, styleCamera, profile, setProfile }) {

    const { styles } = useStyle();

    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const photoFunc = () => {

        router.navigate(routes.profilePhoto);
        return;

        openPhotoFunc({
            setPhoto: (v) => setProfile(v?.[0]),
            deleteButton: profile ? true : false
        })
        
    }

    return (
        <TouchableOpacity style={[styles.profileBox, style]} onPress={photoFunc}>
            <Image 
                source={profile?.uri || (profile ? consts.s3Url + profile : images.profile)} 
                style={[styles.profile, styleImage]} 
                transition={200}
            />
            <Image 
                source={images.profileCamera} 
                style={[styles.profileCamera, styleCamera]} 
            />
        </TouchableOpacity>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        
        profileBox: {
            width: 100,
            aspectRatio: 1/1,
            
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        },
        profile: {
            width: '100%',
            height: '100%',
            borderRadius: 16,
            
            borderWidth: 1,
            borderColor: colors.greyD,
            backgroundColor: colors.greyE,
            objectFit: 'cover'
        },
        profileCamera: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 43.75,
            aspectRatio: 1/1
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