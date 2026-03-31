import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Dimensions,
    useWindowDimensions,
    Modal,
    View,
    Image as RNImage,
    Pressable
} from 'react-native';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Loading from '@/components/Loading';

import CameraOverlayCircle from '@/components/CameraOverlayCircle';
import CameraOverlaySquare from '@/components/CameraOverlaySquare';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';
import fonts from '@/libs/fonts';

import { ToastMessage } from '@/libs/utils';
import lang from '@/libs/lang';

// const SCREEN_HEIGHT = Dimensions.get('screen').height;
// const SCREEN_WIDTH = Dimensions.get('screen').width;

const ratio = 4 / 3;

export default function Component({
    open = false,
    close=()=>{},
    onSubmit=()=>{},
    mode = "circle",
}) {

    const [ permission, requestPermission ] = useCameraPermissions();
    const { width: CAMERA_WIDTH } = useSafeAreaFrame();

    const CAMERA_HEIGHT = CAMERA_WIDTH * ratio;

    const BOX_RATIO = mode === 'circle' ? 1 : 0.63;
    const BOX_WIDTH = Math.min(CAMERA_WIDTH, 350);
    const BOX_HEIGHT = BOX_WIDTH * BOX_RATIO;

    const insets = useSafeAreaInsets();

    const { styles } = useStyle();

    const camera = useRef(null);

    const [ facing, setFacing ] = useState(mode === 'circle' ? 'front' : 'back');
    const [ zoom, setZoom ] = useState(0);
    const [ load, setLoad ] = useState(true);

    const [offset, setOffset] = useState({});

    const [test, setTest] = useState(null);
    const [test2, setTest2] = useState(null);
    const [testView, setTestView] = useState(false);
    
    const cameraToggle = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }
    const handleClose = () => {
        close();
        setZoom(0);
        setLoad(true);
    }

    const takePhoto = async () => {

        try {
            const photo = await camera.current.takePictureAsync();
            const uri = `${photo.uri}`;

            const imageWidth = photo.width;
            const imageHeight = photo.height;

            // === 비율 계산 ===
            const leftRatio = offset.x / CAMERA_WIDTH;
            const topRatio = offset.y / CAMERA_HEIGHT;
            const sizeRatioX = BOX_WIDTH / CAMERA_WIDTH; // width 기준으로만 계산
            const sizeRatioY = BOX_HEIGHT / CAMERA_HEIGHT;

            // === 이미지 기준 crop 좌표 계산 ===
            const cropLeft = imageWidth * leftRatio;
            const cropTop = imageHeight * topRatio;
            const cropSizeWidth = imageWidth * sizeRatioX;
            const cropSizeHeight = imageHeight * sizeRatioY;

            const image = ImageManipulator.manipulate(uri);

            image.crop({
                originX: cropLeft,
                originY: cropTop,
                width: cropSizeWidth,
                height: cropSizeHeight,
            })
            const imageCrop = await image.renderAsync();
            const result = await imageCrop.saveAsync({ base64: true })
          
            onSubmit({
                uri: result.uri, 
                type: SaveFormat.JPEG, 
                width: result.width, 
                height: result.height, 
                ext: SaveFormat.JPEG,
                base: `data:${SaveFormat.JPEG};base64,` + result.base64
            })
            handleClose();

        } catch (error) {
            handleClose();
            ToastMessage(lang({ id: 'photo_fail' }), {type: 'error'})
        }

    }

    const onLayout = (event) => {
        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                console.log({ x, y });
                setOffset({ x: x, y: y });
            },
        );
    }
  

    // if (!permission || !permission?.granted) return <></>;

    return (
            <Modal
                visible={open}
                animationType={'slide'}
                onRequestClose={handleClose}
                onShow={() => {
                    setLoad(false);
                    setZoom(mode === 'circle' ? 0 : 0.15);
                }}
                transparent
                statusBarTranslucent
                navigationBarTranslucent
            >
                <View style={styles.root}>
                    <CameraView
                        active={open}
                        style={styles.camera}
                        zoom={zoom} 
                        ref={camera}
                        facing={facing}
                        autofocus={'off'}
                        mirror={true}
                    >
                        { load && <Loading style={{ backgroundColor: colors.dark }}/> } 
                    </CameraView>
                    
                    {mode === 'circle' ? (
                        <CameraOverlayCircle onLayout={onLayout} size={BOX_WIDTH} boxRatio={1}/>
                    ) : (
                        <CameraOverlaySquare onLayout={onLayout} size={BOX_WIDTH} boxRatio={BOX_RATIO} />
                    )}
                    
                    <View style={styles.maskContainer}>

                        <View style={styles.top}>
                            <Icon img={images.back_white} imgStyle={rootStyle.default} hitSlop={10} onPress={handleClose}/>
                            {/* <Text style={styles.topText}>Scan License</Text> */}
                            <Icon img={images.exit_white} imgStyle={rootStyle.default} hitSlop={10} onPress={handleClose}/>
                        </View>

                        <View style={styles.bottom}>
                            <Pressable onPress={takePhoto}>
                                <Image source={images.shutter} style={rootStyle.shutter}/>
                            </Pressable>
                        </View>





                        {/* {testView && (
                            <>
                                <View style={[styles.overlayWrapper, { alignItems: 'flex-end', justifyContent: 'flex-end' }]}>
                                    <Image source={test} style={[styles.overlayBox, { borderRadius: 0, width: BOX_WIDTH, height: BOX_HEIGHT }]} contentFit={'contain'} />
                                </View>
                                <View style={[styles.overlayWrapper, { alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                                    <Image source={test2} style={[styles.overlayBox, { width: BOX_WIDTH, height: BOX_HEIGHT }]} contentFit={'contain'} />
                                </View>
                            </>
                        )}

                        <View >
                            
                            <Text style={styles.button} onPress={handleClose}>닫기{BOX_RATIO}</Text>
                            <Text style={styles.button} onPress={cameraToggle}>카메라변경</Text>
                            <Text style={styles.button} onPress={takePhoto}>촬영</Text>
                            <Text style={styles.button} onPress={() => setTestView(!testView)}>이미지보기</Text>
                            <Text style={styles.button} onPress={() => {
                                setFocusing(true);
                                setTimeout(() => {
                                    setFocusing(false);
                                }, 500)
                            }}>포커스</Text>
                            
                            <Text>{CAMERA_WIDTH} / {CAMERA_HEIGHT}</Text>
                        </View> */}
                    </View>
                </View>
            </Modal>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            position: 'absolute',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            margin: 0,
            flex: 1,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
        },
        maskContainer: {
            ...StyleSheet.absoluteFillObject,
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 20
        },
        top: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: 60,
            paddingHorizontal: 20,
        },
        topText: {
            color: colors.white,
            fontSize: 20,
            fontFamily: fonts.extraBold
        },
        camera: {
            width: width,
            height: width * ratio
        },
    })

    return { styles }
}
