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
  Keyboard,
  Platform,
  Linking
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';

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
import consts from '@/libs/consts';
import lang from '@/libs/lang';

import { useUser } from '@/libs/store';

import API from '@/libs/api';
import { Image } from 'expo-image';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();

    const [ row, setRow ] = useState(null);

    const [disabled, setDisabled] = useState(false); 
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [ error, setError ] = useState({});
    
    useEffect(() => {
        dataFunc();

        console.log( `https://apps.apple.com/app/${Application.applicationId}`)
    }, [])

    const dataFunc = async () => {

        setLoad(true);

        const sender = {
            type: 'passenger'
        }
        const { data, error } = await API.post('/v2/my/appinfo', sender);

        console.log('data', data);
        setRow(data?.[Platform.OS === 'ios' ? 'apple' : 'android']);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay)
    }

    const header = {
        title: lang({ id: 'app_version'}),
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={colors.white} >

            {load && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 25, paddingHorizontal: rootStyle.side, paddingBottom: insets?.bottom + rootStyle.header.height }}>

                <Text style={{...rootStyle.font(20, colors.main, fonts.semiBold)}}>{lang({ id: row?.version !== Application.nativeApplicationVersion ? 'new_version_is' : 'youre_using_latest' })}</Text>

                <View style={[ rootStyle.flex, { gap: 22 }]}>
                    <View style={{ borderRadius: 20 , borderWidth: 1, borderColor: colors.sub_1, width: 78, aspectRatio: 1/1, overflow: 'hidden'}}>
                        <Image source={images.icon} style={{ width: '100%', height: '100%' }} />
                    </View>

                    <View style={{ gap: 12 }}>
                        <Text style={{...rootStyle.font(18, colors.sub_1)}}>{lang({ id: 'current_version_10' })} {Application.nativeApplicationVersion}</Text>
                        <Text style={{...rootStyle.font(18, colors.sub_1)}}>{lang({ id: 'latest_version_10' })} {row?.version}</Text>
                    </View>
                  
                </View>

                {row?.version !== Application.nativeApplicationVersion && (
                    <Pressable hitSlop={10} onPress={() => {
                        let url = row?.url || (Platform.OS === 'ios' ? `https://apps.apple.com/app/${Application.applicationId}` : `https://play.google.com/store/apps/details?id=${Application.applicationId}` );
                        Linking.openURL(url);
                    }}>
                        <Text style={{...rootStyle.font(18, colors.taseta, fonts.medium), textDecorationLine: 'underline' }}>{lang({ id: 'update' })}</Text>
                    </Pressable>
                )}
                
            </View>

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
