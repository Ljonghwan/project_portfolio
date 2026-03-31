import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, FlatList, useWindowDimensions, Image as RNImage, Platform, BackHandler, Keyboard } from 'react-native';
import { Image } from 'expo-image';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from "expo-router";

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import ChatNotice from '@/components/list/ChatNotice';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { ToastMessage, useBackHandler } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ list, view, setView }) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { noticeRead, setNoticeRead } = useConfig();

    const [load, setLoad] = useState(true);

    // const [ soundRef, setSoundRef ] = useState(null);
    // const [view, setView] = useState(false);

    useFocusEffect(
        // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
        useCallback(() => {
            // Invoked whenever the route is focused.
            const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

            // Return function is invoked whenever the route gets out of focus.
            return () => {
                backHandler.remove();
            };
        }, [view])
    );

    useEffect(() => {
        // setLoad(true);
        if(view) {
            setNoticeRead(list?.[0]?.idx);
        }

        setTimeout(() => {
            setLoad(!view);
        }, 500)

    }, [view])

    const backAction = () => {
        if (view) {
            // view가 true일 때, 뒤로가기 버튼으로 view를 false로 설정
            setView(false);
            return true; // 뒤로가기 이벤트 처리 완료 (기본 동작 방지)
        }
        // view가 false일 때, 기본 뒤로가기 동작 수행
        return false; // 기본 뒤로가기 동작 허용
    };


    const renderItem = ({ item, index }) => {

        return (
            <ChatNotice item={item} index={index} />
        );
    };


    return (
        <>
            {!view ? (
                <Pressable style={styles.root} onPress={() => {
                    Keyboard.dismiss();
                    setView(true);
                }}>
                    <Image source={images.notice} style={rootStyle.default} />

                    <View style={[ rootStyle.flex, { flex: 1 }]}>
                        {/* {dayjs(list?.[0]?.createAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') && <Text style={styles.new}>NEW</Text>} */}
                        {list?.[0]?.idx > noticeRead && <Text style={styles.new}>NEW</Text>}
                        <Text style={styles.title} numberOfLines={1}>{list?.[0]?.title}</Text>
                    </View>

                    <Image source={images.down2} style={rootStyle.default} />
                </Pressable>
            ) : (
                <View style={[styles.list]}>

                    {load && (
                        <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />
                    )}

                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={list}
                            renderItem={renderItem}
                            numColumns={1}
                            keyExtractor={(item) => item?.idx}

                        // keyboardDismissMode={'on-drag'}
                        // keyboardShouldPersistTaps={"handled"}
                        // nestedScrollEnabled={true}
                        // decelerationRate={'normal'}
                        />
                        <Pressable style={styles.button} onPress={() => setView(false)}>
                            <Image source={images.up} style={rootStyle.default} />
                            <Text style={styles.buttonText}>닫기</Text>
                        </Pressable>
                    </View>

                </View>
            )}


        </>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 20,
            height: 56,
            borderBottomWidth: 1,
            borderBottomColor: colors.greyD,
            backgroundColor: colors.white,
            position: 'absolute',
            top: 0,
            width: '100%',
            zIndex: 11
        },
        title: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            flex: 1
        },
        list: {
            // ...StyleSheet.absoluteFillObject,
            // zIndex: 11,
            // height: '100%',
            flex: 1,
            // height: '100%',
            // height: height - (rootStyle.header.height),
            // paddingBottom: insets?.bottom,
            backgroundColor: colors.white
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            backgroundColor: colors.greyE,
            paddingBottom: insets?.bottom,

        },
        buttonText: {
            fontSize: 16,
            lineHeight: 52,
            letterSpacing: -0.4,
            color: colors.grey6,
            fontFamily: fonts.semiBold,
        },

        new: {
            color: colors.red,
            fontSize: 10,
            letterSpacing: -0.35,
            position: 'absolute',
            top: -12,
            left: 0,
            fontFamily: fonts.semiBold
        },

    })

    return { styles }
}