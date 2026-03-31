import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import CheckBox2 from '@/components/CheckBox2';
import CsType from '@/components/CsType';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import { useUser, useAlert, usePhotoPopup } from '@/libs/store';

import { ToastMessage, hpHypen, regNick, randomNumberCreate, numFormat } from '@/libs/utils';

import API from '@/libs/api';
import consts from '@/libs/consts';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { mbData, reload, logout } = useUser();
    const { openAlertFunc } = useAlert();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    const iref = useRef(null);
    const commentRef = useRef(null);

    const [ title, setTitle ] = useState("");
    const [ comment, setComment ] = useState("");
    const [ file, setFile ] = useState(null);
    const [ type, setType ] = useState(null);

    const [ view, setView ] = useState(false);

    const [ agree, setAgree ] = useState(false); 

    const [disabled, setDisabled] = useState(false); 
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    const [ error, setError ] = useState({});
    
    useEffect(() => {
        setDisabled( !(type && comment?.length > 0 && title?.length > 0) );
    }, [type, title, comment])


    const photoFunc = (index) => {

        openPhotoFunc({
            setPhoto: (v) => setFile(v?.[0]),
            deleteButton: Boolean(file)
        })
        
    }


    const submitFunc = async () => {

        Keyboard.dismiss();

        if(load) return;

        setLoad(true);

        const sender = {
            title: title,
            content: comment,
            file: file,
            type: type
        }

        const { data, error } = await API.post('/v1/suport/insert', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('등록 되었습니다.');
            router.dismissTo({
                pathname: routes.cs,
                params: { back: true },
            });

        }, consts.apiDelay)
       

    }

    const header = {
        title: '1:1문의 등록',
        titleStyle: {
            fontSize: 18,
            color: colors.text_link,
            fontFamily: fonts.medium,
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={colors.white}>
            
            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                contentContainerStyle={{
                    paddingBottom: insets?.bottom + 100,
                }}
            >
                <View style={{ flex: 1, padding: 20, gap: 20 }}>
                    <View style={{ gap: 8 }}>
                        <Text style={styles.title}>{`문의사항이 있으신가요?`}</Text>
                        <Text style={styles.subTitle}>아래 내용을 입력해 주세요.</Text>
                    </View>

                    <View style={{ gap: 12 }}>
                        <Text style={styles.inputLabel}>1. 문의 유형</Text>
                        <TouchableOpacity style={[styles.bank]} onPress={() => setView(!view)} >
                            <Text style={styles.bankText} numberOfLines={1}>{type || "문의 유형을 선택해주세요."}</Text>
                            <Image source={images.down} style={rootStyle.default} />
                        </TouchableOpacity>
                    </View>

                    
                    <Input 
                        iref={iref}
                        name={'title'}
                        state={title} 
                        setState={setTitle} 
                        inputLabel={'2. 제목'}
                        placeholder={`제목을 입력해 주세요.`} 
                        returnKeyType={"next"}
                        onSubmitEditing={() => {
                            commentRef?.current?.focus()
                        }}
                        blurOnSubmit={false}
                        inputStyle={{ fontSize: 14 }}
                        maxLength={30}
                    />

                    <TextArea 
                        iref={commentRef}
                        inputLabel={'3. 내용'}
                        name={'comment'}
                        state={comment} 
                        setState={setComment} 
                        placeholder={`내용을 입력해 주세요.`} 
                        blurOnSubmit={false}
                        maxLength={255}
                        multiline
                        error={error}
                        setError={setError}
                        inputStyle={{ fontSize: 14 }}
                        inputWrapStyle={{ height: 150 }}
                    />

                    <View style={{ gap: 12 }}>
                        <Text style={styles.inputLabel}>4. 첨부이미지</Text>

                        {file ? (
                             <TouchableOpacity style={[styles.item, { backgroundColor: colors.placeholder }]} activeOpacity={0.7} onPress={photoFunc}>
                                <Image 
                                    source={file?.uri} 
                                    style={styles.inputImage} 
                                />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.item, { backgroundColor: colors.main2 }]} activeOpacity={0.7} onPress={photoFunc}>
                                <Image 
                                    source={images.add} 
                                    style={rootStyle.default32} 
                                />
                            </TouchableOpacity>
                        )}
                       
                       
                    </View>
                </View>
                
            </KeyboardAwareScrollView>

            <Button type={'2'} disabled={disabled} onPress={submitFunc} load={load} bottom>문의하기</Button>

            <CsType view={view} handleClose={() => setView(false)} value={type} onSubmit={(v) => {
                setType(v);
                iref.current?.focus();
            }} />

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        title: {
            fontSize: 24,
            lineHeight: 32,
            fontFamily: fonts.semiBold,
            color: colors.dark
        },
        subTitle: {
            fontSize: 14,
            letterSpacing: -0.35,
            color: colors.grey6
        },
       
        item: {
            width: ( width - 40 - 9) / 3, // 전체 가로길이 - 양쪽 padding 20씩 * 2 - 사이 gap 4 * 2 
            height: ( width - 40 - 9) / 3,
            aspectRatio: "1/1",
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: colors.greyE,
        },
        inputImage: {
            width: '100%',
            height: '100%'
        },
        inputLabel: {
            color: colors.dark,
            fontSize: 15,
            // fontFamily: fonts.medium
        },

        bank: {
            flex: 1,
            height: 48,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyC,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        bankText: {
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.3
        },
    })
  
    return { styles }
}
