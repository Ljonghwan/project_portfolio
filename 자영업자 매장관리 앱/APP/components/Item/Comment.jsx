import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity,
    Keyboard
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from 'dayjs';

import Text from '@/components/Text';

import Tag from '@/components/Ui/Tag';

import BoardMenu from '@/components/Popup/BoardMenu';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { getFullDateFormat, numFormat, ToastMessage } from '@/libs/utils';

import { useUser, useConfig, useAlert, useAlertSheet, useLoader } from '@/libs/store';


function Item({
    style,
    item,
    dataFunc = () => { },
    setReply = () => { }
}) {

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { openAlertFunc: openAlertSheetFunc, closeAlertFunc } = useAlertSheet();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const [like, setLike] = useState(item?.isLike || false);
    const [likeCount, setLikeCount] = useState(item?.like_count || 0);

    useEffect(() => {

        setLike(item?.isLike || false);
        setLikeCount(item?.like_count || 0);

    }, [item])

    const likeFunc = async () => {

        const sender = {
            idx: item?.idx,
            type: 2
        }
        const { data, error } = await API.post('/v1/action/like', sender);

        setLike(data?.status);
        setLikeCount(prev => prev + (data?.status ? 1 : -1));
    }

    const menuFunc = () => {
        openAlertSheetFunc({
            alertType: 'Sheet',
            backgroundStyle: { backgroundColor: colors.transparent },
            component: <BoardMenu item={item} target={'comment'} handleRemove={() => dataFunc()} />
        })
    }


    const commentFunc = async () => {
        setReply({ idx: item?.parent_idx || item?.idx, nickname: item?.user?.nickname });
    }

    return (
        <View style={[styles.root, style]} >
            <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'space-between' }]}>
                <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'flex-start' }]}>
                    <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={{ width: 24, aspectRatio: 1 / 1, borderRadius: 1000, backgroundColor: colors.placeholder }} />
                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.user?.nickname}</Text>
                    {item?.user?.badge && <Tag type={'badge'} tag={configOptions?.badges?.find(x => x?.idx === item?.user?.badge)?.label} />}
                    <View style={{ width: 2, height: 2, borderRadius: 1000, backgroundColor: colors.text7F8287 }} />
                    <Text style={{ ...rootStyle.font(10, colors.text7F8287, fonts.medium) }}>{getFullDateFormat(item?.createdAt)}</Text>
                </View>
            </View>

            {/* <Text style={{ ...rootStyle.font(14, colors.black, fonts.semiBold) }} numberOfLines={1} >{item?.title}</Text> */}
            <View style={{ paddingLeft: 28, gap: 8 }}>
                <Text style={{ ...rootStyle.font(13, (item?.deleteAt || item?.isBlock) ? colors.textSecondary : colors.black), lineHeight: 19 }} >{item?.comment}</Text>
                {item?.emoji && (
                    <Image source={consts.s3Url + configOptions?.emoji?.find(x => x?.idx === item?.emoji)?.image} style={{ width: 100, aspectRatio: 1 / 1 }} />
                )}

                {(!item?.deleteAt && !item?.isBlock) && (
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                            <TouchableOpacity style={[rootStyle.flex, { gap: 2 }]} activeOpacity={0.7} onPress={likeFunc} hitSlop={5}>
                                <Image source={like ? images.like_on : images.like} style={rootStyle.default16} transition={100} />
                                <Text style={{ ...rootStyle.font(12, like ? colors.primaryBright : colors.text686B70, fonts.medium) }} >{numFormat(likeCount)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[rootStyle.flex, { gap: 2 }]} activeOpacity={0.7} onPress={commentFunc} hitSlop={5}>
                                <Image source={images.chat} style={rootStyle.default16} transition={100} />
                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >답글쓰기</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity hitSlop={10} onPress={menuFunc}>
                            <Image source={mbData?.idx === item?.user_idx ? images.trash : images.report} style={rootStyle.default16} transition={100} />
                        </TouchableOpacity>
                        {/* <TouchableOpacity hitSlop={10} onPress={onDeleteAlert}>
                            <Image source={images.trash} style={rootStyle.default16} transition={100} />
                        </TouchableOpacity> */}
                    </View>
                )}

            </View>
        </View>
    );
}


export default function Component({
    style,
    item,
    dataFunc = () => { },
    setReply = () => { }
}) {

    const { styles } = useStyle();

    return (
        <View>
            <Item style={style} item={item} dataFunc={dataFunc} setReply={setReply} />
            {item?.child?.map((x, i) => {
                return (
                    <Item key={i} style={{ paddingLeft: 48, }} item={x} dataFunc={dataFunc} setReply={setReply} />
                )
            })}
        </View>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            marginHorizontal: 15,
            paddingVertical: 12,
            paddingHorizontal: 20,
            gap: 4,
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
