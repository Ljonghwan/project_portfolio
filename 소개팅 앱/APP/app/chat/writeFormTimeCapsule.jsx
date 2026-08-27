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
import { Slider } from 'react-native-awesome-slider';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// component
import Loading from '@/components/Loading';
import Input from '@/components/Input';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Help from '@/components/Help';
import ListText from '@/components/ListText';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';

function Item({ active, title }) {

    const { styles } = useStyle();
    const textColor = useSharedValue(false);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value ? colors.dark : colors.grey9, { duration: 150 }),
            fontSize: withTiming(textColor.value ? 14 : 12, { duration: 150 }),
        };
    });

    useEffect(() => {
        textColor.value = active; 
    }, [active])

    return (
        <View style={{ flex: 1 }}>
            <Animated.Text style={[styles.listText, animatedTextStyle, { fontSize: 12 }]} numberOfLines={1}>{title}</Animated.Text>
        </View>
    );
}

const minScore = consts.minMeter;
const maxScore = consts.maxMeter;

export default function Page({  }) {

    const { 
        roomIdx,
        type,
        title,
        day
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const progress = useSharedValue(5);
    const min = useSharedValue(minScore);
    const max = useSharedValue(maxScore);

    const iref = useRef(null);
    const iref2 = useRef(null);

    const [meter, setMeter] = useState(5);

    const [input, setInput] = useState("");
    const [comment, setComment] = useState("");

    const [view, setView] = useState(false);
    const [viewPosition, setViewPosition] = useState({});

    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {

        if(type == 2) {
            setDisabled(!(comment && input));
        } else {
            setDisabled(!(input));
        }
        

    }, [type, comment, input])
   

    const submitFunc = async () => {
        
        if(load) return;

        Keyboard.dismiss();

        const inputReplace = comment?.replace(/\s+/g, '');
        const input2Replace = input?.replace(/\s+/g, '');

        if(type == 2 && (!comment || inputReplace?.length < 1)) {
            ToastMessage('첫인상을 입력 해 주세요.');
            return;
        }
        if(!input2Replace || input2Replace?.length < 1) {
            ToastMessage('한마디를 입력 해 주세요.');
            return;
        }

        setLoad(true);

        // 첫인상 문구
        // OOO님이 보내신 첫인상 내용이 타임캡슐에 담겼습니다.
        // 첫인상 내용은 3일차에 개봉됩니다.

        // 러브미터 문구
        // OOO님이 보내신 O일차 러브미터가 타임캡슐에 담겼습니다.

        let sender = {
            roomIdx: roomIdx*1,
            type: type*1,
            firstMessage: comment,
            message: input,
            loveDay: day*1,
            loveValue: meter
        };
            
        console.log('sender', sender);

        const { data, error } = await API.post('/v1/capsule/feedback', sender);

        setTimeout(() => {

            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }
        
            router.back();
        }, consts.apiDelay);

    }
        

    const onLayout = useCallback((event) => {

        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                console.log('x, y, width, height, pageX, pageY', { x, y, width, height, pageX, pageY });
                // setPosition({ x: scrennWidth - pageX - width, y: pageY });
                setViewPosition({ y: pageY + height + 5})
            },
        );

    }, []);

    const header = {
        title: title,
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            {/* <Text>{meter}</Text> */}
            <KeyboardAwareScrollView
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
            >
                <View style={{ flex: 1, padding: 20, gap: 20 }}>

                    {type == 2 && (
                        <TextArea 
                            autoFocus
                            iref={iref}
                            inputLabel={consts.chatWriteTimeCapsuleOptions?.find(x => x?.apiType === (type*1))?.label || ''}
                            name={'comment'}
                            state={comment} 
                            setState={setComment} 
                            placeholder={`내용을 입력해 주세요.`} 
                            blurOnSubmit={false}
                            maxLength={255}
                            multiline
                            error={error}
                            setError={setError}
                        />
                    )}
                    
                    <View style={{ gap: 40 }}>

                        <View style={{ gap: 4 }}>
                            <View style={[ rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]} collapsable={false} onLayout={onLayout}>
                                <Text style={styles.label}>러브미터</Text>
                                <Icon img={images.question} imgStyle={rootStyle.default} onPress={() => {
                                    Keyboard.dismiss();
                                    setView(true);
                                } }/>
                            </View>
                            <Text style={styles.subTitle}>오늘 나는 상대방에게 얼마나 가까워졌나요?</Text>
                        </View>
                        
                        <View style={{ gap: 20 }}>
                            <View style={styles.sliderBox}>
                                <Slider
                                    hapticMode={'step'}
                                    style={styles.slider}
                                    containerStyle={{ borderRadius: 100 }}
                                    progress={progress}
                                    minimumValue={min}
                                    maximumValue={max}
                                    steps={maxScore}
                                    forceSnapToStep={true}
                                    onValueChange={v => {
                                        setMeter(maxScore - v);
                                    }}
                                    onHapticFeedback={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);	
                                    }}
                                    sliderHeight={8}
                                    thumbWidth={24}
                                    panHitSlop={30}
                                    theme={{
                                        maximumTrackTintColor: colors.greyE,
                                        minimumTrackTintColor: colors.main,
                                    }}
                                    renderThumb={() => (
                                        <View style={styles.thumb} >
                                            <Image source={images.meter} style={rootStyle.default} />
                                        </View>
                                    )}
                                    renderBubble={() => (null)}
                                    renderMark={({ index }) => {
                                        if(index < maxScore) return null;
                                        return (
                                            <View style={[styles.thumb, { right: 10 }]} >
                                                <Image source={images.meter_max} style={rootStyle.default} />
                                            </View>
                                        )
                                    }}
                                />

                            </View>

                            <View style={{  flexDirection: 'row', justifyContent: 'space-between' }}>
                                {[...Array(maxScore + 1 )]?.map((x, i) => {
                                    const v = maxScore - i;
                                    return (
                                        <Item key={i} title={`${v}M`} active={v === meter}/>
                                    )
                                })}
                            </View>

                            <Input 
                                iref={iref2}
                                name={'input'}
                                state={input} 
                                setState={setInput} 
                                placeholder={`선택한 러브미터에 대한 이유를 알려주세요!`} 
                                returnKeyType={"done"}
                                onSubmitEditing={submitFunc}
                                blurOnSubmit={false}
                                maxLength={100}
                            />
                            
                        </View>
                    </View>

                </View>
            </KeyboardAwareScrollView>

            <Button bottom type={'2'} onPress={submitFunc} disabled={disabled} load={load}>완료</Button>

            <Help 
                view={view} 
                setView={setView} 
                position={viewPosition}
                component={
                    <View style={styles.infoBox}>
                        {/* <ListText style={styles.helpText}>{`러브미터란?`}</ListText> */}
                        <ListText style={styles.infoBoxText}>{`오늘 하루 상대방과 대화하며 가까워진 내적 거리를 체크해 주세요!`}</ListText>
                        <ListText style={styles.infoBoxText}>{`결정의날 선택 후 공개됩니다.`}</ListText>
                    </View>
                } 
            />
            
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
        label: {
            color: colors.dark,
            fontSize: 16,
            fontFamily: fonts.medium
        },
        subTitle: {
            color: colors.grey9,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
        },

        infoBox: {
            padding: 12,
            borderWidth: 1,
            borderColor: colors.greyD,
            borderRadius: 8,
            gap: 8
        },
        infoBoxText: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
        
    })
  
    return { styles }
}
