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
        setError({...error, nowpw: ''});
        setDisabled( !(nowpw?.length > 1 ) );
    }, [ nowpw ])

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        setLoad(true);
        
        const sender = {
            password: nowpw
        }

        const { data, error } = await API.post('/v1/user/deleteCheck', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            router.replace(routes.settingLeave);
        }, consts.apiDelay)
       
    }

    const header = {
        title: '회원 탈퇴',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting_leave',
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
                <View style={{ gap: 8 }}>
                    <Text style={styles.title}>회원 탈퇴를 위해 비밀번호를 입력해 주세요.</Text>
                    <Text style={styles.subTitle}>입력한 정보는 본인 인증을 위해서만 사용됩니다.</Text>
                </View>
                <Input 
                    iref={nowpwref}
                    required
                    autoFocus
                    name={'nowpw'}
                    state={nowpw} 
                    setState={setnowpw} 
                    placeholder={`현재 비밀번호`} 
                    returnKeyType={"next"}
                    onSubmitEditing={() => pwref.current?.focus() }
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    password
                />
            </View>

            <Button 
                type={'2'} 
                disabled={disabled} 
                onPress={submitFunc} 
                load={load} 
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'setting_leave'} 
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
        title: {
            fontSize: 18,
            letterSpacing: -0.45,
            fontFamily: fonts.semiBold,
            color: colors.dark
        },
        subTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            color: colors.grey6
        }
    })
  
    return { styles }
}
