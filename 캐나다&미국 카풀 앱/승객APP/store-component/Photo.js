import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

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
import { useBottomSheetModalBackHandler } from '@/libs/utils';

// component

export default function Photo() {

	const insets = useSafeAreaInsets();
    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const bottomSheetModalRef = useRef(null);
    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose() );
    
    const { openLoader, closeLoader } = useLoader();
    const { 
        openPhoto, 
        title, 
        setPhoto, 
        maxWidth, 
        maxHeight, 
        quality, 
        selectionLimit, 
        mediaType,
        deleteButton,
        closePhotoFunc,
    } = usePhotoPopup();

    const [ load, setLoad ] = useState(false);
    const [ mode, setMode ] = useState(null);

    useEffect(() => {

        if(openPhoto) {
            bottomSheetModalRef.current?.present()
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [openPhoto, bottomSheetModalRef])


    const photoFunc = async () => {
        
        handleClose();

        const result = await launchCamera({
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            quality: quality,
            mediaType: mediaType,
            includeBase64: true,
            selectionLimit: selectionLimit
        });


        if(!result?.assets) return;

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
            selectionLimit: selectionLimit
        })

        
        if(!result?.assets) return;

        sendFunc(result?.assets);
    }

    const sendFunc = (assets) => {
        
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
                await photoFunc();
            } else {
                Alert.alert(
                    lang({ id: 'failed_to_request_camera_permission' }),
                    lang({ id: 'please_set_camera_permissions_to_use_the_camera' }),
                    [
                        {text: lang({ id: 'setting' }), onPress: () => openSettings()},
                        {text: lang({ id: 'cancel' }), onPress: () => {}},
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
            bottomInset={insets?.bottom + 12}
            detached={true}
            backgroundStyle={{ backgroundColor: 'transparent' }}
            style={{ marginHorizontal: 12 }}
            onDismiss={() => {
                closePhotoFunc();
            }}
        >
            <BottomSheetView style={styles.main}>
                <View style={styles.top}>
                    <View style={styles.buttonBox}>
                        <TouchableOpacity style={styles.button} onPress={libraryFunc}>
                            <Text style={styles.buttonText}>{lang({ id: 'select_from_album' })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={requestPermission}>
                            <Text style={styles.buttonText}>{lang({ id: 'take_photo' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottom}>
                    {deleteButton ? (
                        <Button type={2} onPress={handleDelete}>{lang({ id: 'delete' })}</Button>
                    ) : (
                        <Button type={2} onPress={handleClose}>{lang({ id: 'cancel' })}</Button>
                    )}
                    
                    {/* <TouchableOpacity
                        style={[styles.button, styles.buttonDelete]}
                        onPress={handleDelete}
                    >
                        <Text style={[styles.textStyle, styles.textStyleDelete]}>삭제</Text>
                    </TouchableOpacity> */}
                </View>
                
            </BottomSheetView>
        </BottomSheetModal>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
       
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        main: {
            gap: 8,
        },
        top: {
            backgroundColor: colors.sub_3,
            borderRadius: 20,
            gap: 20
        },
        bottom: {
            borderRadius: 20,
            overflow: 'hidden',
        },
        buttonBox: {
            paddingVertical: 20,
            rowGap: 20,
        },
        button: {
            gap: 8,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonText: {
            textAlign: 'center',
            color: colors.main,
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
        },
        voiceBox: {
            paddingVertical: 20,
            paddingHorizontal: 12,
            paddingBottom: 36,
            gap: 30,
            alignItems: 'center'
        },
        title: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
            textAlign: 'center'
        },
        timerBox: {
            width: 160,
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.greyF1,
            borderRadius: 12
        },
        timerText: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            lineHeight: 24,
        }


    })
  
    return { styles }
}
