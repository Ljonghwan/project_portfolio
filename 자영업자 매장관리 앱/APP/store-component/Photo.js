import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { setStatusBarStyle, setStatusBarHidden } from 'expo-status-bar';

import { Image } from 'expo-image';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView
} from '@gorhom/bottom-sheet';

import Button from '@/components/Button';
import Text from '@/components/Text';


import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { useLoader, usePhotoPopup } from '@/libs/store';
import { useBottomSheetModalBackHandler, ToastMessage } from '@/libs/utils';

// component

export default function Photo() {

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const bottomSheetModalRef = useRef(null);
    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose());

    const { openLoader, closeLoader } = useLoader();
    const {
        openPhoto,
        title,
        setPhoto,
        maxWidth,
        maxHeight,
        quality,
        maxFileSize,
        selectionLimit,
        mediaType,
        deleteButton,
        deleteOnly,
        closePhotoFunc,
    } = usePhotoPopup();

    const [load, setLoad] = useState(false);
    const [mode, setMode] = useState(null);

    useEffect(() => {

        if (openPhoto) {
            bottomSheetModalRef.current?.present()
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [openPhoto, bottomSheetModalRef])


    const photoFunc = async () => {

        // presentationStyle?: 'currentContext' | 'fullScreen' | 'pageSheet' | 'formSheet' | 'popover' | 'overFullScreen' | 'overCurrentContext';

        const result = await launchCamera({
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            quality: quality,
            mediaType: mediaType,
            includeBase64: true,
            selectionLimit: selectionLimit,
            presentationStyle: 'fullScreen'
        });

        if (!result?.assets) return;

        sendFunc(result?.assets);
    }

    const libraryFunc = async () => {

        handleClose();

        // let result = await ImagePicker.launchImageLibraryAsync({
        //     orderedSelection: true,
        //     mediaTypes: mediaType,
        //     quality: quality,
        //     selectionLimit: selectionLimit,
        //     allowsMultipleSelection: (selectionLimit > 1)
        // });

        let result = await launchImageLibrary({
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            quality: quality,
            mediaType: mediaType,
            includeBase64: true,
            selectionLimit: selectionLimit,
            presentationStyle: 'fullScreen'
        })


        if (!result?.assets) return;

        sendFunc(result?.assets);
    }

    const sendFunc = (assets) => {

        if(maxFileSize) {
            console.log(maxFileSize, assets?.map(x => x?.fileSize));
            let over = assets?.find(x => x.fileSize > maxFileSize);
            if(over) {
                ToastMessage(`최대 ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB 까지 업로드 가능합니다.`);
                setPhoto([]);
                return;
            }
        }

        let assetsResult = assets.map((x, i) => {
            let ext = x?.uri?.split('.')?.at(-1);

            return {
                name: x.fileName,
                uri: x.uri,
                type: x.type,
                width: x.width,
                height: x.height,
                ext: ext,
                base: `data:${x.type};base64,` + x.base64
            };
        });

        setPhoto(assetsResult);

    }

    const requestPermission = async () => {

        try {
            const result = await request(Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA);

            if (result === RESULTS.GRANTED) {
                handleClose();
                setTimeout(async () => {
                    await photoFunc();
                }, 200)
            } else {
                Alert.alert(
                    '카메라 권한 요청에 실패하였습니다.',
                    '카메라를 사용하시려면 카메라 권한을 설정해주세요.',
                    [
                        { text: '설정', onPress: () => openSettings() },
                        { text: '취소', onPress: () => { } },
                    ],
                );
            }

        } catch (e) {
            console.log(e);
        }
    }

    const handleClose = () => {
        bottomSheetModalRef.current?.dismiss();
    }

    const handleDelete = () => {
        setPhoto("");
        handleClose();
    }

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetPositionChange}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            detached={true}
            backgroundStyle={{ backgroundColor: 'transparent' }}
            onDismiss={() => {
                closePhotoFunc();
            }}
        >
            <BottomSheetView style={styles.main}>

                <View style={styles.root}>
                    {!deleteOnly && (
                        <View style={styles.container}>
                            <Button type={6} onPress={libraryFunc}>앨범에서 선택</Button>
                            <View style={{ backgroundColor: colors.gray, height: 1 }} />
                            <Button type={6} onPress={requestPermission}>사진촬영</Button>
                        </View>
                    )}
                    

                    {deleteButton ? (
                        <Button type={7} onPress={handleDelete}>삭제</Button>
                    ) : (
                        <Button type={7} onPress={handleClose}>취소</Button>
                    )}
                    
                </View>

            </BottomSheetView>
        </BottomSheetModal>

    );
}

const useStyle = () => {

	const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        main: {
            gap: 8,
        },

        root: {
            paddingHorizontal: rootStyle.side,
            paddingTop: 32,
            paddingBottom: insets?.bottom + 20,
            gap: 8
        },
        container: {
            backgroundColor: colors.f1f1f0,
            borderRadius: 12,
            overflow: 'hidden'
        }



    })

    return { styles }
}
