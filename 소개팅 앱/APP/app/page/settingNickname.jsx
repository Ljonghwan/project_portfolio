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
import { ToastMessage, regNick } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Input from '@/components/Input';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser } from '@/libs/store';

import API from '@/libs/api';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();

    const iref = useRef(null);

    const [ nickname, setNickname ] = useState("");

    const [disabled, setDisabled] = useState(false); 
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [ error, setError ] = useState({});
    
    useEffect(() => {
        setDisabled( !(nickname?.length > 1) );
    }, [nickname])

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(disabled || load) return;

        if(!regNick.test(nickname)) {
            setError({...error, nickname: '2~5자 한글,영어로 입력하세요.'});
            return;
        }
       
        setLoad(true);
        
        const sender = {
            type: 1,
            nickName: nickname
        }

        const { data, error } = await API.post('/v1/user/udpateInfo', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('닉네임이 변경되었습니다.');
            router.back();
        }, 500)
       

        console.log('submitFunc', nickname);
    }

    const header = {
        title: '닉네임 변경',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting_nick',
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

            <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: rootStyle.side + 10 }}>
                <Input 
                    iref={iref}
                    required
                    autoFocus
                    inputLabel={'닉네임'}
                    name={'nickname'}
                    state={nickname} 
                    setState={setNickname} 
                    placeholder={`2~5자 한글,영어로 입력`} 
                    returnKeyType={"done"}
                    onSubmitEditing={submitFunc}
                    blurOnSubmit={false}
                    error={error}
                    setError={setError}
                    maxLength={10}
                />
            </View>

            <Button 
                type={'2'} 
                disabled={disabled} 
                onPress={submitFunc} 
                load={load} 
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'setting_nick'} 
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
      
    })
  
    return { styles }
}
