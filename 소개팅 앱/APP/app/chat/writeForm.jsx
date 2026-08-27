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
        <View >
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
        title
    } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const progress = useSharedValue(3);
    const min = useSharedValue(minScore);
    const max = useSharedValue(maxScore);

    const iref = useRef(null);

    const [meter, setMeter] = useState(null);

    const [input, setInput] = useState("");
    const [comment, setComment] = useState("");

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
        if(!comment || inputReplace?.length < 1) {
            ToastMessage('내용을 입력 해 주세요.');
            return;
        }

        setLoad(true);

        let sender = {
            roomIdx: roomIdx*1,
            message: comment
        };
        let url = '';

        if(type == 1) {
            sender.type = type*1;
            url = '/v1/capsule/feedback';
        } else if(type == 2 || type == 3) {
            sender.status = Boolean(type == 2);
            url = '/v1/chat/selectFreeview';
        } else if(type == 4) {
            url = '/v1/chat/retryFreeview';
        }
            
        console.log('sender', sender, url);

        if(!url) return;

        const { data, error } = await API.post(url, sender);

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
 
    const acceptFunc = () => {

        // v1/chat/selectFreeview
    }

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
        <Layout header={header} input>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false}/> }

            <View style={{ flex: 1, padding: 20 }}>
                <TextArea 
                    autoFocus
                    iref={iref}
                    inputLabel={consts.chatWriteOptions?.find(x => x?.apiType === (type*1))?.label || ''}
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

               

            </View>

            <Button bottom type={'2'} onPress={submitFunc} disabled={disabled} load={load}>완료</Button>
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
        }
    })
  
    return { styles }
}
