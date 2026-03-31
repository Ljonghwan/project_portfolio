import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';
import Carousel from '@/components/Carousel';

import BoardView from '@/components/Ui/BoardView';
import Tag from '@/components/Ui/Tag';
import InputComment from '@/components/Ui/InputComment';

import Comment from '@/components/Item/Comment';

import BoardMenu from '@/components/Popup/BoardMenu';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, getFullDateFormat, numFormat, imageViewer } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useAlertSheet, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { idx, route } = useLocalSearchParams();

    const { mbData } = useUser();
    const { store } = useStore();

    const { openAlertFunc: openAlertSheetFunc } = useAlertSheet();

    const { configOptions } = useConfig();

    const scRef = useRef(null);

    const [item, setItem] = useState(null);
    const [bookmark, setBookmark] = useState(false);
    const [like, setLike] = useState(false);

    const [comments, setComments] = useState([]);

    const [reply, setReply] = useState(null);

    const [load, setLoad] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc();
        }, [idx])
    );

    useEffect(() => {

        if (reload) {
            dataFunc();
        }

    }, [reload]);

    const dataFunc = async (scroll) => {

        let sender = {
            idx
        }
        const { data, error } = await API.post('/v1/news/get', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);

        setTimeout(() => {
            setLoad(false);
            setReload(false);

        }, consts.apiDelay);

    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '소식',
    };

    return (
        <Layout header={header} >
            {load && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={styles.root}>
                <View style={{ gap: 10, paddingHorizontal: rootStyle.side, paddingBottom: 10 }}>
                    <Text style={{...rootStyle.font(20, colors.text212223, fonts.bold), lineHeight: 28 }}>{item?.title}</Text>
                    <Text style={{...rootStyle.font(12, colors.text9C9EA3, fonts.medium) }} >{dayjs(item?.createAt).format('YYYY.MM.DD')}</Text>
                </View>

                <EditorView content={item?.comment} thumb={item?.image} />
            </View>
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({

        root: {
            flex: 1,
            paddingTop: 10
        },

    })

    return { styles }
}
