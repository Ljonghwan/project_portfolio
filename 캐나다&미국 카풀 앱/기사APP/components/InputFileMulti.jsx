import React, {useRef, useState} from 'react';

import {
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    View,
    Platform
} from 'react-native';

import { Image } from 'expo-image';
import { launchImageLibrary } from 'react-native-image-picker';

import Text from '@/components/Text';

import { usePhotoPopup } from '@/libs/store';

import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import lang from '@/libs/lang';

import { ToastMessage, imageViewer } from '@/libs/utils';

export default function Component({ style, styleImage, styleCamera, photo=[], setPhoto, max=3 }) {

    const { styles } = useStyle();

    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const photoFunc = () => {
        
        if(photo?.length >= max) {
            ToastMessage(lang({ id: 'max_images_limit' })?.replace("{number}", max), { type: 'error'});
            return;
        }
        openPhotoFunc({
            setPhoto: (v) => setPhoto([...photo, ...v]),
            selectionLimit: max - photo?.length
        })
        
    }
    return (
        <View style={[styles.profileBox, style]} >
            {photo?.map((x, i) => {
                return (
                    <TouchableOpacity key={i} style={styles.label} onPress={() => imageViewer({ index: i, list: photo?.map(xx => xx?.uri || consts.s3Url + xx ) })}>
                        <Image 
                            source={x?.uri || consts.s3Url + x} 
                            style={styles.labelImage} 
                        />
                        <TouchableOpacity style={styles.profileCamera} onPress={() => setPhoto(photo?.filter((xx, ii) => ii !== i))}>
                            <Image 
                                source={images.photoDelete} 
                                style={[styles.profileCameraImage, styleCamera]} 
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )
            })}
            <TouchableOpacity style={styles.label} onPress={photoFunc}>
                <Image 
                    source={images.fileUpload} 
                    style={rootStyle.default} 
                />
            </TouchableOpacity>
            
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        
        profileBox: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'flex-start',
            position: 'relative',
            gap: 11.34
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
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '22%',
            aspectRatio: 1/1,
            borderRadius: 12,
            overflow: 'hidden',

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
        labelImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        }
    })
  
    return { styles }
}