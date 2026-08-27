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

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser } from '@/libs/store';

import { ToastMessage, hpHypen, regNick, randomNumberCreate } from '@/libs/utils';

import API from '@/libs/api';
import consts from '@/libs/consts';

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


    const header = {
        title: '휴대폰 변경',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        titleIcon: {
            icon: 'setting_hp',
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

            <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: rootStyle.side + 10, gap: 8 }}>
                
                <Text style={styles.title}>{hpHypen(mbData?.hp)}</Text>
                <Text style={styles.subTitle}>휴대폰번호 변경시 본인인증이 필요합니다.</Text>
            </View>

            <Button 
                type={'2'} 
                load={load} 
                bottom 
                containerStyle={[rootStyle.flex, { gap: 10, borderRadius: 12 }]}
                frontIcon={'setting_nick'} 
                frontIconTintColor={colors.white}
                onPress={() => {
                    router.navigate({
                        pathname: routes.cert,
                        params: {
                            type: 'update'
                        }
                    })
                }}
            >
                본인인증
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
