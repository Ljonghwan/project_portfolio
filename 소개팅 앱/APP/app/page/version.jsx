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
import { useUser } from '@/libs/store';

import API from '@/libs/api';

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

        const { data, error } = await API.post('/v1/appInfo');

        console.log('data', data);
        setRow(data?.[Platform.OS === 'ios' ? 'apple' : 'android']);

        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay)
    }

    const header = {
        title: '앱버전',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'my_app'
        },
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

            <View style={{ flex: 1, padding: 20, paddingTop: 40, alignItems: 'center', gap: 20 }}>

                <View style={{ gap: 8 }}>
                    <Text style={[styles.title]}>현재 버전 {Application.nativeApplicationVersion}</Text>
                    <Text style={[styles.title, { fontFamily: fonts.semiBold }]}>최신 버전 {row?.version}</Text>
                    {/* <Text>
                        {Platform.OS === 'ios' ? `itms-apps://apps.apple.com/app/${Application.applicationId}` : `https://play.google.com/store/apps/details?id=${Application.applicationId}`}
                    </Text> */}
                </View>

                {row?.version !== Application.nativeApplicationVersion ? (
                    <Button type={'1'} textStyle={{ fontSize: 16 }} onPress={() => {
                        let url = row?.url || (Platform.OS === 'ios' ? `https://apps.apple.com/app/${Application.applicationId}` : `https://play.google.com/store/apps/details?id=${Application.applicationId}` );
                        Linking.openURL(url);
                    }}>앱 업데이트</Button>
                ) : (
                    <Button type={'1'} textStyle={{ fontSize: 16 }} >최신 버전 입니다</Button>
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
        title: {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.dark,
            textAlign: 'center'
        }
    })
  
    return { styles }
}
