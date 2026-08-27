import React, {useRef, useState, useEffect, useCallback, useFocusEffect} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Shadow } from 'react-native-shadow-2';
import dayjs from 'dayjs';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';

import DatePicker from '@/components/popups/DatePicker';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import Voice from '@/store-component/Voice';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { regPhone, useBottomSheetModalBackHandler, checkMic } from '@/libs/utils';
import { useUser, useLoader, useAlert, usePhotoPopup, useEtc } from '@/libs/store';

// component

export default function Photo() {

	const insets = useSafeAreaInsets();
    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const bottomSheetModalRef = useRef(null);
    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose() );
    
    const { openLoader, closeLoader } = useLoader();
    const { transparencyEnabled } = useEtc();
    const { openAlertFunc } = useAlert();
    
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
        photoMode,
        video,
        onPressTicket,
        onPressVoicetalk,
        onPressCallReserve,
        onPressVoiceMessage,
        chatTheme,
        room
    } = usePhotoPopup();

    const [ load, setLoad ] = useState(false);
    const [ mode, setMode ] = useState(null);

    useEffect(() => {
        console.log('photoMode', openPhoto, photoMode);
        if(openPhoto) {
            if(photoMode === 'library') {
                libraryFunc();
                closePhotoFunc();
                setMode(null);
                return;
            } else if(photoMode === 'camera') {
                photoFunc();
                closePhotoFunc();
                setMode(null);
                return;
            }

            bottomSheetModalRef.current?.present()
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [openPhoto, photoMode, bottomSheetModalRef])


    const photoFunc = async () => {
        
        handleClose();

        const result = await launchCamera({
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            quality: quality,
            mediaType: mediaType,
            includeBase64: true,
            selectionLimit: selectionLimit,
            presentationStyle: 'fullScreen'
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
            const result = await ImagePicker.requestCameraPermissionsAsync();

            if (result?.granted) {
                await photoFunc();
            } else {
                Alert.alert(
                    '카메라 권한 요청에 실패하였습니다.',
                    '카메라를 사용하시려면 카메라 권한을 설정해주세요.',
                    [
                        {text: '설정', onPress: () => Linking.openSettings()},
                        {text: '취소', onPress: () => {}},
                    ],
                );
            }
            
        } catch (e) {
        }
    }

    const handleClose = () => {
        bottomSheetModalRef.current?.dismiss();
    };

    const handleDelete = () => {
        setPhoto("");
        // closePhotoFunc();
        handleClose();
    }

    const handleAudio = async (callBack) => {

        const result = await checkMic();

        if(result) {
            callBack();
        };
    }

    const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
                opacity={0.1}

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
                setMode(null);
            }}
        >
            <BottomSheetView style={styles.main}>
                
                <View 
                    style={styles.top}
                >
                    {!mode ? (
                        <BlurView 
                            style={styles.buttonBox}
                            intensity={Platform.OS === 'ios' && transparencyEnabled ? 90 : 50} 
                            tint='extraLight' 
                            experimentalBlurMethod={'dimezisBlurView'}
                            blurReductionFactor={2}
                        >
                            <TouchableOpacity style={styles.button} onPress={libraryFunc}>
                                <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                    <Image source={images.album} style={rootStyle.default} tintColor={chatTheme?.primary} transition={200} />
                                </AnimatedBackground>
                                <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>앨범</AnimatedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={requestPermission}>
                                <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                    <Image source={images.camera} style={{ width: 29.5, height: 24 }} tintColor={chatTheme?.primary} transition={200} />
                                </AnimatedBackground>
                                <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>카메라</AnimatedText>
                            </TouchableOpacity>
    
                            {onPressTicket && (
                                <TouchableOpacity style={styles.button} onPress={() => { handleClose(); onPressTicket()}}>
                                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                        {room?.flirtingCount >= room?.limitFlirtingCount ? (
                                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                <Image source={chatImages.chat_ticket} style={rootStyle.default28} tintColor={chatTheme?.primary} transition={200}/>
                                                <Image source={chatImages.chat_ticket_star} style={[{ width: 10, height: 10, position: 'absolute' }]}/>
                                            </View>
                                        ) : (
                                            <Image source={images.picket} style={[rootStyle.picket, { width: 25.5 }]} tintColor={chatTheme?.primary} transition={200} />
                                        )}
                                    </AnimatedBackground>
                                    
                                    <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>{room?.flirtingCount >= room?.limitFlirtingCount ? '슈퍼 픽켓' : '픽켓'}</AnimatedText>
                                </TouchableOpacity>
                            )}
                            {onPressVoicetalk && (
                                <TouchableOpacity 
                                    style={styles.button} 
                                    onPress={() => { 
                                        handleAudio(() => { 
                                            handleClose(); 
                                            onPressVoicetalk() 
                                        }) 
                                    }}
                                >
                                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                        <Image source={images.voicetalk} style={rootStyle.default} tintColor={chatTheme?.primary} transition={200} />
                                    </AnimatedBackground>
                                    <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>통화</AnimatedText>
                                </TouchableOpacity>
                            )}

                            {onPressCallReserve && (
                                <TouchableOpacity 
                                    style={styles.button} 
                                    onPress={() => { 
                                        // setMode('reserve');
                                        // return;

                                        handleClose();
                                        openAlertFunc({
                                            alertType: 'Sheet',
                                            detached: true,
                                            component: 
                                                <DatePicker 
                                                    title="통화 예약" 
                                                    icon={"voicetalk_reserve2"} 
                                                    minuteInterval={1} 
                                                    minimumDate={new Date(dayjs().add(30, 'minutes').toISOString())}
                                                    defaultDate={new Date(dayjs().add(60, 'minutes').toISOString())}
                                                    onSubmit={onPressCallReserve}
                                                />,
                                        })
                                    }}
                                >
                                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                        <Image source={images.voicetalk_reserve} style={rootStyle.default} tintColor={chatTheme?.primary} transition={200} />
                                    </AnimatedBackground>
                                    <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>통화예약</AnimatedText>
                                </TouchableOpacity>
                            )}

                            {onPressVoiceMessage && (
                                <TouchableOpacity 
                                    style={styles.button} 
                                    onPress={() => { 
                                        handleAudio(() => { 

                                            handleClose();
                                            openAlertFunc({
                                                alertType: 'Sheet',
                                                detached: true,
                                                component: 
                                                    <Voice 
                                                        onSend={(v) => {
                                                            onPressVoiceMessage(v)
                                                        }}
                                                        chatTheme={chatTheme}
                                                    />,
                                            })
                                            return;

                                            
                                            setMode('voice');
                                        }) 
                                    }}
                                >
                                    <AnimatedBackground bg={chatTheme?.iconBackgroundColor} style={styles.buttonIcon}>
                                        <Image source={images.voicemessage} style={{ width: 23.5, height: 24 }} tintColor={chatTheme?.primary} transition={200} />
                                    </AnimatedBackground>
                                    <AnimatedText color={chatTheme?.primary} style={styles.buttonText}>음성메시지</AnimatedText>
                                </TouchableOpacity>
                            )}

                        </BlurView>
                    ) : (
                        <></>
                    )}
                </View>

                <View style={styles.bottom}>
                    {deleteButton ? (
                        <Button type={'7'} containerStyle={{ height: 64 }} textStyle={{ fontSize: 16 }} onPress={handleDelete}>삭제</Button>
                    ) : (
                        <Button type={'7'} containerStyle={{ height: 64 }} textStyle={{ fontSize: 16 }} onPress={handleClose}>취소</Button>
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
            // backgroundColor: colors.white,
            borderRadius: 24,
            gap: 20,
            overflow: 'hidden',
        },
        bottom: {
            borderRadius: 12,
            overflow: 'hidden',
        },
        buttonBox: {
            paddingVertical: 28,
            paddingHorizontal: rootStyle.side,
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            rowGap: 30,
        },
        button: {
            gap: 10,
            alignItems: 'center',
            width: '33.33%',
        },
        buttonIcon: {
            width: 48,
            height: 48,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonText: {
            textAlign: 'center'
        },

        voiceBox: {
            paddingVertical: 20,
            paddingHorizontal: 12,
            paddingBottom: 36,
            gap: 30,
            alignItems: 'center',
            backgroundColor: colors.white,
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
