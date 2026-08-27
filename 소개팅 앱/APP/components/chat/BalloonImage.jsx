import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, useWindowDimensions, Image as RNImage } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn} from 'react-native-reanimated';

import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { imageViewer } from '@/libs/utils';


dayjs.locale('ko');

export default function Component({ item, isMe, isProfile, isTime }) {

    const { styles } = useStyle();

    return (
        <View style={[isMe ? styles.itemBallonMe : styles.itemBallon]}>
            <Pressable style={styles.imageBox} onPress={() => {
                imageViewer({ index: 0, list: item?.data })
            }}>
                {item?.data?.map((x, i) => {
                    return (
                        <Image key={i} source={ consts.s3Url + x } style={[styles.image, { flex: item?.data?.length < 3 ? 1 : 'unset' }]} transition={200}/>
                    )
                })}
            </Pressable>
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useSafeAreaFrame();

	const styles = StyleSheet.create({
        itemBallon: {
            // padding: 16,
            borderRadius: 16,
            borderTopLeftRadius: 0,
            overflow: 'hidden'
            // backgroundColor: colors.greyF6
        },
        itemBallonMe: {
            // padding: 16,
            borderRadius: 16,
            borderTopRightRadius: 0,
            overflow: 'hidden'
            // backgroundColor: colors.chat1
        },
        imageBox: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 5,
            width: width / 2
        },
        image: {
            minWidth: (( width / 2 ) - 11) / 3,
            aspectRatio: 1/1,
            backgroundColor: colors.placeholder,
        }
      
	})

  	return { styles }
}