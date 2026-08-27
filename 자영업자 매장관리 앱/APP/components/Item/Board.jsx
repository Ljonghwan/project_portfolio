import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from 'dayjs';

import Text from '@/components/Text';

import Tag from '@/components/Ui/Tag';
import InlineExpandableText from '@/components/Ui/InlineExpandableText';

import BoardMenu from '@/components/Popup/BoardMenu';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

import API from '@/libs/api';
import protectedRouter from '@/libs/protectedRouter';

import { getFullDateFormat, numFormat, ToastMessage } from '@/libs/utils';

import { useUser, useConfig, useAlert, useAlertSheet, useLoader } from '@/libs/store';


export default function Component({
    style,
    item,
    handleRemove = () => { }
}) {

    const pathname = usePathname();

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlertSheet();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const [showMoreButton, setShowMoreButton] = useState(false);
    const [bookmark, setBookmark] = useState(Boolean(item?.isBookmark));
    const [bookmarkCount, setBookmarkCount] = useState(item?.bookmark_count || 0);

    useEffect(() => {
        setBookmark(Boolean(item?.isBookmark));
        setBookmarkCount(item?.bookmark_count || 0);
    }, [item])

    const bookMarkFunc = async () => {

        const sender = {
            idx: item?.idx,
        }
        const { data, error } = await API.post('/v1/action/bookmark', sender);

        setBookmark(data?.status);
        setBookmarkCount(prev => prev + (data?.status ? 1 : -1));
    }

    const menuFunc = () => {
        openAlertFunc({
            alertType: 'Sheet',
            backgroundStyle: { backgroundColor: colors.transparent },
            component: <BoardMenu item={item} handleRemove={handleRemove} />
        })
    }


    return (
        <Pressable key={item?.idx} style={[styles.root, style]} onPress={() => {
            protectedRouter.push({
                pathname: routes.boardView,
                params: {
                    idx: item?.idx,
                    route: pathname
                }
            })
            return;
            router.push({
                pathname: routes.boardView,
                params: {
                    idx: item?.idx
                }
            })
        }}>
            {/* <Text style={{...rootStyle.font(30)}}>{item?.idx}</Text> */}
            <Tag type={'board'} tag={configOptions?.boardCategory?.find(x => x?.idx === item?.cate)?.title} />
            <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'space-between' }]}>
                <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'flex-start' }]}>
                    <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={{ width: 32, aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                    <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.user?.nickname}</Text>
                    {item?.user?.badge && <Tag type={'badge'} tag={configOptions?.badges?.find(x => x?.idx === item?.user?.badge)?.label} />}
                    <View style={{ width: 2, height: 2, borderRadius: 1000, backgroundColor: colors.text7F8287 }} />
                    <Text style={{ ...rootStyle.font(11, colors.text7F8287, fonts.medium) }}>{getFullDateFormat(item?.createdAt)}</Text>
                </View>
                <TouchableOpacity hitSlop={10} onPress={() => protectedRouter.callback(bookMarkFunc)}>
                    <Image source={bookmark ? images.bookmark_on : images.bookmark_off} style={rootStyle.default} transition={100} />
                </TouchableOpacity>
            </View>

            <Text style={{ ...rootStyle.font(14, colors.black, fonts.semiBold) }} numberOfLines={1} >{item?.title}</Text>
            <InlineExpandableText
                style={{ ...rootStyle.font(14, colors.black), lineHeight: 20, paddingHorizontal: 2 }}
                maxLines={2}
            >
                {item?.comment}
            </InlineExpandableText>

            {/* <View>
                <Text
                    style={{ ...rootStyle.font(14, colors.black), lineHeight: 20, paddingHorizontal: 2 }}
                    numberOfLines={2}
                    onTextLayout={(e) => {
                        // 텍스트가 잘렸는지 확인
                        console.log('e.nativeEvent', e.nativeEvent);
                        if (e.nativeEvent.lines.length >= 3) {
                            setShowMoreButton(true);
                        }
                    }}
                >
                    {item?.comment}
                    <Text>                        </Text>
                </Text>
                {showMoreButton && (
                    <Text>more!</Text>
                )}
            </View> */}

            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                    <View style={[rootStyle.flex, { gap: 2 }]}>
                        <Image source={images.like} style={rootStyle.default16} transition={100} />
                        <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >{numFormat(item?.like_count)}</Text>
                    </View>
                    <View style={[rootStyle.flex, { gap: 2 }]}>
                        <Image source={images.chat} style={rootStyle.default16} transition={100} />
                        <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >{numFormat(item?.reply_count)}</Text>
                    </View>
                    <View style={[rootStyle.flex, { gap: 2 }]}>
                        <Image source={images.bookmark} style={rootStyle.default16} transition={100} />
                        <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >{numFormat(bookmarkCount)}</Text>
                    </View>
                </View>

                <TouchableOpacity hitSlop={10} onPress={() => protectedRouter.callback(menuFunc)}>
                    <Image source={images.dot} style={rootStyle.default16} transition={100} />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingVertical: 12,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.f8f8f9,
            marginBottom: 14
        },
        tag: {
            height: 20,
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            backgroundColor: colors.f4f4f5,
            paddingHorizontal: 6
        }
    })

    return { styles }
}
