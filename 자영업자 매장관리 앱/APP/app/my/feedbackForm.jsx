import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import Animated, { useSharedValue } from 'react-native-reanimated';
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
import TextArea from '@/components/TextArea';
import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';


import Emoji from '@/components/Ui/Emoji';
import PhotoSelect from '@/components/Ui/PhotoSelect';
import SelectLabel from '@/components/Ui/SelectLabel';

import FeedbackCategory from '@/components/Popup/FeedbackCategory';


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

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const scrollRef = useRef(null);
    const richText = useRef(null);

    const [item, setItem] = useState({});
    const [photo, setPhoto] = useState([]);

    const [load, setLoad] = useState(false);
    const [disable, setDisable] = useState(true);

    useEffect(() => {
        setDisable(!(item?.title && item?.comment && item?.cate));
    }, [item])

    const onSubmit = async () => {

        setLoad(true);

        let sender = {
            cate: item?.cate,
            title: item?.title,
            comment: item?.comment,
            image: photo
        }

        const { data, error } = await API.post('/v1/my/feedbackUpdate', sender);

        setTimeout(() => {

            setLoad(false);

            if (error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage("등록되었습니다.");

            router.back();

        }, consts.apiDelay);
    }

    const handleChange = ({ key, value }) => {
        setItem(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const photoFunc = async (index) => {
        if (typeof (index) === 'number') {
            openPhotoFunc({
                maxFileSize: consts.maxImageSize,
                setPhoto: (v) => {
                    if (!v) {
                        setPhoto(prev => prev?.filter((x, i) => i !== index));
                    } else {
                        setPhoto(prev => prev?.map((x, i) => {
                            if (i !== index) return x;
                            return v?.[0]
                        }))
                    }

                },
                deleteButton: true
            })
        } else {
            openPhotoFunc({
                selectionLimit: 10 - photo?.length,
                maxFileSize: consts.maxImageSize,
                setPhoto: (v) => {
                    setPhoto(prev => [...prev, ...v]);
                }
            })
        }

        Keyboard.dismiss();
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '피드백 센터',
    };

    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>

                <KeyboardAwareScrollView
                    decelerationRate={'normal'}
                    bottomOffset={200}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: rootStyle.side,
                        paddingTop: 15,
                        paddingBottom: insets?.bottom + 100,
                        gap: 32
                    }}
                >

                    <View style={{ gap: 8 }}>
                        <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>피드백 유형</Text>

                        <TouchableOpacity onPress={() => {
                            Keyboard.dismiss();
                            sheetRef.current?.present();
                        }}>
                            <SelectLabel type={1} title={configOptions?.feedbackOptions?.find(x => x?.idx === item?.cate)?.title} placeHolder={'문의 유형을 선택해주세요'} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 8 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>제목</Text>
                            <Text style={{ ...rootStyle.font(10, colors.text757575, fonts.medium) }}>{item?.title?.length || 0}/50</Text>
                        </View>

                        <TextInput
                            iref={(ref) => (inputRefs.current.title = ref)}
                            value={item?.title}
                            onChangeText={(v) => {
                                handleChange({ key: 'title', value: v });
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
                                fontSize: 14
                            }}
                        />
                    </View>



                    <View style={{ gap: 8 }}>
                        <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                            <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>내용</Text>
                            <Text style={{ ...rootStyle.font(10, colors.text757575, fonts.medium) }}>{item?.comment?.length || 0}/500</Text>
                        </View>

                        <TextArea
                            value={item?.comment}
                            onChangeText={(v) => { handleChange({ key: 'comment', value: v }) }}
                            maxLength={500}
                            inputContainerStyle={{
                                borderRadius: 0,
                                borderWidth: 0,
                                borderBottomWidth: 1,
                                paddingHorizontal: 4
                            }}
                            style={{
                                fontSize: 14
                            }}
                            minHeight={200}
                            maxHeight={200}
                            showCharCount={false}
                        />
                    </View>

                    <View style={{ gap: 16 }}>
                        <View style={{ gap: 8 }}>
                            <Text style={{ ...rootStyle.font(14, colors.text212223, fonts.semiBold) }}>사진 첨부</Text>
                            <View style={{ paddingVertical: 7.5, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.f8f8f9, borderRadius: 4 }}>
                                <Text style={{ ...rootStyle.font(12, colors.text525458), lineHeight: 17 }}>최대 10장, 10MB미만의 이미지만 첨부할 수 있어요.</Text>
                            </View>
                        </View>

                        <PhotoSelect
                            numRows={width > 500 ? 7 : 5}
                            padding={rootStyle.side}
                            photo={photo}
                            setPhoto={setPhoto}
                            addPress={photoFunc}
                            max={10}
                        />
                    </View>
                </KeyboardAwareScrollView>

                <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={disable} load={load} onPress={onSubmit}>등록</Button>

            </View>

            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
                componentStyle={{
                    paddingBottom: 0
                }}
            >
                <FeedbackCategory value={item?.cate} setValue={(v) => {
                    handleChange({ key: 'cate', value: v });
                    sheetRef.current?.dismiss();
                }} />
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

    })

    return { styles }
}
