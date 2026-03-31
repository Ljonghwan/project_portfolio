import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView, ScrollViewProps } from 'react-native';

import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import dayjs from "dayjs";

import { FlashList } from "@shopify/flash-list";
import { KeyboardAwareScrollView, useKeyboardHandler } from "react-native-keyboard-controller";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import InputGuest from '@/components/InputGuest';
import InputComment from '@/components/InputComment';
import Empty from '@/components/Empty';
import Select from '@/components/Select';
import Report from '@/components/Report';

import Feed from '@/components/list/Feed';

import Manager from '@/components/badges/Manager';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert } from '@/libs/store';
import { ToastMessage, numFormat } from '@/libs/utils';

const RenderScrollComponent = React.forwardRef(
    (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />,
);

function Comment({ item, day, editFunc, deleteFunc }) {

    const { mbData } = useUser();
    const { styles } = useStyle();

    return (
        <>
            {day && (
                <View style={styles.dateBox}>
                    <Text style={styles.commentDate}>{dayjs(item?.createAt).format('YYYY-MM-DD')}</Text>
                </View>
            )}
                <View style={styles.comment}>
                    {item?.isBlock ? (
                        <>
                            <Image source={images.profile} style={[styles.commentProfile]} />
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={styles.commentContent}>차단된 사용자입니다.</Text>
                                <Text style={styles.commentDate}>{dayjs(item?.createAt).format('YYYY-MM-DD')}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Image source={item?.creator?.profile ? consts.s3Url + item?.creator?.profile : images.profile} style={[styles.commentProfile]} />
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={styles.commentName}>{item?.creator?.nickName}</Text>
                                <Text style={[styles.commentContent, { color: item?.status === 9 ? colors.grey9 : colors.grey6 }]}>{item?.status === 9 ? '삭제된 댓글입니다.' : item?.content}</Text>
                                <Text style={styles.commentDate}>{dayjs(item?.createAt).format('YYYY-MM-DD')}</Text>
                                {(item?.creator?.idx === mbData?.idx && item?.status === 1) && (
                                    <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                                        <TouchableOpacity style={styles.commentDelete} onPress={() => deleteFunc(item)}>
                                            <Text style={styles.commentDeleteText}>댓글 삭제</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            
                        </>
                    )}
                </View>

                
            
            {item?.children?.map((x, i) => {
                return (
                    <View key={`${item?.idx}_${i}`} style={[styles.comment, { paddingLeft: 40 }]}>
                        <Image source={x?.creator?.profile ? consts.s3Url + x?.creator?.profile : images.profile} style={[styles.commentProfile]} />
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.commentName}>{x?.creator?.nickName}</Text>
                            <Text style={styles.commentContent}>{x?.content}</Text>
                            <Text style={styles.commentDate}>{dayjs(x?.createAt).format('YYYY-MM-DD')}</Text>
                        </View>
                    </View>
                )
            })}
        </>
    )
}

export default function Page() {

    const router = useRouter();
    const { idx, title } = useLocalSearchParams();
    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { openAlertFunc } = useAlert();

    const commentRef = useRef(null);
    const lottieRef = useRef(null);

    const [item, setItem] = useState(null);
    const [list, setList] = useState(null);

    const [like, setLike] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const [input, setInput] = useState("");

    const [report, setReport] = useState(false);
    const [reportMode, setReportMode] = useState(null);

    const [load, setLoad] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침
    const [commentLoad, setCommentLoad] = useState(false);
    const [likeLoad, setLikeLoad] = useState(false);

    const viewables = useSharedValue([]);

    const keyboardHeight = useSharedValue(0);

    // 키보드 이벤트 처리
    useKeyboardHandler({
        onMove: (event) => {
            'worklet';
            keyboardHeight.value = withTiming(event.height, { duration: 0 });
        }
    });

    // 애니메이션 스타일 정의
    const animatedStyle = useAnimatedStyle(() => ({
        height: keyboardHeight.value,
    }));

    useFocusEffect(
        useCallback(() => {
            dataFunc()
        }, [idx])
    );
  

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);


    const dataFunc = async () => {

        let sender = {
            idx
        }
        const { data, error } = await API.post('/v1/manager/get', sender);
        const { data: list } = await API.post('/v1/manager/feedList', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);

        setLike(data?.isLike);
        setLikeCount(data?.likeCount || 0);

        if (data?.isLike) {
            lottieRef.current?.play(50, 50);
        } else {
            lottieRef.current?.play(0, 0);
        }

        setList(list || []);

        setTimeout(() => {
            setLoad(false);
            setReload(false);
            commentRef?.current?.scrollToEnd();
        }, consts.apiDelay);

    }


    const likeFunc = async () => {

        if (likeLoad) return;

        setLikeLoad(true);

        let sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/manager/like', sender);

        setLike(data);
        setLikeCount(prev => prev + (data ? 1 : -1))

        if (data) {
            lottieRef.current?.play(15, 50);
        } else {
            lottieRef.current?.play(0, 0);
        }

        setTimeout(() => {
            setLikeLoad(false);
        }, consts.apiDelayLong);

    }

    const sendFunc = async () => {

        Keyboard.dismiss();

        const inputReplace = input?.replace(/\s+/g, '');
        if (!input || inputReplace?.length < 1) {
            ToastMessage('메시지를 입력 해 주세요.');
            return;
        }

        setCommentLoad(true);

        let sender = {
            idx: item?.idx,
            content: input
        }

        const { data, error } = await API.post('/v1/manager/comment', sender);

        setTimeout(() => {

            setCommentLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            setInput("");
            dataFunc();

        }, consts.apiDelayLong);

    }


    const reportStart = (type) => {
        console.log('type', type);
        if (type?.value === 1) {
            // 게시물 신고
            setReport(!report);
            setReportMode(type?.data || null);
            console.log('type?.data', type?.data);
           
        } else if (type?.value === 2) {
            openAlertFunc({
                icon: images.warning,
                label: type?.data ?  `해당 유저를 차단 하시겠습니까?` : `해당 매니저를 차단 하시겠습니까?`,
                onCencleText: "취소",
                onPressText: "차단하기",
                onCencle: () => { },
                onPress: async () => {

                    let sender = {
                        type: type?.data ? 'user' : 'manager',
                        idx: type?.data ? type?.data?.creator?.idx : item?.idx
                    };
                    console.log('sender', sender);
                    
                    const { data, error } = await API.post('/v1/block/insert', sender);

                    if (error) {
                        ToastMessage(error?.message);
                        return;
                    }

                    ToastMessage('차단되었습니다.');

                    if(type?.data) {
                        dataFunc();
                    } else {
                        router.back();
                    }

                }
            })
        }
    }

    const reportFunc = async ({ optionIdx, desc }) => {

        setReport(false);

        let sender = {
            idx: reportMode ? reportMode?.idx : item?.idx,
            optionIdx: optionIdx,
            desc: desc
        };
        console.log('reportMode', reportMode);
        console.log('sender', sender);

        const { data, error } = await API.post(reportMode ? '/v1/feed/reportComment' : '/v1/feed/report', sender);

        setTimeout(() => {

            setReportMode(null);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('신고되었습니다.');

        }, consts.apiDelay);

        // openAlertFunc({
        //     alertType: 'Sheet',
        //     component: <Report />,
        //     detached: true,

        // })
    }

    const editFunc = (item) => {
        console.log('item', item);
    }

    const deleteFunc = (item) => {
        openAlertFunc({
            icon: images.warning,
            label: `댓글을 삭제하시겠습니까?`,
            onCencleText: "취소",
            onPressText: "삭제하기",
            onCencle: () => { },
            onPress: async () => {

                let sender = {
                    idx: item?.idx
                };

                const { data, error } = await API.post('/v1/manager/delComment', sender);

                if (error) {
                    ToastMessage(error?.message);
                    return;
                }

                ToastMessage('삭제되었습니다.');
                dataFunc();
            }
        })
    }

    const renderItem = ({ item, index }) => {
        return (
            <Feed item={item} index={index}  />
        );
    };


    const header = {
        title: '매니저 프로필',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        },
        right: {
            component: (
                <Select
                    // ref={(ref) => (inputRefs.current.type = ref)}
                    setState={(v) => {
                        reportStart({ value: v });
                    }}
                    list={consts.reportOptions?.filter(x => x?.value === 2)}
                >
                    <Image source={images.more} style={rootStyle.default} />
                </Select>
            )
        }
    };

    return (
        <Layout header={header}>
            <View style={{ flex: 1 }}>
                {load && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}
                
                <FlashList
                    renderScrollComponent={RenderScrollComponent}
                    bottomOffset={50}
                    keyboardShouldPersistTaps={"handled"}

                    data={list}
                    renderItem={renderItem}
                    numColumns={2}
                    refreshing={reload}

                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 10,
                        paddingBottom: insets?.bottom + 20,
                    }}
                    nestedScrollEnabled={true}

                    ListHeaderComponent={
                        <View style={{ gap: 17, marginBottom: 24, paddingHorizontal: rootStyle.side }}>
                            <View style={styles.titleBox}>
                                <View style={[rootStyle.flex, { gap: 8 }]}>
                                    <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.profile} />
                                    <View style={{ flex: 1, gap: 2}}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>{item?.nickName}</Text>
                                        <Manager level={item?.type} />
                                    </View>
                                </View>

                                <Text style={styles.itemContent} >{item?.memo}</Text>

                                <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 8 }]}>
                                    <View style={[rootStyle.flex, { gap: 4 }]}>
                                        <Image source={images.document} style={rootStyle.default20} />
                                        <Text style={styles.count}>{numFormat(item?.feedCount)}</Text>
                                    </View>

                                    <TouchableOpacity style={[rootStyle.flex, { gap: 4, paddingLeft: 25 }]} activeOpacity={0.7} onPress={likeFunc} >
                                        <LottieView
                                            ref={lottieRef}
                                            source={images.lottie_like}
                                            autoPlay={false}
                                            loop={false}
                                            style={styles.lottie}
                                            resizeMode={'cover'}
                                            // onAnimationFailure={(err) => {
                                            //     lottieRef?.current?.reset()
                                            // }}
                                            onAnimationFinish={() => {
                                                // lottieRef?.current?.reset()
                                            }}
                                        />
                                        {/* <Image source={like ? images.heart_on : images.heart_off} style={rootStyle.default20} /> */}
                                        <Text style={styles.count}>{numFormat(likeCount)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.container, { gap: 12 }]}>
                                <Text style={styles.itemTitle}>케미라인</Text>
                                <View style={styles.commentContainer}>
                                    {item?.comments?.length < 1 ? (
                                        <Empty msg={'케미라인이 없습니다.'} style={styles.commentList} />
                                    ) : (
                                        <ScrollView
                                            ref={commentRef}
                                            style={styles.commentList}
                                            contentContainerStyle={{ gap: 20, paddingHorizontal: 12, paddingVertical: 20 }}
                                            nestedScrollEnabled={true}
                                        >
                                            {item?.comments?.map((x, i) => {
                                                let curDay = dayjs(x?.createAt).format("YYYY-MM-DD");
                                                let prevDay = item?.comments?.[i - 1]?.createAt ? dayjs(item?.comments?.[i - 1]?.createAt).format("YYYY-MM-DD") : null;

                                                return (
                                                    <Comment key={i} item={x} day={ prevDay !== curDay } deleteFunc={deleteFunc} />
                                                )
                                            })}
                                        </ScrollView>
                                    )}

                                    <View>
                                        {commentLoad && <Loading style={{ paddingBottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)' }} color={colors.dark} fixed />}

                                        <View style={styles.commentInput}>
                                            <InputComment
                                                style={{ paddingHorizontal: 10, paddingBottom: 12 }}
                                                name={'input'}
                                                state={input}
                                                setState={setInput}
                                                placeholder={`댓글을 작성해 주세요.`}
                                                sendMessage={sendFunc}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                />
            </View>

            <Report view={report} mode={reportMode} handleClose={() => setReport(false)} onSubmit={reportFunc} />
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        container: {
        },

        titleBox: {
            gap: 5,
        },
        profile: {
            width: 48,
            height: 48,
            borderRadius: 100,
            backgroundColor: colors.placeholder
        },
        itemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.dark,
            letterSpacing: -0.63
        },
        itemContent: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            letterSpacing: -0.35
        },
        itemDate: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.6
        },
        count: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.3
        },


        commentContainer: {
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: 20,
            overflow: 'hidden'
        },
        commentList: {
            height: 300,
            backgroundColor: colors.inputBg
        },
        commentInput: {
            borderTopWidth: 1,
            borderTopColor: colors.primary
        },
        comment: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8
        },
        commentProfile: {
            width: 32,
            height: 32,
            borderRadius: 100
        },
        commentName: {
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            letterSpacing: -0.35
        },
        commentContent: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            letterSpacing: -0.35
        },
        commentDate: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.3
        },
        dateBox: {
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            height: 32,
            borderRadius: 100,
            backgroundColor: colors.greyF1,
        },
        commentDelete: {
            paddingHorizontal: 12,
            height: 30,
            borderRadius: 8,
            backgroundColor: colors.inputBorder,
            alignItems: 'center',
            justifyContent: 'center',
        },
        commentDeleteText: {
            fontSize: 12,
            lineHeight: 16,
            fontFamily: fonts.semiBold,
            color: colors.primary12,
            letterSpacing: -0.3
        },



        feedList: {
            flexDirection: 'row',
            gap: 8,
            rowGap: 20,
            flexWrap: 'wrap',
            paddingBottom: insets?.bottom || 20
        },

        lottie: {
            position: 'absolute',
            left: -15,
            // backgroundColor: 'rgba(0, 0, 0, 0.2)',
            width: 50,
            height: 100
        }
    })

    return { styles }
}