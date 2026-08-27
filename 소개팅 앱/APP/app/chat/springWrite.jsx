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
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// component
import Loading from '@/components/Loading';
import InputFlirting from '@/components/InputFlirting';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import chatStyle from '@/libs/chatStyle';
import chatImages from '@/libs/chatImages';


import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useConfig, usePhotoPopup } from '@/libs/store';

import API from '@/libs/api';

const minScore = consts.minMeter;
const maxScore = consts.maxMeter;

export default function Page({  }) {

    const { 
        roomIdx,
        type,
        title
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const progress = useSharedValue(3);
    const min = useSharedValue(minScore);
    const max = useSharedValue(maxScore);

    const iref = useRef(null);

    const [meter, setMeter] = useState(null);

    const [input, setInput] = useState("");
    const [comment, setComment] = useState("");
    const [photo, setPhoto] = useState(null);

    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {

        setDisabled(!(comment));

    }, [comment])
   

    const submitFunc = async () => {
        
        if(load) return;

        Keyboard.dismiss();

        const inputReplace = comment?.replace(/\s+/g, '');
        if(!photo) {
            ToastMessage('이미지를 업로드해주세요.');
            return;
        }
        if(!comment || inputReplace?.length < 1) {
            ToastMessage('이유를 작성해주세요.');
            return;
        }

        setLoad(true);

        let sender = {
            roomIdx: roomIdx*1,
            type: 1,
            image: photo,
            message: comment
        };

        const { data, error } = await API.post('/v1/capsule/contents', sender);

        setTimeout(() => {

            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }
        
            ToastMessage('작성이 완료되었습니다.');
            router.back();
        }, consts.apiDelay);

    }

    const photoFunc = () => {

        openPhotoFunc({
            setPhoto: (v) => setPhoto(v?.[0]),
            chatTheme: chatStyle?.chat_season_1,
            deleteButton: Boolean(photo)
        })
        
    }


    const header = {
        title: '블라썸 작성하기',
        titleStyle: {
            fontSize: 18,
            color: chatStyle.chat_season_1.spring1,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'chat_spring_action',
            style: {
                width: 20.177,
                height: 20,
            },
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} input>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"never"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: rootStyle.side, paddingBottom: insets?.bottom + 100 }}
            >
                <View style={[rootStyle.flex, { gap: 12, justifyContent: 'flex-start', paddingVertical: 16 }]}>
                    <Image source={chatImages.chat_season_1} style={rootStyle.default48} />
                    <View style={[{ flex: 1, gap: 4 }]}>
                        <Text style={{...rootStyle.font(18, chatStyle?.chat_season_1?.spring1, fonts.bold, )}}>블라썸</Text>
                        <Text style={{...rootStyle.font(14, chatStyle?.chat_season_1?.spring1, fonts.medium, )}}>{`상대방에게 꼭 보여주고 싶은 사진과,\n그 이유를 작성해주세요!`}</Text>
                    </View>
                </View>
                
                <View style={{ padding: 10 }}>
                    <TouchableOpacity style={styles.uploadButton} activeOpacity={0.5} onPress={photoFunc}>
                        {photo ? (
                            <Image source={photo} style={{ width: '100%', aspectRatio: 1 }} transition={200}/>
                        ) : (
                            <>
                                <Image source={images.upload} style={{ width: 80, aspectRatio: 1 }} tintColor={chatStyle?.chat_season_1?.primary} transition={200}/>
                                <Text style={{...rootStyle.font(20, chatStyle?.chat_season_1?.primary, fonts.medium), textAlign: 'center', letterSpacing: -0.63 }}>터치하여 이미지를 업로드</Text>
                            </>
                        )}
                        
                    </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: 10 }}>
                    <TextArea 
                        iref={iref}
                        name={'comment'}
                        state={comment} 
                        setState={setComment} 
                        placeholder={`이유를 작성해주세요. (최대 100자 내)`} 
                        maxLength={100}
                        multiline

                        inputWrapStyle={{ height: 100, borderColor: chatStyle?.chat_season_1?.spring2 }}
                        inputWrapFocusStyle={{ borderColor: chatStyle?.chat_season_1?.spring2 }}
                        placeholderTextColor={chatStyle?.chat_season_1?.spring3}
                        inputStyle={{ color: chatStyle?.chat_season_1?.spring2 }}
                    />
                </View>
                <ListText style={{...rootStyle.font(12, colors.grey6, fonts.medium ), lineHeight: 17 }}>{`사유를 조금만 더 자세히 적어주시면,\n소개팅이 훨씬 즐겁고 매끄럽게 진행될 거예요.😊`}</ListText>
            </KeyboardAwareScrollView>

            <Button 
                bottom
                type={16}
                containerStyle={[rootStyle.flex, { gap: 4 }]}
                onPress={submitFunc}
                frontIcon={'chat_write'}
                frontIconStyle={[rootStyle.default]}
                frontIconTintColor={colors.white}
                load={load}
            >
                블라썸 작성 완료
            </Button>
            
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        thumb: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        sliderBox: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        slider: {
            width: width - 50
        },
        listText: {
            color: colors.grey9,
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: -0.3,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        uploadButton: {
            aspectRatio: 1, 
            gap: 20,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: chatStyle?.chat_season_1?.iconBackgroundColor,
            width: '100%',
            overflow: 'hidden',
        },
    })
  
    return { styles }
}
