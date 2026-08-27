import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { Image } from "expo-image";

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
import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

export default function Component({ onSubmit=()=>{} }) {

    const { styles } = useStyle();

    const { mbData } = useUser(); 
    const { closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const handleClose = () => {
        closeAlertFunc();

        onSubmit();
    }


    return (
        <View 
            style={[styles.root]}
        >
            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                <Image source={images.exit} style={rootStyle.exit}/>
            </TouchableOpacity> */}
            
            <View style={{ gap: 20, alignItems: 'center' }}>

                <Image source={images.rematch_success} style={rootStyle.rematch_success} />
                <Text style={styles.label} >{'리매치를 신청했습니다.'}</Text>

                <Text style={styles.infoText} >{'상대방이 확인후 수락여부가 결정됩니다.\n기다려주세요.'}</Text>

            </View>
            <View style={styles.buttonBox}>
                <Button style={{ flex: 1 }} type={3} onPress={handleClose}>확인하기</Button>
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
            fontSize: 18,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            letterSpacing: -0.25
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        infoText: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.25,
            textAlign: 'center'
        }
    })
  
    return { styles }
}
