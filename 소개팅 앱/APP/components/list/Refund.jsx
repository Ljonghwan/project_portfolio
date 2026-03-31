import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";

import dayjs from 'dayjs';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import { numFormat, elapsedTime } from '@/libs/utils';

import { useAlert } from '@/libs/store';

export default function Component({
    style,
    item=null,
    time=null
}) {

    const { openAlertFunc } = useAlert();

    return (
        <View style={{ paddingHorizontal: 20 }} >
            <View style={[styles.item, style]}>
                {/* <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.itemImage}/> */}
                
                <View style={[rootStyle.flex, { flex: 1, justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                        {/* <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                            <Text style={styles.itemName}>{item?.name}</Text>
                        </View> */}
                        <Text style={[styles.itemName, { fontFamily: fonts.regular }]}>
                            <Text style={[styles.itemName]}>{item?.targetName}</Text>님과 {item?.desc}
                            {/* {dayjs(item?.lastAt).format('YYYY.MM.DD')} */}
                        </Text>
                        <Text style={styles.itemName}>
                            <Text style={styles.itemSpan}>환불 금액 : </Text>
                            {numFormat(item?.amount)}원
                        </Text>
                    </View>

                    <View style={[rootStyle.flex, { gap: 8 }]}>

                        {item?.status === 1 ? (
                            <View style={{ gap: 8, alignItems: 'flex-end' }}>
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    router.navigate({
                                        pathname: routes.refundDetail,
                                        params: {
                                            idx: item?.idx
                                        }
                                    })
                                }}>
                                    <Text style={styles.buttonText}>신청하기</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ gap: 8, alignItems: 'flex-end' }}>
                                <View style={[styles.button, { backgroundColor: colors.greyE }]} >
                                    <Text style={[styles.buttonText, { color: colors.grey6 }]}>{item?.status === 2 ? '신청완료' : '환불완료'}</Text>
                                </View>
                            </View>
                        )}

                    </View>
                </View>
            </View>
              
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flex: 1,
        paddingVertical: 16,
        borderBottomColor: colors.greyE,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    itemImage: {
        width: 48,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
    },
    
    itemName: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
        fontFamily: fonts.semiBold,
    },
    itemSpan: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.grey9,
        fontFamily: fonts.semiBold,
    },
    itemTime: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
    },
    itemLeave: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.greyC,
        fontFamily: fonts.semiBold
    },


    timecapsule: {
        width: 40,
        aspectRatio: 1/1,
        borderRadius: 1000,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    capsuleProfile: {
        width: 14,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder,
        position: 'absolute',
        right: 6,
        bottom: 6,
        borderWidth: 1.5,
        borderColor: colors.main
    },


    button: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.main2
    },
    buttonText: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.main,
        fontFamily: fonts.semiBold,
    },

    dot: {
        width: 12,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.main
    }
});
