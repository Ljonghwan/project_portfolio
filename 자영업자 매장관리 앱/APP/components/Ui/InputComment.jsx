import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TextInput, Pressable, View, Platform, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from "react-native-reanimated";
import { KeyboardController, KeyboardEvents, KeyboardStickyView } from 'react-native-keyboard-controller';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Text from '@/components/Text';

import Emoji from '@/components/Ui/Emoji';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage, getFullDateFormat, numFormat } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useAlertSheet, useLoader } from '@/libs/store';
import consts from '@/libs/consts';

export default function Component({
    iref=null,
    idx,
    readOnly = false,
    reply = null,
    setReply = () => { },
    dataFunc = () => { },
    style,
    inputStyle,
    emoji = null,
    setEmoji = () => { },
    emojiOpen= null,
}) {
    const { styles } = useStyle();
    const { openLoader, closeLoader } = useLoader();
    const insets = useSafeAreaInsets();
    const { configOptions } = useConfig();

    const [f, setF] = useState(false);

    const [input, setInput] = useState('');

    const [mode, setMode] = useState(null);
    const [enabled, setEnabled] = useState(false);

    const [height, setHeight] = useState(40); // 초기 높이
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (reply) iref?.current?.focus();
    }, [reply])

    useEffect(() => {
        // visible.value = input?.length > 0 ? 1 : 0;

        setDisabled(!(input?.trim()?.length > 0));
    }, [input])

    const onChanged = (v) => {
        setInput(v);
    }

    const removeReply = () => {
        setReply(null)
    }

    const onSubmit = async () => {

        Keyboard.dismiss();
        openLoader();

        const sender = {
            idx: idx,
            parent_idx: reply?.idx,
            comment: input,
            emoji: emoji
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/reply/update', sender);

        setTimeout(() => {

            closeLoader();
            setReply(null);
            setInput("");
            setEmoji(null);

            if (error) {
                ToastMessage(error?.message);
                return;
            }
            
            dataFunc(Boolean(!reply?.idx));

        }, consts.apiDelay)
    }

    return (
        <>
            <View 
                style={[{ width: '100%'}, style]}
            >
                {emoji && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dim, height: 150, position: 'absolute', top: -170, left: 0, width: '100%'  }}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => {
                        }}>
                            <Image source={consts.s3Url + configOptions?.emoji?.find(x => x?.idx === emoji)?.image} style={{ width: 110, aspectRatio: 1 / 1 }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ position: 'absolute', top: 12, right: 22 }} onPress={() => setEmoji(null)}>
                            <Image source={images.exit_white} style={rootStyle.default} />
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={[styles.root]}>
                    {reply && (
                        <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 0 }]}>
                            <Text style={{ ...rootStyle.font(13, colors.text4A6CFC, fonts.medium), paddingHorizontal: 4 }}>@{reply?.nickname}</Text>
                            <TouchableOpacity hitSlop={5} onPress={removeReply}>
                                <Image source={images.exit} style={[rootStyle.default12, { tintColor: colors.text4A6CFC }]} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.container}>
                        
                        
                        <Animated.View style={[styles.inputWrap, inputStyle]}>
                            {emojiOpen && (
                                <TouchableOpacity style={{}} onPress={emojiOpen}>
                                    <Image source={images.emoji} style={rootStyle.default} />
                                </TouchableOpacity>
                            )}

                            <TextInput
                                ref={iref}
                                onFocus={(event) => {
                                    setF(true);
                                }}
                                onBlur={() => {
                                    setF(false);
                                }}
                                value={input} //value}
                                onChangeText={v => {
                                    onChanged(v);
                                }}
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === 'Backspace') {
                                        if (!input && reply) {
                                            setReply(null);
                                        }
                                    }
                                }}
                                style={[styles.input, Platform.OS === 'ios' && { paddingTop: 0 }]}
                                placeholder='댓글 입력'
                                placeholderTextColor={colors.textSecondary}
                                maxLength={200}
                                editable={!readOnly}
                                autoCapitalize={'none'}
                                textContentType={'oneTimeCode'}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                allowFontScaling={false}
                            />
                        </Animated.View>
                        
                        <View style={[]}>
                            <Button type={'send'} disabled={disabled} onPress={onSubmit}>등록</Button>
                        </View>
                        
                    </View>
                </View>
                
                {/* <View style={[rootStyle.flex, { justifyContent: 'space-between', height: 40 }]}>
                    <TouchableOpacity style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={emojiFunc}>
                        <Image source={images.emoji} style={rootStyle.default} />
                    </TouchableOpacity>
                    <View style={[]}>
                        <Button type={'send'} disabled={disabled} onPress={onSubmit}>등록</Button>
                    </View>
                </View> */}

            </View>

            {/* <Emoji
                enabled={enabled}
                mode={mode}
                setMode={setMode}
                emojiFunc={(v) => {
                    console.log('v', v);
                }}
                hideToolbar={true}
            /> */}
        </>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            marginHorizontal: 15,
            paddingVertical: 8,
            paddingHorizontal: 15,
            paddingBottom: insets?.bottom + 20,
            borderTopWidth: 0.3,
            borderTopColor: colors.gray,

            gap: 6,
            backgroundColor: colors.white
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
        },

        inputWrap: {
            flex: 1,
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
            gap: 5
            // minHeight: 32,

            // backgroundColor: 'red'
        },
        overlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'red',
            opacity: 0.3,
            paddingHorizontal: 4,
            flex: 1
        },
        input: {
            flex: 1,
            color: colors.black,
            fontFamily: fonts.medium,
            fontSize: 14,
            minHeight: 20, // 최소 높이
            maxHeight: 100, // 최대 높이 제한

            paddingHorizontal: 4,
            // backgroundColor: 'red'


        },
        send: {
            paddingHorizontal: 12,
            height: 32,
            backgroundColor: colors.primary,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center'
        }
    })

    return { styles }
}
