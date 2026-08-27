import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';

import Text from '@/components/Text';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import images from '@/libs/images';

import API from '@/libs/api';
import { useUser, useAlert } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';


export default function Component({ onPress=()=>{} }) {

    const { styles } = useStyle();

    const { closeAlertFunc } = useAlert();
    
    const handleClose = () => {
        closeAlertFunc();
    }

    const handleSubmit = async () => {
        handleClose();
        onPress();
    }
   

    return (
        <View 
            style={[styles.root]}
        >
            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                <Image source={images.exit} style={rootStyle.exit}/>
            </TouchableOpacity> */}
            
            <View style={{ gap: 20, paddingTop: 8 }}>
                <View style={{ gap: 24 }}>
                    <View style={[ { gap: 12 }]}>
                        <Text style={styles.label} >{'TOP 플러팅을 보내지 않으시겠습니까?'}</Text>
                        <Text style={styles.title}>
                            {`결정의 날에 `}
                            <Text style={[styles.title, { fontFamily: fonts.semiBold }]}>결정(수락, 거절)</Text>
                            {`을 하게 되면\n더 이상 `}
                            <Text style={[styles.title, { fontFamily: fonts.semiBold }]}>TOP 플러팅을 보낼 수 없습니다.</Text>
                        </Text>    
                    </View>
                    <Text style={[styles.title, { color: colors.grey6 }]}>* 신중히 결정해 주세요.</Text>
                </View>
            </View>

            <View style={styles.buttonBox}>
                <Button style={{ flex: 1 }} type={4} onPress={handleClose}>아니오</Button>
                <Button style={{ flex: 1 }} type={3} onPress={handleSubmit}>네</Button>
            </View>
            
        </View >
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 16, 
            paddingBottom: 16,
            gap: 24
        },
        label: {
            fontSize: 20,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            letterSpacing: -0.5
        },
        title: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.dark,
            textAlign: 'center',
            letterSpacing: -0.4
        },
        subTitle: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.grey6,
            textAlign: 'center',
            letterSpacing: -0.4
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },

        infoBox: {
            paddingTop: 20,
            paddingHorizontal: 5,
            borderTopColor: colors.greyE,
            borderTopWidth: 1
        },
        infoText: {
            fontSize: 12.5,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.625
        }
    })
  
    return { styles }
}
