import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions, Image as RNImage, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn} from 'react-native-reanimated';

import { BlurView } from 'expo-blur';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useUser, useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users }) {

    const { styles } = useStyle();
    const { mbData } = useUser();
    const { configOptions } = useConfig();
    const { transparencyEnabled } = useEtc();

    const [ load, setLoad ] = useState(false);

    const user = users?.find(v => v.idx === item?.data?.userIdx);
    const isMe = user?.idx === mbData?.idx;

    return (
        <View style={[styles.item, { alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: 20 }]}>

            {(!isMe) && (
                <View style={[styles.itemTop, { flexDirection: isMe ? 'row-reverse' : 'row' } ]}>
                    <Image source={(user?.profile ? consts.s3Url + user?.profile : images.profile)} style={styles.profile}/>
                    <Text>{user?.name}</Text>
                </View>
            )}

            <View style={[styles.itemBottom, { flexDirection: isMe ? 'row-reverse' : 'row' } ]}>

                <View style={[isMe ? styles.itemBallonMe : styles.itemBallon]}>
                    <View style={styles.blur} >
                        <View style={[styles.blurTextBox, {  }]}>
                            <Text style={[isMe ? styles.itemBallonTextMe : styles.itemBallonText]}>{item?.data?.text}</Text>
                        </View>
                        <BlurView 
                            style={styles.blurView} 
                            intensity={Platform.OS === 'ios' ? (transparencyEnabled ? 100 : 20) : 5} 
                            tint={'systemUltraThinMaterialLight'} 
                            experimentalBlurMethod={'dimezisBlurView'} 
                        />
                    </View>

                    <View style={[styles.blurTextBox, { paddingTop: 0, gap: 12 }]}>
                        <View style={styles.bar} />
                        <Text style={[isMe ? styles.itemBallonTextMe : styles.itemBallonText]}>{item?.sender?.idx}{item?.message}</Text>
                    </View>
                </View>

                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.date}>{dayjs(item?.createAt).format('A hh:mm')}</Text>
                </View>
            </View>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        item: {
            flex: 1,
            gap: 8,
        },
        itemTop: {
            alignItems: 'flex-end', 
            gap: 8
        },
        itemBottom: {
            alignItems: 'flex-end', 
            gap: 8,
            maxWidth: '70%',
        },
        profile: {
            width: 40,
            height: 40,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemBallon: {
            borderRadius: 20,
            borderTopLeftRadius: 0,
            backgroundColor: colors.greyF6,
            overflow: 'hidden'
        },
        itemBallonMe: {
            borderRadius: 20,
            borderTopRightRadius: 0,
            backgroundColor: colors.chat1,
            overflow: 'hidden',
        },
        itemBallonText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark
        },
        itemBallonTextMe: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.white,
        },
        itemBallonSystem: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.greyF1,
            borderRadius: 12,
            flex: 1
        },
        itemBallonSystemText: {
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark
        },
        date: {
            fontSize: 12,
            color: colors.grey9
        },

        blur: {
        },
        blurTextBox: {
            padding: 16,
            paddingBottom: 12,
        },
        blurView: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
        },
        bar: {
            width: '100%',
            height: 1,
            backgroundColor: colors.greyD
        }
        
	})

  	return { styles }
}