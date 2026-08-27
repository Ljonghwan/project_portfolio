import React, { useRef, useState, useEffect } from 'react';
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

import API from '@/libs/api';
import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';
import images from '@/libs/images';

export default function Component({ flirting=0, seasonLog=0, onSubmit=()=>{} }) {

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const handleClose = () => {
        closeAlertFunc();
    }

    const handleSubmit = async () => {
        handleClose();
        onSubmit();
    }


    return (
        <View
            style={[styles.root]}
        >
            {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                <Image source={images.exit} style={rootStyle.exit}/>
            </TouchableOpacity> */}

            <View style={{ gap: 20 }}>
                <View style={{ gap: 24 }}>
                    <Image source={images.warning} style={[rootStyle.default36, { alignSelf: 'center' }]} />
                        
                    <View style={{ gap: 20 }}>
                        <Text style={styles.label} >{'사소한 1%앱을 탈퇴하시겠어요?'}</Text>
                        <Text style={styles.comment}>{`삭제되는 항목은 다음과 같습니다.\n정말 탈퇴하시겠습니까?`}</Text>

                        <View style={styles.infoBox}>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                    <Image source={images.picket} style={[rootStyle.picket, { width: 24 }]} />
                                    <Text style={styles.infoText}>{`픽켓`}</Text>
                                </View>
                                <Text style={styles.infoText}>{`${numFormat(flirting)}장`}</Text>
                            </View>

                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                    <Image source={images.season_log} style={rootStyle.default} />
                                    <Text style={styles.infoText}>{`모든 사계 로그`}</Text>
                                </View>
                                <Text style={styles.infoText}>{`${numFormat(seasonLog)}개`}</Text>
                            </View>
                        </View>
                        
                    </View>
                </View>
            </View>
            <View style={styles.buttonBox}>
                <Button style={{ flex: 1 }} type={13} textStyle={{ fontSize: 16 }} onPress={handleClose}>아니요</Button>
                <Button style={{ flex: 1 }} type={1} textStyle={{ fontSize: 16 }} onPress={handleSubmit}>탈퇴하기</Button>
            </View>
        </View >

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 12,
            paddingBottom: 8,
            gap: 24
        },
        label: {
            fontSize: 18,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            letterSpacing: -0.45
        },
        comment: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            fontFamily: fonts.medium,
            textAlign: 'center',
            letterSpacing: -0.8
        },
        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        infoBox: {
            gap: 16,
            paddingVertical: 16,
            paddingHorizontal: 26,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        infoText: {
            fontSize: 14,
            color: colors.primary,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35
        },


    })

    return { styles }
}
