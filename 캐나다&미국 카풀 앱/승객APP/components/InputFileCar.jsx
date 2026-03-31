import React, {useRef, useState} from 'react';

import {
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    View,
    Platform
} from 'react-native';

import { Image } from 'expo-image';

import Text from '@/components/Text';

import { usePhotoPopup } from '@/libs/store';

import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';
import consts from '@/libs/consts';

export default function Component({ style, styleImage, styleCamera, photo, setPhoto, label, label2 }) {

    const { styles } = useStyle();

    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const photoFunc = () => {

        openPhotoFunc({
            setPhoto: (v) => setPhoto(v?.[0]),
            deleteButton: photo ? true : false
        })
        
    }

    return (
        <TouchableOpacity style={[styles.profileBox, style]} onPress={photoFunc}>
            {photo ? (
                <Image 
                    source={photo?.uri || (photo ? consts.s3Url + photo : images.photoUpload)} 
                    style={[styles.profile, styleImage]} 
                    transition={200}
                />
            ) : (
                <View style={styles.label}>
                    <Image 
                        source={images.photoUpload} 
                        style={rootStyle.default} 
                    />
                    <View>
                        <Text style={styles.labelText} numberOfLines={1}>{label}</Text>
                        {label2 && <Text style={styles.labelText2} numberOfLines={1}>{label2}</Text>}
                    </View>
                </View>
            )}
            
            
            {photo && (
                <TouchableOpacity style={styles.profileCamera} onPress={() => setPhoto(null)}>
                    <Image 
                        source={images.photoDelete} 
                        style={[styles.profileCameraImage, styleCamera]} 
                    />
                </TouchableOpacity>
            )}
           

        </TouchableOpacity>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        
        profileBox: {
            width: 104,
            aspectRatio: 1/1,
            
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        },
        profile: {
            width: '100%',
            height: '100%',
            borderRadius: 12,
            
            backgroundColor: colors.sub_3,
            objectFit: 'cover'
        },
        profileCamera: {
            position: 'absolute',
            top: 4,
            right: 4,
        },
        profileCameraImage: {
            width: 24,
            aspectRatio: 1/1
        },
        label: {
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            borderRadius: 12,

            backgroundColor: colors.sub_3,
            gap: 3
        },
        labelText: {
            textAlign: 'center',
            fontFamily: fonts.semiBold,
            fontSize: 14,
            color: colors.sub_1,
        },
        labelText2: {
            textAlign: 'center',
            fontFamily: fonts.semiBold,
            fontSize: 12,
            color: colors.sub_1,
        },
       
    })
  
    return { styles }
}