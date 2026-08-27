import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";

import Text from '@/components/Text';
import Button from '@/components/Button';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { imageViewer } from '@/libs/utils';
import fonts from '@/libs/fonts';

export default function Component({ 
    item, 
    isMe, 
    isLast, 
    leaveAlert, 
    lottiePlay,
    users,
    viewables
}) {

    const { styles } = useStyle();


    return (
        <View
            style={[styles.item, { flex: 1, marginTop: 20 }]}
        >
            <View style={styles.itemBallonSystem}>
                <Text style={[styles.itemBallonSystemText, item?.data?.type === 'bold' && { fontFamily: fonts.semiBold } ]}>{item?.message}</Text>
            </View>
           
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        item: {
            flex: 1,
        },
        itemBallonSystem: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: colors.sub_3,
            borderRadius: 12,
            alignSelf: 'center',
            gap: 12
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.sub_1,
            fontFamily: fonts.medium,
            textAlign: 'center'
        },
        buttonBox: {
            maxWidth: '80%',
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8 
        }
	})

  	return { styles }
}