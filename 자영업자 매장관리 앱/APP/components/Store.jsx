import { useRef, useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from "expo-router";
import Animated, { FadeIn, useSharedValue } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import Select from '@/components/Select';
import Text from '@/components/Text';

import fonts from '@/libs/fonts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import protectedRouter from '@/libs/protectedRouter';

import API from '@/libs/api';

import { useUser, useStore, useLoader } from '@/libs/store';
import consts from '@/libs/consts';
import { ToastMessage } from '@/libs/utils';


export default function Component({
    style,
}) {

    const { mbData, reload } = useUser();
    const { store, reloadStore } = useStore();
    const { openLoader, closeLoader } = useLoader();

    useEffect(() => {
        console.log('store', store?.title);
    }, [store])
    const changeFunc = async (v) => {
        if (v === 'add') {
            router.push(routes.storeAdd);
        } else {
            openLoader();
            
            const sender = {
                idx: v,
                change: true
            }
            console.log('sender', sender);
            const { data, error } = await API.post('/v1/store/change', sender);

            setTimeout(() => {
                closeLoader();

                if(error) {
                    ToastMessage(error?.message);
                    return;
                }
    
                reloadStore();
            }, consts.apiDelay)
            
        }
    }

    return (
        <Animated.View key={mbData?.store?.length + ""} entering={FadeIn.duration(200)} style={[styles.root, style]}>
            {mbData?.store?.length > 0 ? (
                <Select
                    state={store?.idx}
                    setState={changeFunc}
                    list={[
                        ...mbData?.store?.map((x, i) => ({ idx: x?.idx, title: x?.title })),
                        { idx: 'add', title: '매장 신규 등록', role: 'add' }
                    ]}
                    transformOrigin={'top left'}
                    right={'auto'}
                    left={31}
                >
                    <View
                        style={{
                            height: '100%',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 15,
                        }}
                    >
                        <Text style={styles.title} numberOfLines={1}>{store?.title}</Text>
                        <Image source={images.select_down} style={rootStyle.default18} transition={100} />
                    </View>
                </Select>
            ) : (
                <TouchableOpacity
                    style={{
                        height: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 15,
                    }}
                    onPress={() => {
                        protectedRouter.push(routes.storeAdd);
                    }}
                >
                    <Text style={styles.title} numberOfLines={1}>{`매장 등록하기`}</Text>
                    <Image source={images.select_down} style={rootStyle.default18} transition={100} />
                </TouchableOpacity>
            )}

        </Animated.View>

    )
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        left: 0,
        paddingLeft: 26,
        width: '60%',
        height: rootStyle.header.height,
        justifyContent: 'center',
    },

    title: {
        fontSize: 16,
        fontFamily: fonts.semiBold,
        color: colors.black,
        flexShrink: 1,
    }

});
