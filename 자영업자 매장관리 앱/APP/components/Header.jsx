import React, { useRef, useState } from 'react';

import {
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import Store from '@/components/Store';
import Bell from '@/components/Bell';
import Icon from '@/components/Icon';
import Select from '@/components/Select';
import Text from '@/components/Text';

import lang from '@/libs/lang';


export default function Header({
    header,
    bg
}) {
    const { presentation } = useLocalSearchParams();

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const paddingTop = (presentation && Platform.OS === 'ios') ? 0 : insets?.top;
    const headerHeight = rootStyle?.header?.height + ((presentation && Platform.OS === 'ios') ? 0 : insets?.top);

    const iref = useRef(null);

    const visible = useSharedValue(0); // 0: hidden, 1: visible

    const [search, setSearch] = useState(false);

    const inputStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(visible.value, { duration: 200 }),
            transform: [
                {
                    translateX: withTiming(visible.value ? 0 : 20, {
                        duration: 500,
                        easing: Easing.out(Easing.exp),
                    })
                },
            ],
        };
    });

    const toggleSearch = (view) => {
        visible.value = view ? 1 : 0;
        setSearch(view);
        if (view) iref?.current?.focus();
        else {
            header?.search?.setState("");
            iref?.current?.blur();
        }
    }

    return (
        <View
            style={[
                styles.header,
                ...[{
                    backgroundColor: bg,
                    paddingTop: paddingTop,
                    height: headerHeight,
                }]
            ]}
        >

            <View style={styles.container}>
                {header?.title && (
                    <View style={[rootStyle.flex, { flex: 1, gap: 2, paddingHorizontal: 60 }]}>
                        <Text numberOfLines={1} style={[styles.header_title, header?.titleStyle, header?.longTitle && { fontSize: 18 }]} >{header?.title}</Text>
                        {header?.subTitle && <Text style={[styles.header_title, header?.titleStyle, header?.longTitle && { fontSize: 18 }]} >{header?.subTitle}</Text>}
                    </View>

                )}

                {header?.leftTitle && (
                    <View style={[styles.left, { left: 28 }]}>
                        <Text style={styles.header_left_title}>{header?.leftTitle}</Text>
                    </View>
                )}

                {header?.store && (
                    <Store />
                )}

                {header?.left && (
                    <TouchableOpacity
                        style={styles.left}
                        onPress={header?.left?.onPress || null}
                        hitSlop={10}
                    >
                        {header?.left?.icon && (
                            <Image source={images?.[header?.left?.icon]} style={[rootStyle?.[header?.left?.icon] || rootStyle?.default]} />
                        )}
                        {header?.left?.image && (
                            <Image source={header?.left?.image} style={styles.leftImage} />
                        )}
                        {header?.leftTitleWithIcon && (
                            <Text style={[styles.header_left_title_with_icon, { maxWidth: header?.right ? width / 2 : width - 70 }]} numberOfLines={1}>{header?.leftTitleWithIcon}</Text>
                        )}
                    </TouchableOpacity>
                )}

                {header?.rightSub && (
                    <TouchableOpacity
                        style={[styles.right, { right: styles.right.right + 40 }]}
                        onPress={header?.rightSub?.onPress || null}
                        hitSlop={5}
                    >
                        {header?.rightSub?.icon && (
                            <Image source={images?.[header?.rightSub?.icon]} style={rootStyle?.[header?.rightSub?.icon] || rootStyle?.default} />
                        )}

                    </TouchableOpacity>
                )}

                {header?.right && (
                    <TouchableOpacity
                        style={[styles.right]}
                        onPress={header?.right?.onPress || null}
                        hitSlop={5}
                    >
                        {header?.right?.icon && (
                            <Image source={images?.[header?.right?.icon]} style={rootStyle?.[header?.right?.icon] || rootStyle?.default} />
                        )}
                        {header?.right?.image && (
                            <View style={styles.rightImage}>
                                <Image source={header?.right?.image} style={[styles.rightImageStyle, header?.right?.imageStyle]} />
                                <Text style={[styles.rightImageLabel]} numberOfLines={1}>{header?.right?.imageLabel}</Text>
                            </View>
                        )}
                        {header?.right?.text && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                {header?.right?.textIcon && (
                                    <Image source={header?.right?.textIcon} style={[header?.right?.textIconStyle || rootStyle.default]} />
                                )}
                                <Text style={[styles.header_text_button, header?.right?.textStyle]}>{header?.right?.text}</Text>
                            </View>
                        )}
                        {header?.right?.bell && (
                            <Bell />
                        )}

                        {header?.right?.button && (
                            <TouchableOpacity
                                onPress={header?.right?.button?.onPress || null}
                                hitSlop={5}
                                style={styles.rightButton}
                            >
                                <Text style={{...rootStyle.font(14, colors.white, fonts.medium)}}>{header?.right?.button?.text}</Text>

                            </TouchableOpacity>
                        )}

                    </TouchableOpacity>
                )}

                {header?.filter && (
                    <View
                        style={[styles.right]}
                    >
                        <Select
                            state={header?.filter?.state}
                            setState={(v) => header?.filter?.onPress(v)}
                            list={header?.filter?.list}
                            style={rootStyle.default}
                        >
                            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                <Image source={images?.[header?.filter?.icon] || images.dots} style={rootStyle.default} />
                            </View>
                        </Select>
                    </View>
                )}

                {header?.search && (
                    <>
                        <View
                            style={[styles.right]}
                        >
                            <TouchableOpacity hitSlop={5} style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => toggleSearch(true)}>
                                <Image source={images?.[header?.search?.icon] || images.dots} style={rootStyle.default} />
                            </TouchableOpacity>
                        </View>
                        <Animated.View style={[styles.searchBox, inputStyle, { backgroundColor: bg }]} pointerEvents={search ? "auto" : "none"}>
                            <View style={[styles.inputWrap]}>
                                <TextInput
                                    ref={iref}
                                    value={header?.search?.state} //value}
                                    onChangeText={v => {
                                        header?.search?.setState(v);
                                    }} //onChange}
                                    style={[styles.input]}
                                    placeholderTextColor={colors.sub_2}
                                    placeholder={header?.search?.placeholder || lang({ id: 'search' })}
                                    maxLength={50}
                                    autoCapitalize={'none'}
                                    autoCorrect={false}
                                    textContentType={'oneTimeCode'}
                                    allowFontScaling={false}
                                    hitSlop={{ top: 10, bottom: 10 }}
                                />
                                {header?.search?.state?.length > 0 && <Icon img={images.reset} imgStyle={rootStyle.default} hitSlop={10} onPress={() => header?.search?.setState("")} />}
                            </View>

                            <Pressable style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={() => toggleSearch(false)}>
                                <Text style={{ ...rootStyle.font(12, colors.text_popup, fonts.semiBold) }}>{lang({ id: 'cancel' })}</Text>
                            </Pressable>
                        </Animated.View>
                    </>
                )}
            </View>

        </View>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        header: {
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',

        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1
        },
        header_title: {
            fontSize: 15,
            color: colors.header,
            fontFamily: fonts.semiBold,
            textAlign: 'center',
            flexShrink: 1
        },
        header_left_title: {
            fontSize: 24,
            lineHeight: 34,
            fontFamily: fonts.semiBold,
            color: colors.textPrimary,
            letterSpacing: -0.6
        },
        header_left_title_with_icon: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            color: colors.dark,
        },
        header_text_button: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.text_popup,
            textAlign: 'center',
        },
        left: {
            height: rootStyle?.header?.height,
            position: 'absolute',
            left: 18,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 3,
        },
        leftImage: {
            width: 24,
            height: 24,
            borderRadius: 100,
            marginRight: 4,
            backgroundColor: 'red'
        },
        right: {
            height: rootStyle?.header?.height,
            position: 'absolute',
            right: 25,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rightImage: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            width: width / 3,
        },
        rightImageLabel: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.dark,
        },
        rightImageStyle: {
            width: 24,
            height: 24,
            borderRadius: 100,
        },
        rightButton: {
            height: 34,
            borderRadius: 50,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20
        },


        searchBox: {
            position: 'absolute',
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: rootStyle.side,
            transformOrigin: 'right'
        },
        inputWrap: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.sub_3,
        },
        input: {
            flex: 1,
            color: colors.main,
            fontFamily: fonts.medium,
            fontSize: 16,
        },

    })

    return { styles }
}
