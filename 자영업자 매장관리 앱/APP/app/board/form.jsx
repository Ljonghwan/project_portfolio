import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import Animated, { useSharedValue, FadeIn } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import {
    RichEditor,
} from 'react-native-pell-rich-editor';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from "react-native-draggable-flatlist"

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import TextInput from '@/components/TextInput';
import AutoHeightImage from '@/components/AutoHeightImage';
import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';


import Emoji from '@/components/Ui/Emoji';
import PhotoSelect from '@/components/Ui/PhotoSelect';
import BoardCategory from '@/components/Popup/BoardCategory';


import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, convertImageUrlToBase64, numFormat, stripHtml } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useAlertSheet, usePhotoPopup, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const { idx } = useLocalSearchParams();

    const { mbData } = useUser();
    const { store } = useStore();

    const { openAlertFunc: openAlertSheetFunc } = useAlertSheet();
    const { openPhotoFunc } = usePhotoPopup();
    const { openLoader, closeLoader } = useLoader();

    const { configOptions } = useConfig();

    const inputRefs = useRef({});
    const titleRefs = useRef([]);

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const scrollRef = useRef(null);
    const richText = useRef(null);

    const [item, setItem] = useState({});
    const [desc, setDesc] = useState("");

    const [photo, setPhoto] = useState([]);
    const [selectPhoto, setSelectPhoto] = useState(null);

    const [vote, setVote] = useState([]);

    const [mode, setMode] = useState(null);
    const [enabled, setEnabled] = useState(false);

    const [load, setLoad] = useState(true);

    useEffect(() => {

        if (idx) {
            dataFunc()
        } else {
            setLoad(false)
        }


    }, [idx]);
    
    useEffect(() => {
        console.red('vote', vote);
    }, [vote]);

    const dataFunc = async () => {

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
        setPhoto(data?.item?.image || []);
        setVote(data?.votes || []);

        setTimeout(() => {
            setDesc(data?.item?.comment);
            richText?.current?.setContentHTML(data?.item?.comment);

            setTimeout(() => {
                setLoad(false);
            }, consts.apiDelay);
        }, 200)
    }

    const onSubmitAlert = async () => {
        Keyboard.dismiss();
        richText.current?.blurContentEditor();

        if (!item?.title || item?.title?.trim()?.length < 1) {
            ToastMessage('제목을 입력해주세요.');
            return;
        }

        const plainText = stripHtml(desc);
        const length = plainText?.length;

        if (length < 1) {
            ToastMessage('내용을 입력해주세요.');
            return;
        }

        if (length > 2000) {
            ToastMessage('최대 2,000자 까지 입력 가능합니다.');
            return;
        }

        if(vote?.length > 0 && vote?.filter(x => x?.title?.trim()?.length < 1)?.length > 0) {
            ToastMessage('투표 항목을 입력해주세요.');
            return;
        }
        if(vote?.length === 1) {
            ToastMessage('2개 이상의 항목을 추가해주세요.');
            return;
        }

        if (!item?.idx) {
            sheetRef.current?.present();
        } else {
            onSubmit(item?.cate)
        }

    }

    const onSubmit = async (cate) => {

        sheetRef.current?.dismiss();
        openLoader();

        let sender = {
            idx: item?.idx,
            cate: cate,
            title: item?.title,
            comment: desc,
            image: photo,
            vote: vote
        }

        const { data, error } = await API.post('/v1/board/update', sender);

        setTimeout(() => {

            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage("등록되었습니다.");

            router.dismissTo({
                pathname: routes.boardView,
                params: {
                    idx: data
                }
            })

        }, consts.apiDelay);
    }

    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const photoFunc = async (index) => {
        if(typeof(index) === 'number') {
            openPhotoFunc({
                maxFileSize: consts.maxImageSize,
                setPhoto: (v) => {
                    if(!v) {
                        setPhoto(prev => prev?.filter((x, i) => i !== index));
                    } else {
                        setPhoto(prev => prev?.map((x, i) => {
                            if(i !== index) return x;
                            return v?.[0]
                        }))
                    }
                    
                },
                deleteButton: true
            })
        } else {
            openPhotoFunc({
                selectionLimit: 5 - photo?.length,
                maxFileSize: consts.maxImageSize,
                setPhoto: (v) => {
                    setPhoto(prev => [...prev, ...v]);
                }
            })
        }
        

        Keyboard.dismiss();
        richText.current?.blurContentEditor();

        // await KeyboardController.dismiss({ animated: false });
    }

    const photoDelete = (index) => {

        openPhotoFunc({
            deleteButton: true,
            deleteOnly: true,
            setPhoto: (v) => {
                setPhoto(prev => prev?.filter((x, i) => i !== index));
            }
        })
    }

    const emojiFunc = async (v) => {
        // let base = await convertImageUrlToBase64(v);
        // if (!base) return;

        richText.current?.insertImage(
            v,
            'width: 33.33%; aspect-ratio: 1/1; object-fit: contain;'
        );
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '새 게시물',
        right: {
            button: {
                text: '등록',
                onPress: onSubmitAlert
            }
        }
    };

    return (
        <Layout header={header}>
            {load && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ flex: 1 }}>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flex: 1 }}
                    // behavior={Platform.OS === 'ios' ? "translate-with-padding" : "translate-with-padding"}
                    // keyboardVerticalOffset={headerHeight}

                    behavior={"padding"}
                    keyboardVerticalOffset={(insets?.top + insets?.bottom + 47)}
                >

                    <ScrollView
                        ref={scrollRef}
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingHorizontal: rootStyle.side,
                            paddingTop: 15,
                            paddingBottom: insets?.bottom + 50,
                            gap: 32
                        }}
                        nestedScrollEnabled={true}
                        // keyboardShouldPersistTaps={'always'}
                        // keyboardDismissMode={'on-drag'}
                    >
                        {/* <Text>{enabled ? '1' : '0'}</Text> */}
                        


                        <View style={{ gap: 8 }}>
                            <Text style={{...rootStyle.font(14, colors.text212223, fonts.semiBold)}}>제목</Text>

                            <TextInput
                                iref={(ref) => (inputRefs.current.title = ref)}

                                value={item?.title}
                                onChangeText={(v) => {
                                    handleChange({ key: 'title', value: v });
                                    scrollRef.current.scrollTo({ y: 0, duration: 100, animated: true });
                                }}
                                onFocus={() => {
                                    setEnabled(false);
                                }}
                                placeholder="제목을 입력해주세요."
                                maxLength={50}
                                inputContainerStyle={{
                                    borderRadius: 0,
                                    borderWidth: 0,
                                    borderBottomWidth: 1,
                                    paddingHorizontal: 4
                                }}
                                style={{
                                    fontSize: 16
                                }}
                            />
                        </View>


                       
                        <View style={{ gap: 8 }}>
                            <Text style={{...rootStyle.font(14, colors.text212223, fonts.semiBold)}}>내용</Text>

                            <View style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 15, gap: 20 }}>
                                <RichEditor
                                    ref={richText}
                                    // androidLayerType={'software'}
                                    scrollEnabled={false}
                                    pasteAsPlainText={true}
                                    initialHeight={100}
                                    style={styles.richEditor}
                                    placeholder="내용 입력"
                                    onChange={(html) => {
                                        setDesc(html);
                                    }}
                                    onCursorPosition={(scrollY) => {
                                        console.log(scrollY);
                                        setTimeout(() => {
                                            scrollRef.current.scrollTo({ y: scrollY + 100, duration: 100, animated: true });
                                        }, 300)
                                    }}
                                    onFocus={() => {
                                        setEnabled(true);
                                    }}
                                    editorStyle={{
                                        color: colors.textPrimary,
                                        placeholderColor: colors.textSecondary,
                                        paddingHorizontal: 6,
                                        contentCSSText: `
                                            font-size: 14px;
                                            line-height: 1.6;
                                            padding: 0;
                                            color: ${colors.textPrimary};
                                        `,
                                    }}
                                />

                                    {/* <NestableDraggableFlatList
                                        data={photo}
                                        renderItem={({ item, index, drag, isActive }) => {
                                            return (
                                                <ScaleDecorator>
                                                    <TouchableOpacity 
                                                        style={{ borderColor: colors.textE41616, borderWidth: selectPhoto === index ? 1 : 0 }} 
                                                        activeOpacity={0.7} 
                                                        onLongPress={drag}
                                                        disabled={isActive}
                                                        // onPress={() => {
                                                        //     photoDelete(index);
                                                        // }}
                                                    >
                                                        <AutoHeightImage source={item?.uri || (consts.s3Url + item)} />
                                                    </TouchableOpacity>
                                                </ScaleDecorator>
                                            )
                                        }}
                                        keyExtractor={(item, index) => index}
                                        onDragEnd={({ data }) => setPhoto(data)}
                                    /> */}
                                    
                            </View>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View style={{ gap: 8 }}>
                                <Text style={{...rootStyle.font(14, colors.text212223, fonts.semiBold)}}>사진 첨부</Text>
                                <View style={{ paddingVertical: 7.5, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.f8f8f9, borderRadius: 4 }}>
                                    <Text style={{...rootStyle.font(12, colors.text525458), lineHeight: 17 }}>최대 5장, 10MB미만의 이미지만 첨부할 수 있어요.</Text>
                                </View>
                            </View>

                            <PhotoSelect 
                                numRows={width > 500 ? 7 : 5}
                                padding={rootStyle.side} 
                                photo={photo} 
                                setPhoto={setPhoto} 
                                addPress={photoFunc}
                            />
                        </View>

                        <View style={{ gap: 16 }}>
                            <View style={{ gap: 8 }}>
                                <View style={[ rootStyle.flex, { gap: 8, justifyContent: 'space-between' }]}>
                                    <Text style={{...rootStyle.font(14, colors.text212223, fonts.semiBold)}}>투표하기</Text>
                                    
                                    <TouchableOpacity style={styles.addButton} onPress={() => {
                                        if (vote?.length >= 5) {
                                            ToastMessage('더이상 추가할 수 없습니다.');
                                            return;
                                        }
                                        setVote(prev => [...prev, { title: '' }]);
                                    }}>
                                        <Image source={images.add_black} style={rootStyle.default16} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ paddingVertical: 7.5, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.f8f8f9, borderRadius: 4 }}>
                                    <Text style={{...rootStyle.font(12, colors.text525458), lineHeight: 17 }}>최대 5개의 항목을 추가할 수 있어요.</Text>
                                </View>
                            </View>
                            

                            <View style={{ gap: 7, paddingHorizontal: 12 }}>
                                {vote?.map((x, i) => {
                                    return (
                                        <Animated.View entering={FadeIn} key={i} style={[rootStyle.flex, { gap: 5 }]}>
                                            <TextInput
                                                iref={(ref) => (titleRefs.current[i] = ref)}
                                                value={x?.title}
                                                onChangeText={(v) => {
                                                    setVote(prev => prev?.map((xx, ii) => {
                                                        if (ii !== i) return xx;
                                                        return { ...xx, title: v }
                                                    }))
                                                }}
                                                placeholder={`${i + 1}. 투표 항목 입력`}
                                                maxLength={50}
                                                inputContainerStyle={{ height: 40, paddingHorizontal: 8 }}
                                                style={{ fontSize: 11 }}
                                                isRemove={false}
                                                returnKeyType="next"
                                                onFocus={() => {
                                                    setTimeout(() => {
                                                        scrollRef.current.scrollToEnd();
                                                    }, Platform.OS === 'ios' ? 300 : 0)
                                                }}
                                                onSubmitEditing={() => titleRefs?.current?.[i + 1]?.focus()}
                                                blurOnSubmit={false}
                                            />

                                          
                                            <TouchableOpacity style={[styles.addButton, {aspectRatio: 1 }]} onPress={() => {
                                                setVote(prev => prev?.filter((x, ii) => ii !== i));
                                            }}>
                                                <Image source={images.minus} style={rootStyle.default12} />
                                            </TouchableOpacity>
                                        </Animated.View>
                                    )
                                })}

                            </View>
                            

                          
                        </View>


                    </ScrollView>
                </KeyboardAvoidingView>

            </View>

            <Emoji
                enabled={enabled}
                mode={mode}
                setMode={setMode}
                photoFunc={photoFunc}
                emojiFunc={emojiFunc}
                iref={richText}
            />

            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >
                <BoardCategory onSubmit={onSubmit} />
            </BottomSheetModalTemplate>
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

        richEditor: {
            flex: 1,
        },

        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            alignSelf: 'center',
            paddingHorizontal: 12,
            gap: 6,
            borderWidth: 1,
            borderColor: colors.e9e9e9,
            borderRadius: 4,
        },

    })

    return { styles }
}
