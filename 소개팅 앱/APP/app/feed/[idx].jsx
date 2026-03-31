import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, ScrollView, Platform, RefreshControl, FlatList } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useKeyboardAnimation, KeyboardStickyView, KeyboardAwareScrollView, KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import InputComment from '@/components/InputComment';
import Empty from '@/components/Empty';
import Filter from '@/components/Filter';
import LikeButton from '@/components/LikeButton';
import AutoHeightImage from '@/components/AutoHeightImage';
import Report from '@/components/Report';

import Select from '@/components/Select';

import Comment from '@/components/list/Comment';

import Manager from '@/components/badges/Manager';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

import API from '@/libs/api';
import { useUser, useAlert } from '@/libs/store';

import { ToastMessage, numFormat } from '@/libs/utils';

export default function Page() {

    const insets = useSafeAreaInsets();

    const router = useRouter();
    const { idx } = useLocalSearchParams();
    const { styles } = useStyle();

    const { openAlertFunc } = useAlert();

    const commentRef = useRef(null);
    const inputRef = useRef(null);
    const lottieRef = useRef(null);

    const [item, setItem] = useState(null);

    const [like, setLike] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const [input, setInput] = useState("");
    const [edit, setEdit] = useState(null);

    const [report, setReport] = useState(false);
    const [reportMode, setReportMode] = useState(null);

    const [load, setLoad] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침
    const [commentLoad, setCommentLoad] = useState(false);

    useEffect(() => {

        dataFunc()

    }, [idx]);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reload, comment) => {

        try {
            let sender = {
                idx: idx,
                reload: reload
            }
            
            const { data, error } = await API.post('/v1/feed/get', sender);

            if (error) {
                ToastMessage(error?.message);
                router.back();
                return;
            }

            console.log('data', data?.creator);

            setItem(data);
            setLike(data?.isLike);
            setLikeCount(data?.likes?.length || 0);

            setTimeout(() => {
                setLoad(false);
                setReload(false);

                if (comment) commentRef?.current?.scrollToEnd();
            }, consts.apiDelay);
        } catch (error) {
            console.log('error', error);
        }


    }

    const likeFunc = async () => {

        let sender = {
            idx: item?.idx
        }

        const { data, error } = await API.post('/v1/feed/like', sender);

        setLike(data);
        setLikeCount(prev => prev + (data ? 1 : -1))

    }

    const sendFunc = async () => {

        Keyboard.dismiss();

        const inputReplace = input?.replace(/\s+/g, '');
        if (!input || inputReplace?.length < 1) {
            ToastMessage('메시지를 입력 해 주세요.');
            return;
        }

        if (commentLoad) return;

        setCommentLoad(true);

        let sender = {
            idx: edit ? edit?.idx : item?.idx,
            content: input
        };

        const { data, error } = await API.post(edit ? '/v1/feed/editComment' : '/v1/feed/comment', sender);
        
        setTimeout(() => {

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            setCommentLoad(false);
            setInput("");
            setEdit(null);
            dataFunc(true, true);

        }, consts.apiDelay);

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
                        idx: type?.data ? type?.data?.creator?.idx : item?.creator?.idx
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


        // openAlertFunc({
        //     alertType: 'Sheet',
        //     component: <Report />,
        //     detached: true,

        // })
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

    const deleteAlert = (item) => {
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

                const { data, error } = await API.post('/v1/feed/delComment', sender);

                if (error) {
                    ToastMessage(error?.message);
                    return;
                }

                ToastMessage('삭제되었습니다.');
                dataFunc(true);

            }
        })
    }

    const editFunc = (item) => {
        setEdit(item);
        setInput(item?.content);
        inputRef?.current?.focus();
    }

    const editCencle = () => {
        setEdit(null);
        setInput("");
        Keyboard.dismiss();
    }

    const renderItem = ({ item, index }) => {
        return (
            <Comment item={item} editFunc={editFunc} deleteAlert={deleteAlert} reportStart={reportStart} />
        );
    };


    const header = {
        title: '매니저 피드',
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
                    list={consts.reportOptions}
                >
                    <Image source={images.more} style={rootStyle.default} />
                </Select>
            )
        }
    };

    const headerHeight = (insets?.top + rootStyle.header.height) - (insets?.bottom);

    return (
        <Layout header={header}>

            {load && (<Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />)}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={'padding'}
                keyboardVerticalOffset={headerHeight}
                enabled={!report}
            >

                <FlatList
                    // refreshControl={
                    //     <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                    // }
                    // renderScrollComponent={(props) => (
                    //     <KeyboardAwareScrollView {...props} />
                    // )}
                    keyExtractor={(item, index) => item?.idx}
                    keyboardShouldPersistTaps={"never"}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    ref={commentRef}
                    data={item?.comments || []}
                    renderItem={renderItem}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: 20,
                    }}
                    ListHeaderComponent={
                        <View style={{ gap: 20 }}>
                            <View style={{ paddingHorizontal: rootStyle.side, paddingVertical: 10, gap: 12 }}>
                                <TouchableOpacity style={styles.titleBox} onPress={() => {
                                    router.dismissTo({
                                        pathname: routes.managerDetail,
                                        params: {
                                            idx: item?.creator?.idx,
                                            title: item?.creator?.nickName
                                        }
                                    });
                                }}>
                                    <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', gap: 8 }]}>
                                        <Image source={item?.creator?.profile ? consts.s3Url + item?.creator?.profile : images.profile} style={styles.profile} />
                                        <View style={{ flex: 1, gap: 2 }}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>{item?.creator?.nickName || '매니저'} {item?.creator?.level}</Text>
                                            <Manager level={item?.creator?.type} />
                                        </View>
                                    </View>
                                    {/* <Filter list={consts.reportOptions} onPress={reportStart} /> */}
                                </TouchableOpacity>
                                <View style={{ gap: 4 }}>
                                    <Text style={styles.itemContent}>{item?.title}</Text>

                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 8 }]}>
                                        <View style={[rootStyle.flex, { gap: 3 }]}>
                                            <Image source={images.heart_off} style={rootStyle.default20} />
                                            <Text style={styles.count}>{numFormat(likeCount)}</Text>
                                        </View>
                                        <View style={[rootStyle.flex, { gap: 3 }]}>
                                            <Image source={images.chat} style={rootStyle.default20} />
                                            <Text style={styles.count}>{numFormat(item?.comments?.length)}</Text>
                                        </View>
                                        <View style={[rootStyle.flex, { gap: 3 }]}>
                                            <Image source={images.view_gray} style={rootStyle.default20} />
                                            <Text style={styles.count}>{numFormat(item?.view)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ gap: 8 }}>
                                {item?.photoList?.map((x, i) => {
                                    return (
                                        <AutoHeightImage key={i} source={consts.s3Url + x} />
                                    )
                                })}
                            </View>

                            <View style={{ paddingHorizontal: 20, gap: 20 }}>
                                <Text style={styles.itemContent}>{item?.content}</Text>
                                <LikeButton active={like} onPress={likeFunc} count={likeCount} />
                            </View>

                            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                                <Text style={styles.itemContent}>댓글 <Text style={[styles.itemContent, { fontFamily: fonts.semiBold }]}>{numFormat(item?.comments?.length)}</Text></Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty style={{ height: 200 }} msg={'댓글이 없습니다.'} />
                    }
                />

                <View style={styles.bottomBox}>
                    <InputComment
                        iref={inputRef}
                        edit={edit}
                        editCencle={editCencle}
                        name={'input'}
                        state={input}
                        setState={setInput}
                        placeholder={`댓글을 작성해 주세요.`}
                        sendMessage={sendFunc}
                        load={commentLoad}
                    />
                </View>
            </KeyboardAvoidingView>

            {/* <KeyboardStickyView style={[{ width: '100%' }]} offset={{ closed: 0, opened: insets?.bottom }}> */}

            {/* </KeyboardStickyView> */}

            <Report view={report} mode={reportMode} handleClose={() => setReport(false)} onSubmit={reportFunc} />

            {/* <View style={styles.lottie} pointerEvents={'none'}>
                <LottieView
                    ref={lottieRef}
                    source={images.lottie_like}
                    autoPlay={false}
                    loop={false}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={'cover'}
                    // onAnimationFailure={(err) => {
                    //     lottieRef?.current?.reset()
                    // }}
                    // onAnimationFinish={() => {
                    //     lottieRef?.current?.reset()
                    // }}
                />
            </View> */}
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        container: {
            paddingHorizontal: 20
        },

        titleBox: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        profile: {
            width: 48,
            height: 48,
            borderRadius: 100
        },
        itemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            letterSpacing: -0.4,
            flexShrink: 1
        },
        itemContent: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
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
        bottomBox: {
            // padding: 12,
            // paddingBottom: insets?.bottom,
            // borderTopWidth: 1,
            // borderTopColor: colors.greyE,
        },

        lottie: {
            ...StyleSheet.absoluteFill,
            flex: 1,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            backgroundColor: 'transparent',
            pointerEvents: 'none', // 터치 통과
        },
    })

    return { styles }
}