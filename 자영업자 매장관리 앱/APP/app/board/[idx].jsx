import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate, useSharedValue } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Carousel from '@/components/Carousel';


import BoardView from '@/components/Ui/BoardView';
import Tag from '@/components/Ui/Tag';
import InputComment from '@/components/Ui/InputComment';
import EmojiBottomSheet from '@/components/Ui/EmojiBottomSheet';

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
    const { width } = useSafeAreaFrame();

    const { idx, route } = useLocalSearchParams();

    const { mbData } = useUser();
    const { store } = useStore();

    const { openAlertFunc: openAlertSheetFunc } = useAlertSheet();

    const { configOptions } = useConfig();

    const inputRef = useRef(null);
    const scRef = useRef(null);

    const emojiSheetRef = useRef(null);
    const emojiSheetPosition = useSharedValue(0);

    const [item, setItem] = useState(null);
    const [bookmark, setBookmark] = useState(false);
    const [like, setLike] = useState(false);

    const [comments, setComments] = useState([]);
    const [votes, setVotes] = useState([]);

    const [myVote, setMyVote] = useState(null);

    const [reply, setReply] = useState(null);

    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiSelected, setEmojiSelected] = useState(null);

    const [load, setLoad] = useState(true);
	const [reload, setReload] = useState(false); // 새로고침
    const [voteLoad, setVoteLoad] = useState(false); // 투표 로딩

    const { dismiss, dismissAll } = useBottomSheetModal();


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
        const { data, error } = await API.post('/v1/board/get', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data?.item);

        setBookmark(Boolean(data?.item?.isBookmark));
        setLike(data?.item?.isLike);

        setComments(data?.replys || []);

        setVotes(data?.votes || []);
        setMyVote(data?.myVote || null);
        // setComments([]);

        setTimeout(() => {
            setLoad(false);
            setReload(false);

            if (scroll) {
                scRef.current?.scrollToIndex({
                    index: 0,
                    animated: true
                })
            }
        }, consts.apiDelay);

    }

    const bookMarkFunc = async () => {
        const sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/action/bookmark', sender);

        setBookmark(data?.status);
        setItem(prev => ({...prev, bookmark_count: prev?.bookmark_count + (data?.status ? 1 : -1) }))
    }

    const likeFunc = async () => {

        const sender = {
            idx: item?.idx,
            type: 1
        }
        const { data, error } = await API.post('/v1/action/like', sender);

        setLike(data?.status);
        setItem(prev => ({...prev, like_count: prev?.like_count + (data?.status ? 1 : -1) }))
    }

    const renderItem = ({ item, index }) => {

        return (
            <Comment item={item} dataFunc={dataFunc} setReply={setReply} />
        );
    };

    const menuFunc = () => {
        openAlertSheetFunc({
            alertType: 'Sheet',
            backgroundStyle: { backgroundColor: colors.transparent },
            component: <BoardMenu item={item} handleRemove={() => {
                router.dismissTo({
                    pathname: route || routes.talk,
                    params: {
                        removeIdx: item?.idx
                    }
                })
            }} />
        })
    }

    const voteFunc = async (idx) => {
        console.log('idx', idx);
        if(voteLoad) return;

        if(idx !== myVote) setVoteLoad(true);

        let sender = {
            idx: idx,
            board_idx: item?.idx
        }
        const { data, error } = await API.post('/v1/action/vote', sender);

        if (error) {
            ToastMessage(error?.message);
        }

        console.red('data', data?.votes);
        console.red('data', data);

        setTimeout(() => {
            setVotes(data?.votes || []);
            setMyVote(data?.status || null);

            setVoteLoad(false);
        }, idx === myVote ? 0 : consts.apiDelay);
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '커뮤니티',
    };

    return (
        <Layout header={header} >
            {load && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                // contentContainerStyle={{ flex: 1 }}
                // behavior={Platform.OS === 'ios' ? "translate-with-padding" : "translate-with-padding"}
                // keyboardVerticalOffset={headerHeight}
                behavior={"padding"}
                // keyboardVerticalOffset={insets?.bottom + 30 }
                keyboardVerticalOffset={(insets?.top + rootStyle.header.height) - (insets?.bottom)}
            >
                <View style={{ flex: 1 }}>
                    <FlashList
                        ref={scRef}
                        data={comments}
                        keyExtractor={({ item }) => item?.idx}
                        renderItem={renderItem}
                        refreshing={reload}
                        removeClippedSubviews
                        onRefresh={() => {
                            setReload(true);
                        }}
                        numColumns={1}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingBottom: 20,
                        }}
                        // keyboardDismissMode={'on-drag'}
                        keyboardShouldPersistTaps={"never"}

                        ListHeaderComponent={
                            <View style={{ paddingHorizontal: 35, marginBottom: 15 }}>
                                <View style={{
                                    gap: 8,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.f8f8f9,
                                    paddingBottom: 12
                                }}>
                                    <Tag type={'board'} tag={configOptions?.boardCategory?.find(x => x?.idx === item?.cate)?.title} />
                                    <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'space-between' }]}>
                                        <View style={[rootStyle.flex, { flex: 1, gap: 4, justifyContent: 'flex-start' }]}>
                                            <Image source={consts.s3Url + item?.user?.profile} style={{ width: 32, aspectRatio: 1 / 1, borderRadius: 1000 }} placeholder={images.profile} placeholderContentFit={'cover'} />
                                            <Text style={{ ...rootStyle.font(16, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.user?.nickname}</Text>
                                            {item?.user?.badge && <Tag type={'badge'} tag={configOptions?.badges?.find(x => x?.idx === item?.user?.badge)?.label} />}
                                            <View style={{ width: 2, height: 2, borderRadius: 1000, backgroundColor: colors.text7F8287 }} />
                                            <Text style={{ ...rootStyle.font(11, colors.text7F8287, fonts.medium) }}>{getFullDateFormat(item?.createdAt)}</Text>
                                        </View>
                                        <TouchableOpacity hitSlop={10} onPress={bookMarkFunc}>
                                            <Image source={bookmark ? images.bookmark_on : images.bookmark_off} style={rootStyle.default} transition={100} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={{ ...rootStyle.font(14, colors.black, fonts.semiBold) }} numberOfLines={1} >{item?.title}</Text>

                                    {item?.comment && (
                                        <View style={{ flex: 1 }}>
                                            <BoardView content={item?.comment} />
                                        </View>
                                    )}

                                    {/* <Carousel list={item?.image} /> */}

                                    <View style={{ paddingVertical: 4, gap: 4 }}>

                                        {item?.image?.map((x, i) => {
                                            return (
                                                <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => {
                                                    imageViewer({ index: i, list: item?.image?.map(x => consts.s3Url + x) })
                                                }}>
                                                    <Image source={consts.s3Url + x} style={{ width: '100%', aspectRatio: 1 / 1, borderRadius: 12 }}></Image>
                                                </TouchableOpacity>
                                            )
                                        })}
                                        
                                    </View>

                                    {votes?.length > 0 && (
                                        <View style={{ gap: 4, marginTop: 20, marginBottom: 20 }}>

                                            {voteLoad && <Loading color={colors.black} style={{ backgroundColor: colors.dimWhite, paddingBottom: 0 }} fixed />}

                                            {votes?.map((x, i) => {
                                                const per = x?.count / votes?.reduce((acc, curr) => acc + curr?.count, 0) * 100;

                                                return (
                                                    <TouchableOpacity key={i} style={[
                                                        styles.vote, 
                                                            { 
                                                                backgroundColor: !myVote ? colors.f4f4f5 : colors.white,
                                                                borderColor: !myVote ? colors.f4f4f5 : myVote === x?.idx ? colors.onboardingBg : colors.f4f4f5,
                                                            }
                                                        ]} 
                                                        activeOpacity={0.7} 
                                                        onPress={() => {
                                                            voteFunc(x?.idx)
                                                        }}
                                                    >
                                                        {myVote && (
                                                            <View style={[
                                                                styles.voteBar, 
                                                                { 
                                                                    backgroundColor: myVote === x?.idx ? colors.onboardingBg : colors.f4f4f5, 
                                                                    width: `${per}%` 
                                                                }
                                                            ]} />
                                                        )}
                                                        <View style={[rootStyle.flex, { gap: 5, paddingHorizontal: 12, justifyContent: 'space-between' }]}>
                                                            <View style={[rootStyle.flex, { gap: 2, flex: 1, justifyContent: 'flex-start' }]}>
                                                                <Text style={{ ...rootStyle.font(width <= 320 ? 12 :14, myVote === x?.idx ? colors.orange : colors.text686B70, myVote === x?.idx ? fonts.semiBold : fonts.regular), flexShrink: 1 }} numberOfLines={1} >{i+1}. {x?.title}</Text>
                                                            </View>

                                                            {myVote ? (
                                                                <Text style={{ ...rootStyle.font(14, myVote === x?.idx ? colors.orange : colors.text686B70, myVote === x?.idx ? fonts.semiBold : fonts.regular) }} >{numFormat(per.toFixed(1))}%</Text>
                                                            ) : (
                                                                <Image source={images.vote_off} style={rootStyle.default18} transition={100} />
                                                            )}
                                                                
                                                        </View>
                                                    </TouchableOpacity>
                                                )
                                            })}

                                            <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.regular), marginTop: 4 }} >{numFormat(votes?.reduce((acc, curr) => acc + curr?.count, 0))}명 참여</Text>
                                        </View>
                                    )}

                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <View style={[rootStyle.flex, { gap: 10, justifyContent: 'flex-start' }]}>
                                            <TouchableOpacity style={styles.like} activeOpacity={0.7} onPress={likeFunc}>
                                                <Text style={{ ...rootStyle.font(13, colors.primary, fonts.medium) }} >좋아요 {numFormat(item?.like_count)}</Text>
                                                <Image source={images.like_on} style={rootStyle.default14} transition={100} />
                                            </TouchableOpacity>
                                            <View style={[rootStyle.flex, { gap: 2 }]}>
                                                <Image source={images.chat} style={rootStyle.default16} transition={100} />
                                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >{numFormat(item?.reply_count)}</Text>
                                            </View>
                                            <View style={[rootStyle.flex, { gap: 2 }]}>
                                                <Image source={images.bookmark} style={rootStyle.default16} transition={100} />
                                                <Text style={{ ...rootStyle.font(12, colors.text686B70, fonts.medium) }} >{numFormat(item?.bookmark_count)}</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity hitSlop={10} onPress={menuFunc}>
                                            <Image source={images.dot} style={rootStyle.default16} transition={100} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        }

                        ListEmptyComponent={
                            <Empty msg={'댓글이 없습니다.'} style={{ paddingBottom: 0, height: 200 }} />
                        }
                    />
                </View>

                <InputComment
                    iref={inputRef}
                    idx={item?.idx}
                    reply={reply}
                    setReply={setReply}
                    dataFunc={dataFunc}
                    emoji={emojiSelected}
                    setEmoji={setEmojiSelected}
                    emojiOpen={() => {
                        emojiSheetRef?.current?.present();
                        Keyboard.dismiss();
                    }}
                />
            </KeyboardAvoidingView>

            
            <EmojiBottomSheet
                sheetRef={emojiSheetRef}
                sheetPosition={emojiSheetPosition}
                setEmoji={(v) => {
                    setEmojiSelected(v);
                    dismissAll();
                    setTimeout(() => {
                        inputRef?.current?.focus();
                    }, 400)
                }}
            />
            
        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({

        like: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.fff6f0,
            borderWidth: 1,
            borderColor: colors.onboardingBg,
            paddingHorizontal: 12
        },

        vote: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 44,
            borderRadius: 8,
            backgroundColor: colors.fff6f0,
            borderWidth: 2,
            borderColor: colors.fff6f0,
            overflow: 'hidden'
        },
        voteBar: {
            position: 'absolute',
            height: '100%',
            backgroundColor: colors.onboardingBg,
        }
    })

    return { styles }
}
