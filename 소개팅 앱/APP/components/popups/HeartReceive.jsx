import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    ScrollView,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import images from '@/libs/images';

import { useAlert, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
    user,
    message,
    status=false,
    onSubmit=()=>{}
}) {

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const { 
        closeAlertFunc
    } = useAlert();

    const { configOptions } = useConfig();

    const iref = useRef(null);

    const [ comment, setComment ] = useState("");

    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    const submitFunc = () => {
        onSubmit();
        closeAlertFunc();
    }

    return (
        <View
            style={styles.root}
        >
            <View
                style={[
                    styles.container
                ]}
            >
                <Image source={images.chat_heart_send} style={{ width: 32, aspectRatio: 1, alignSelf: 'center', marginBottom: -5 }} tintColor={colors.primary}/>
                <View style={ styles.titleBox }>
                    <Text style={styles.title}>{`이대로 끝내기엔 아쉬운\n상대방이 못다 한 진심을 보냈어요.`}</Text>
                </View>
                <View style={styles.messageBox} >
                    <Text style={{...rootStyle.font(14, colors.primary)}}>{message?.replace(/\n/g, ' ')}</Text>
                </View>

                {!status && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>ㆍ마음 받기 시 중단됐던 소개가 재게 됩니다.</Text>
                        <Text style={styles.infoText}>ㆍ창을 닫을 시 소개 종료 대기 상태가 됩니다.</Text>
                    </View>
                )}
                
            </View>
            
            <View style={ styles.bottom }>
                <Button type={4} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={closeAlertFunc} >{!status ? '취소' : '닫기'}</Button>
                {!status && <Button type={1} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={submitFunc}>마음 받기</Button>}
            </View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            gap: 18,
            backgroundColor: colors.white,
            borderRadius: 20,
            overflow: 'hidden',
            width: '100%',
            paddingHorizontal: 12,
            paddingVertical: 8

            // position: 'absolute',
            // top: -150 
            
        },
        container: {
            backgroundColor: colors.white,
            borderRadius: 20,
            gap: 24
        },
        titleBox: {
            gap: 4,
        },
        title: {
            color: colors.dark,
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.medium,
            letterSpacing: -0.5,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            textAlign: 'center'
        },
        list: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44
        },
        listText: {
            color: colors.dark,
            fontSize: 16,
            lineHeight: 20,
            letterSpacing: -0.4,
            textAlign: 'center',
        },
        bottom: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
        },
        bottomText: {
            color: colors.dark,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            textAlign: 'center',
            fontFamily: fonts.semiBold
        },
        messageBox: {
            minHeight: 120,
            maxHeight: 300,
            backgroundColor: colors.eef,
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        infoBox: {
        },
        infoText: {
            fontSize: 12,
            lineHeight: 22,
            color: colors.text_info,
            letterSpacing: -0.35,
            textAlign: 'center'
        },
    })
  
    return { styles }
}
