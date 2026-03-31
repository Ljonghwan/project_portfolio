import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage, imageViewer } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme, room }) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const [ load, setLoad ] = useState(false);
    
    return (
        <AnimatedBackground bg={chatTheme?.systemBackgroundColor} style={[styles.buttonBox, { borderColor: chatTheme?.primary }]}>
            <Pressable style={[styles.itemBallonSystem, { justifyContent: item?.data?.photoList?.length > 2 ? 'flex-start' : 'center' }]} onPress={() => {
                imageViewer({ index: 0, list: item?.data?.photoList })
            }}>
                {item?.data?.photoList?.map((x, i) => {
                    return (
                        <Image key={i} source={consts.s3Url + x} style={styles.profile} />
                    )
                })}
            </Pressable>
            {/* <Button type={3} style={{ flex: 1 }}>프로필 피드백 작성하기</Button> */}
        </AnimatedBackground>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        buttonBox: {
            maxWidth: '100%',
            borderRadius: 20,
            borderWidth: 1,
        },
       
        profile: {
            flex: 1,
            maxWidth: '33.33%',
            aspectRatio: 1/1,
            borderRadius: 12,
            backgroundColor: colors.placeholder
        },
        itemBallonSystem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            // flexWrap: 'wrap',
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 6
            // backgroundColor: colors.system,
        },
        itemBallonSystemText: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
        },
	})

  	return { styles }
}