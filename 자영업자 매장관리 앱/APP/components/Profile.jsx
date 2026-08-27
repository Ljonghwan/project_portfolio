import React, { useEffect, useState, useRef } from 'react';

import { router } from "expo-router";
import { Image } from 'expo-image';
import {
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';

import { useUser, usePhotoPopup, useLoader } from '@/libs/store';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import images from '@/libs/images';
import routes from '@/libs/routes';
import lang from '@/libs/lang';

import { ToastMessage } from '@/libs/utils';

import API from '@/libs/api';

export default function Component({ style, styleImage }) {

    const { styles } = useStyle();

    const { mbData, reload } = useUser();
    const { openPhotoFunc } = usePhotoPopup();
    const { openLoader, closeLoader } = useLoader();

    const startFunc = () => {

        openPhotoFunc({
            setPhoto: (v) => setProfileFunc(v?.[0]),
            deleteButton: mbData?.profile ? true : false
        })
    }

    const setProfileFunc = async (v) => {
        openLoader();

        const sender = {
            type: 'profile',
            profile: v
        }
        const { data, error } = await API.post('/v1/my/updateInfo', sender);

        setTimeout(() => {
            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.');
            reload();

        }, consts.apiDelay)

    }

    return (
        <>
            <TouchableOpacity style={[styles.profileBox, style]} onPress={startFunc} activeOpacity={0.7}>
                <Image
                    source={(mbData?.profile ? consts.s3Url + mbData?.profile : images.profile)}
                    style={[styles.profile, styleImage]}
                    transition={200}
                />
                <Image
                    source={images.camera_white}
                    style={[styles.profileCamera]}
                />
            </TouchableOpacity>
        </>
    );
}


const useStyle = () => {

    const styles = StyleSheet.create({

        profileBox: {
            width: 80,
            height: 80,

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
            width: 27,
            height: 26
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