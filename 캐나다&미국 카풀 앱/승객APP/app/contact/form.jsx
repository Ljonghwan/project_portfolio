import React, { useRef, useState, useEffect } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    Keyboard,
    Platform
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Radio from '@/components/Radio';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import Select from '@/components/Select';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat } from '@/libs/utils';

import { useLang, useAlert, useConfig } from '@/libs/store';

export default function Page({ }) {

    const { sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();

    const titleref = useRef(null);
    const contentref = useRef(null);

    const [type, setType] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    useEffect(() => {
      
        setDisabled( !(type && title && content));

    }, [ type, title, content ])

    const submitFunc = async () => {
        
        Keyboard.dismiss();

        if(disabled || load) return;

        setLoad(true);

        const sender = {
            type: type,
            title: title,
            content: content
        }

        const { data, error } = await API.post('/v2/my/suportInsert', sender);
        
        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: 'error'});
                return;
            }

            router.replace(routes.contact);
        }, consts.apiDelay)

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'contact_support' })
    };


    return (
        <Layout header={header} input>
            <View
                style={styles.root}
            >
                <View style={{ gap: 25 }}>
                    <View style={[{ gap: 15, paddingHorizontal: rootStyle.side }]}>
                        <Select
                            state={type}
                            setState={setType}
                            list={
                                configOptions?.suport?.map((x, i) => {
                                    return { idx: x, title: lang({ id: x }) }
                                })
                            }
                            style={rootStyle.default}
                            transformOrigin={'top center'}
                            right={'auto'}
                        >
                            <Button type={9} icon={'down'} pointerEvents="none">{lang({ id: type || 'selection' })}</Button>
                        </Select>
                        <Input
                            iref={titleref}
                            name={'title'}
                            state={title}
                            setState={setTitle}
                            placeholder={lang({ id: 'subject' })}
                            returnKeyType={"next"}
                            onSubmitEditing={() => contentref.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <TextArea
                            iref={contentref}
                            name={'content'}
                            state={content}
                            setState={setContent}
                            placeholder={lang({ id: 'description' })}
                            blurOnSubmit={false}
                            maxLength={255}
                            multiline
                        />
                    </View>

                    <View style={[rootStyle.flex, { paddingHorizontal: rootStyle.side }]}>
                        <Button style={{ flex: 1 }} onPress={submitFunc} disabled={disabled} load={load}>{lang({ id: 'submit_request' })}</Button>
                    </View>
                </View>
                
            </View>
               
           
        </Layout >
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingVertical: 20,
            flex: 1,
        },

        top: {
            alignSelf: 'flex-end',
            marginBottom: 8
        },
        title: {
            fontSize: 20,
            color: colors.main,
            fontFamily: fonts.extraBold,
            textAlign: 'center',
        },
        label: {
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.medium,
            letterSpacing: -0.36
        }
    })

    return { styles }
}
