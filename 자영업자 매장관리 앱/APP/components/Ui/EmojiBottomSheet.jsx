import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Platform, Pressable } from 'react-native';

import {
    FlatList
} from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardController, KeyboardEvents, KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import Text from '@/components/Text';

import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { useConfig, useEtc } from '@/libs/store';

import { chunkArray } from '@/libs/utils';

export default function Component({
    sheetRef,
    sheetPosition,
    style,
    setEmoji = () => { },
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const { configOptions } = useConfig();
    const { transparencyEnabled } = useEtc();

    const scRef = useRef(null);

    const [list, setList] = useState(width > 600 ? chunkArray(configOptions?.emoji, 3) : chunkArray(configOptions?.emoji, 6));
    const [currentIndex, setCurrentIndex] = useState(0);

    const [selected, setSelected] = useState(null);

    const [layout, setLayout] = useState({});



    useEffect(() => {
        console.log('list', list);
    }, [list])

    const renderItem = ({ item, index }) => (
        <TouchableOpacity style={[styles.slide, {}]} activeOpacity={1}>
            {item?.map((x, i) => (
                <TouchableOpacity
                    key={`${index}_${i}`}
                    onPress={() => {
                        setEmoji(x?.idx);
                    }}
                    activeOpacity={0.7}
                >
                    <Image
                        source={consts.s3Url + x?.image}
                        style={{ width: (width - 81) / 3, aspectRatio: 1 / 1 }}
                    />
                </TouchableOpacity>
            ))}
        </TouchableOpacity>
    );

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        console.log('viewableItems', viewableItems);
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;


    return (
        <>
            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >

                <View
                    style={[
                        style,
                    ]}
                >

                    <View style={[{ gap: 20, backgroundColor: colors.white, paddingVertical: 22, paddingBottom: insets?.bottom + 20 }]}  >
                        <FlatList
                            ref={scRef}
                            data={list}
                            renderItem={renderItem}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{
                                itemVisiblePercentThreshold: 50,
                            }}
                            bounces={true}
                        />
                        <View style={styles.paginationContainer}>
                            <View style={styles.pagination}>
                                {list?.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            currentIndex === index && styles.activeDot,
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </BottomSheetModalTemplate>
        </>
    );
}


const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        paginationContainer: {
            width: '100%',
            alignItems: 'center',
        },
        pagination: {
            flexDirection: 'row',
            gap: 8,
        },
        dot: {
            width: 9,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.placeholder,
        },
        activeDot: {
            backgroundColor: colors.onboardingOrange,
        },





        slide: {
            width: width,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            gap: 20,
            paddingHorizontal: 20
        },
        title: {
            fontFamily: fonts.semiBold,
            fontSize: 20,
            color: colors.black,
            textAlign: 'center',
            lineHeight: 28,
            marginBottom: 24,
        },
        description: {
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.onboardingTextDark,
            textAlign: 'center',
            lineHeight: 25,
        },
    });


    return { styles }
}
