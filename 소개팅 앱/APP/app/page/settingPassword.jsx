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
  Keyboard
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import PasswordValid from '@/components/PasswordValid';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';

import { ToastMessage, patternPasswordFunc } from '@/libs/utils';

import { useUser } from '@/libs/store';

import API from '@/libs/api';
import consts from '@/libs/consts';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();

    const nowpwref = useRef(null);
    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ nowpw, setnowpw ] = useState("");
    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [disabled, setDisabled] = useState(false); 
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ pwValid, setPwValid ] = useState(false);

    const [ error, setError ] = useState({});
    
    useEffect(() => {
        setError({...error, repw: ''});
        setDisabled( !(nowpw?.length > 1 && pw?.length > 7 && repw?.length > 7 ) );
    }, [ nowpw, pw, repw ])

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        if(!patternPasswordFunc(pw)) {
            console.log('patternPasswordFunc(pw)', patternPasswordFunc(pw));
            setError({...error, repw: '영문, 숫자, 특수문자를 포함한 8~20자로 입력해 주세요.'})
            return;
        }

        if(pw !== repw) {
            setError({...error, repw: '비밀번호를 확인해 주세요.'})
            return;
        }

        setLoad(true);
        
        const sender = {
            type: 2,
            password: nowpw,
            pass1: pw,
            pass2: repw
        }

        const { data, error } = await API.post('/v1/user/udpateInfo', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('비밀번호가 변경되었습니다.');
            router.back();
        }, consts.apiDelay)
       
    }

    const header = {
        title: '비밀번호 변경',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting_pass',
            style: {
                width: 26,
                height: 26,
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
        <Layout header={header} backgroundColor={colors.white} input>

            <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: rootStyle.side + 10, gap: 12 }}>
                
                <Input 
                    iref={nowpwref}
                    required
                    autoFocus
                    name={'nowpw'}
                    state={nowpw} 
                    setState={setnowpw} 
                    placeholder={`기존 비밀번호 입력`} 
                    returnKeyType={"next"}
                    onSubmitEditing={() => pwref.current?.focus() }
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    password
                />
                
                <Input 
                    iref={pwref}
                    required
                    name={'pw'}
                    state={pw} 
                    setState={setpw} 
                    placeholder={`새 비밀번호 입력`} 
                    returnKeyType={"next"}
                    onSubmitEditing={() => repwref.current?.focus() }
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    password
                />
                <Input 
                    iref={repwref}
                    name={'repw'}
                    state={repw} 
                    setState={setrepw} 
                    placeholder={`비밀번호 재입력`} 
                    returnKeyType={"done"}
                    onSubmitEditing={submitFunc}
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    password
                />
                <Text style={styles.help}>* 영문, 숫자, 특수문자를 포함한 8~20자로 입력해 주세요.</Text>
                {/* <PasswordValid pw={pw} repw={repw} setValid={setPwValid}/> */}
            </View>

            <Button 
                type={'2'} 
                disabled={disabled} 
                onPress={submitFunc} 
                load={load} 
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'setting_pass'} 
                frontIconTintColor={colors.white}
            >
                {header?.title}
            </Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        help: {
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: -0.35,
            color: colors.grey6,
        }
    })
  
    return { styles }
}
