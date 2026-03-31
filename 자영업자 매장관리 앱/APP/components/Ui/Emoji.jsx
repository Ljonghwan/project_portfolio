import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, TouchableWithoutFeedback, FlatList, Keyboard, Platform } from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardController, KeyboardEvents, KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import Text from '@/components/Text';

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
    style,
    enabled = true,

    mode = null,
    setMode = () => { },
    iref = null,
    photoFunc = () => { },
    emojiFunc = () => { },
    emojiSubmit = () => { },

    hideToolbar = false,
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const { configOptions } = useConfig();
    const { transparencyEnabled } = useEtc();

    const innerRef = useRef(null);
    const scRef = useRef(null);

    const [list, setList] = useState(width > 600 ? chunkArray(configOptions?.emoji, 3) : chunkArray(configOptions?.emoji, 6));
    const [currentIndex, setCurrentIndex] = useState(0);

    const [selected, setSelected] = useState(null);

    const [layout, setLayout] = useState({});


    useEffect(() => {
        const show = KeyboardEvents.addListener("keyboardWillShow", (e) => {
            setMode(null);
        });

        return () => {
            show.remove();
        };
    }, [])

    useEffect(() => {
        console.log('list', list);
    }, [list])

    const renderItem = ({ item, index }) => (
        <TouchableOpacity style={[styles.slide, {}]} activeOpacity={1}>
            {item?.map((x, i) => (
                <TouchableOpacity
                    key={`${index}_${i}`}
                    onPress={() => setSelected(consts.s3Url + x?.image)}
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

            {mode === 'emoji' && (
                <Animated.View
                    style={[
                        { position: 'absolute', bottom: 0, left: 0 },
                        style,
                    ]}
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                >

                    {selected && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dim, height: 150, marginBottom: 20 }}>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                emojiFunc(selected);
                                setTimeout(() => {
                                    setSelected(null);
                                }, 300)
                            }}>
                                <Image source={selected} style={{ width: 110, aspectRatio: 1 / 1 }} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ position: 'absolute', top: 12, right: 22 }} onPress={() => setSelected(null)}>
                                <Image source={images.exit_white} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[rootStyle.flex, { justifyContent: 'flex-end', paddingHorizontal: 17, height: 47, borderTopWidth: 1, borderTopColor: colors.eeeeef, backgroundColor: colors.white, marginBottom: -1 }]}>
                        <View style={[rootStyle.flex, { gap: 17, justifyContent: 'flex-start', height: '100%' }]}>
                            <TouchableOpacity style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={() => {
                                iref?.current?.focusContentEditor();
                                setMode(null);
                            }}>
                                <Image source={images.keyboard_up} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View style={[{ gap: 20, backgroundColor: colors.fafafa, paddingVertical: 22, paddingBottom: insets?.bottom + 20 }]}  >
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
                </Animated.View>
            )}

            {!hideToolbar && (
                <KeyboardStickyView
                    style={[
                        { width: '100%', overflow: 'hidden', borderTopWidth: 1, borderTopColor: colors.eeeeef, backgroundColor: colors.white },
                    ]}
                    offset={{ closed: 47, opened: 0 }}
                    enabled={true}
                >


                    <View style={[rootStyle.flex, { justifyContent: 'space-between', paddingHorizontal: 17, height: 47 }]}>
                        <View style={[rootStyle.flex, { gap: 17, justifyContent: 'flex-start', height: '100%' }]}>
                            {enabled && (
                                <>
                                    {/* <TouchableOpacity style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={photoFunc}>
                                    <Image source={images.camera} style={rootStyle.default} />
                                </TouchableOpacity> */}
                                    <TouchableOpacity style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={() => {
                                        setMode('emoji');

                                        Keyboard.dismiss();
                                        iref?.current?.blurContentEditor();
                                    }}>
                                        <Image source={images.emoji} style={rootStyle.default} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                        <View style={[rootStyle.flex, { gap: 17, justifyContent: 'flex-start', height: '100%' }]}>
                            <TouchableOpacity style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={() => {
                                Keyboard.dismiss();
                                iref?.current?.blurContentEditor();
                            }}>
                                <Image source={images.keyboard_down} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardStickyView>
            )}
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
