import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeInRight, SlideInUp, SlideOutUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

// component
import Loading from '@/components/Loading';
import InputFlirting from '@/components/InputFlirting';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import ChatTopFlirtingCencle from '@/components/popups/ChatTopFlirtingCencle';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useAlert } from '@/libs/store';

import API from '@/libs/api';

export default function Page({ item }) {

    const { 
        roomIdx,
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { openAlertFunc } = useAlert();
    
    const iref = useRef(null);

    
    const [page, setPage] = useState(0);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    const [error, setError] = useState(null);


    useEffect(() => {
        roomInfo();
    }, [roomIdx])

    const roomInfo = async () => {

        
    }

    const nextFunc = async () => {
        setPage(1);
    }

    const closeAlert = () => {
        openAlertFunc({
            component: <ChatTopFlirtingCencle onPress={() => {
                router.replace({
                    pathname: routes.chatFinal,
                    params: {
                        roomIdx: roomIdx
                    }
                })
            }}/>
        })
    }
 
    const header = {
        title: '탑 플러팅 하기',
        titleStyle: {
            color: colors.white
        },
        left: {
            icon: 'back_white',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={colors.main} statusBar={'light'}>
            {!page ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.root}>
                        <View style={{ gap: 10 }}>
                            <Text style={styles.title}>{`TOP 플러팅,\n만남을 이끄는 마지막 한 수.`}</Text>
                            <Text style={styles.subTitle}>{`이번 소개팅이 정말 특별하여 상대방을\n만나보고 싶다면 TOP 플러팅을 사용하여\n나의 진중한 마음을 보여주는 건 어떨까요?`}</Text>
                        </View>
                        
                        <View style={[rootStyle.flex, { flex: 1 }]}>
                            <Image source={images.flirting_white} style={[rootStyle.flirting, { width: 118 }]}/>
                            <LottieView
                                source={images.lottie_top_flirting2}
                                autoPlay={true}
                                loop={true}
                                resizeMode={'contain'}
                                style={styles.lottie}
                            />
                        </View>
                    </View>
                    
                    <Button bottom type={'3'} onPress={nextFunc} >자세히 알아보기</Button>
                </View>
            ) : (
                <>
                    <ScrollView style={{ flex: 1 }}>
                        <Animated.View entering={FadeInRight} style={[styles.root, { gap: 40 }]}>
                            <View style={{ gap: 10 }}>
                                <Text style={styles.title}>{`TOP 플러팅은 무엇인가요?`}</Text>
                                <Text style={styles.subTitle}>{`탑 플러팅은 결정의 날에 사용할 수 있는\n최후의 한 수로, 플러팅을 최대 300개까지\n전달해 비주얼 회원님의 만남 의사 결정에 적극적으로 영향을 줄 수 있는 시스템입니다.`}</Text>
                            </View>

                            <View style={{ gap: 10 }}>
                                <Text style={[styles.title, { fontSize: 23 }]}>{`TOP 플러팅에 성공? 실패? 할 경우`}</Text>

                                <View style={{ gap: 20 }}>
                                    <Text style={styles.subTitle}>
                                        {`축하합니다!\n만남이 성공하면 20%의 수수료를 제외한\n80%의 플러팅이 비주얼 회원에게 전달됩니다.\n비주얼 회원은 만남을 위한 준비, 교통비 등에\n이 감사의 금액을 사용하게 됩니다.\n실제 만남이 이루어지지 않는다면\n90%의 플러팅을 다시 돌려받습니다.`}
                                    </Text>
                                    <Text style={styles.subTitle}>
                                        {`너무 걱정하지 마세요!\n만남 결정이 실패할 경우 사용했던\n플러팅의 90%를 다시 돌려받을 수 있어요.\n마지막으로 마음을 전달할 수 있는 기회인 만큼\nTOP 플러팅을 잘 활용하여\n상대방의 선택에 영향을 주세요!`}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>

                    <View style={rootStyle.flex}>
                        <Button style={{ flex: 1 }} bottom type={'4'} onPress={closeAlert} >플러팅 없이 진행</Button>
                        <Button style={{ flex: 1 }} bottom type={'3'} onPress={() => {
                            router.replace({
                                pathname: routes.chatTopFlirting,
                                params: {
                                    roomIdx: roomIdx,
                                }
                            })
                        }} >TOP 플러팅 하기</Button>
                    </View>
                </>
            )}
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        lottie: {
            position: 'absolute',
            bottom: 100,
            flex: 1,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            pointerEvents: 'none', // 터치 통과\
        },
        root: {
            padding: 20,
            flex: 1
        },
        title: {
            fontSize: 28,
            lineHeight: 36,
            letterSpacing: -0.7,
            color: colors.white,
            fontFamily: fonts.bold,
            textAlign: 'center'
        },
        subTitle: {
            fontSize: 18,
            lineHeight: 24,
            letterSpacing: -0.45,
            color: colors.white,
            fontFamily: fonts.medium,
            textAlign: 'center'
        }
    })
  
    return { styles }
}
