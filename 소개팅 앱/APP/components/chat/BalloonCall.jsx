import { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage, Platform } from 'react-native';
import { Image } from 'expo-image';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, isMe, chatTheme }) {

    const { styles } = useStyle();
    
    const [ initLoad, setInitLoad ] = useState(true);

    // const [ soundRef, setSoundRef ] = useState(null);
    const [ status, setStatus ] = useState(null);
    const [ currentDuration, setCurrentDuration ] = useState(0);

    return (
        <View style={[isMe ? styles.itemBallonMe : styles.itemBallon, { backgroundColor: isMe ? chatTheme?.balloonBackgroundColor1 : chatTheme?.balloonBackgroundColor2 }]}>
            <Pressable style={styles.voiceBox} onPress={() => {}} hitSlop={16}>
                {/* <Image source={isMe ? images.voice_play_white : images.voice_play} style={rootStyle.default16} /> */}
            
                <Image source={isMe ? images.call_end : images.call_end_black} style={rootStyle.default16} />
               
                <Text style={[isMe ? styles.itemBallonTextMe : styles.itemBallonText, { color: isMe ? chatTheme?.balloonTextColor1 : chatTheme?.balloonTextColor2 }]} >{item?.data?.result === 'completed' ? dayjs((item?.data?.duration * 1000) || 0).format('mm:ss') : '취소'}</Text>
            </Pressable>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
       
        itemBallon: {
            padding: 16,
            borderRadius: 20,
            borderTopLeftRadius: 0,
            backgroundColor: colors.greyF6
        },
        itemBallonMe: {
            padding: 16,
            borderRadius: 20,
            borderTopRightRadius: 0,
            backgroundColor: colors.chat1
        },
        itemBallonText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark
        },
        itemBallonTextMe: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.white
        },
        voiceBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
      
	})

  	return { styles }
}