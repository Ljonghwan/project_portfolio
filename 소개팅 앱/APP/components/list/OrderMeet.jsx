import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import dayjs from 'dayjs';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import { numFormat, elapsedTime } from '@/libs/utils';

export default function Component({
    item=null,
}) {

    return (
        <View 
            style={[ styles.root, { paddingHorizontal: rootStyle.side }]} 
        >
            <View style={styles.item} >

                <Image source={item?.status !== 1 ? images.profile_leave : item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.profile}/>
                <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.itemName}>{item?.status === 9 ? '탈퇴회원' : item?.status === 8 ? '정지회원' : `“${item?.name} 님”`}</Text>
                    <Text style={[styles.itemName, { fontSize: 14 }]}>
                        {numFormat(item?.count)}<Text style={styles.itemSpan}> 번째 소개</Text>
                    </Text>
                </View>
                {item?.roomStatus <= 8 && (
                    <TouchableOpacity onPress={() => {
                        router.navigate({
                            pathname: routes.season,
                            params: {
                                roomIdx: item?.roomIdx
                            }   
                        })
                    }}>
                        <Image source={images.season_log} style={rootStyle.default36}/>
                    </TouchableOpacity>
                )}
                
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingVertical: 20,
        backgroundColor: colors.white,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14
    },
    profile: {
        width: 48,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
    },
    itemName: {
        fontSize: 16,
        letterSpacing: -0.35,
        color: colors.dark,
        fontFamily: fonts.medium,
    },
    itemSpan: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.text_info,
        fontFamily: fonts.regular,
    },
    itemLeave: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.greyC,
    }
});
