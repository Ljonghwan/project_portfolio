import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    BackHandler
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeIn, FadeOut, SlideInUp, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { groupBy } from 'lodash';

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import TextList from '@/components/TextList';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

import Purchase from '@/components/Item/Purchase';

import Calendar from '@/components/Ui/Calendar';
import MonthPicker from '@/components/Ui/MonthPicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader, usePageContext } from '@/libs/store';
import { ToastMessage, useBackHandler } from '@/libs/utils';


const ratio = 1 / 1;

export default function Page({ }) {

    const { sdate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const CAMERA_HEIGHT = width * ratio;

    const { store } = useStore();
    const { openAlertFunc, closeAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { setContext } = usePageContext();

    const camera = useRef(null);
    const controllerRef = useRef(null);

    // 지원되는 사이즈 가져오기
    const [sizes, setSizes] = useState([]);
    const [active, setActive] = useState(true);
    const [facing, setFacing] = useState('back');
    const [zoom, setZoom] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            controllerRef.current = new AbortController();

            setContext(null);
            setActive(true);

            return () => {
                if (controllerRef?.current) controllerRef.current.abort();
                setActive(false);
                setLoad(false);
            }
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
                closeFunc();
                return true;
            });

            return () => {
                backHandler.remove();
            }
        }, [active, load])
    );

    const takePhoto = async () => {

        try {
            setLoad(true);

            const photo = await camera.current.takePictureAsync({ base64: true, skipProcessing: false });
            setActive(false);
            // openLoader();

            const image = {
                uri: photo.uri,
                type: SaveFormat.JPEG,
                width: photo.width,
                height: photo.height,
                ext: SaveFormat.JPEG,
                base: photo?.base64
            }
            
            const sender = {
                image: image
            }
            const { data, error } = await API.post('/v1/work01/ocr', sender, { signal: controllerRef.current.signal });

            // closeLoader();

            if (error) {
                if (!error?.message) return;
                console.log('error!!!!!!!!!!!!!!', error);

                ToastMessage(error?.message);
                setActive(true);
                setLoad(false);
                return;
            }

            closeAlertFunc();

            setContext({
                key: 'ocr',
                data: {
                    image: image,
                    ocrData: data,
                }
            });

            router.push(routes.매입등록);


        } catch (error) {
            console.log('error', error);
        }

    }

    const closeFunc = () => {
        if (active && !load) {
            router.back();
            return;
        }

        openAlertFunc({
            label: '매입 등록 취소',
            title: '거래명세표를 분석 중입니다.\n지금 화면을 나가면 작업이 취소됩니다.\n정말 나가시겠습니까?',
            onCencleText: '닫기',
            onPressText: '나가기',
            onCencle: () => { },
            onPress: async () => {
                router.back();
            }
        })
    }

    const header = {
        title: '매입 등록',
        left: {
            icon: 'back',
            onPress: closeFunc
        }
    };


    return (
        <>
            <Layout header={header} >

                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                {!active && load ? (
                    <Animated.View key={'loading'} entering={SlideInDown} exiting={FadeOut} style={styles.loading}>
                        <Image source={images.emoji_thanks} style={{ width: 240, aspectRatio: 1 / 1 }} />
                        <View>
                            <Text style={[styles.title, { marginBottom: 15 }]}>거래명세표를 분석하고 있어요!</Text>
                            <Text style={[styles.subTitle, { marginBottom: 15 }]}>{`지금 서비스를 나가면 분석이 중단돼요.\n조금만 기다려주세요!`}</Text>
                            <ActivityIndicator size={'small'} color={colors.black} />
                        </View>
                        
                    </Animated.View>
                ) : (
                    <Animated.View key={'camera'} entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
                         <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                paddingTop: 10,
                                paddingBottom: insets?.bottom + 100,
                                paddingHorizontal: 30,
                                gap: 23
                            }}
                        >
                            <Text style={{ ...rootStyle.font(20, colors.black, fonts.semiBold), lineHeight: 30 }}>{`거래명세표 전체가\n잘 보이도록 촬영해주세요`}</Text>
                            <View style={[styles.container, { opacity: initLoad ? 0 : 1 }]}>
                                <CameraView
                                    active={active}
                                    style={styles.camera}
                                    zoom={zoom}
                                    ref={camera}
                                    facing={facing}
                                    pictureSize={'1920x1080'}
                                    onCameraReady={() => {
                                        setTimeout(() => {
                                            setInitLoad(false);
                                        }, 500)
                                    }}
                                />
                            </View>

                            <View>
                                <TextList style={styles.msg}>어두운 배경 위에서 촬영하세요.</TextList>
                                <TextList style={styles.msg}>빛이 반사되지 않도록 주의하세요.</TextList>
                            </View>

                        </ScrollView>

                        <Button bottom style={{ position: 'absolute', bottom: 0 }} load={load} onPress={takePhoto} >촬영</Button>
                    </Animated.View>
                )}

               

            </Layout>
        </>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    const styles = StyleSheet.create({
        container: {
            borderWidth: 3,
            borderRadius: 20,
            borderColor: '#0861E3',
            overflow: 'hidden',
            backgroundColor: colors.placeholder,
            maxWidth: 500,
            alignSelf: 'center'
        },
        camera: {
            width: '100%',
            aspectRatio: ratio,
        },
        msg: {
            fontSize: 16,
            color: colors.text757575,
            fontFamily: fonts.medium,
            lineHeight: 24
        },
        loading: {
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
            flex: 1,
            backgroundColor: colors.white,
            zIndex: 1000,
            paddingTop: 45,
            gap: 35
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.black,
            letterSpacing: -0.28,
            textAlign: 'center',
        },
        subTitle: {
            fontSize: 16,
            color: colors.text2B2B2B,
            lineHeight: 24,
            letterSpacing: -0.4,
            textAlign: 'center',
        },

    })

    return { styles }
}
