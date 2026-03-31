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
  ActivityIndicator,
  Keyboard
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import ListText from '@/components/ListText';
import TextArea from '@/components/TextArea';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import chatImages from '@/libs/chatImages';

import { ToastMessage, imageViewer } from '@/libs/utils';

import { useUser, useConfig } from '@/libs/store';

import API from '@/libs/api';


export default function Page({  }) {

    const { roomIdx, accept: acceptParam } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const iref = useRef(null);

    const [accept, setAccept] = useState(Boolean(acceptParam*1));
    const [comment, setComment] = useState("");

    const [initLoad, setInitLoad] = useState(false); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [ disabled, setDisabled ] = useState(true);

    useEffect(() => {
        setDisabled(!(comment?.replace(/\s+/g, '').length > (accept ? 9 : 19)));
    }, [accept, comment]);

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(load) return;

        setLoad(true);

        let sender = {
            roomIdx: roomIdx*1,
            status: accept,
            message: comment
        };

        const { data, error } = await API.post('/v1/capsule/finalSelect', sender);

        setTimeout(() => {

            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }
           
            router.dismissTo({
                pathname: routes.chatRoom,
                params: { idx: roomIdx },
            });

            setTimeout(() => {
                ToastMessage('최종 결정이 완료되었습니다.');
            }, 200)

        }, consts.apiDelay);

    }


    const header = {       
        title: "최종 결정", 
        titleStyle: {
            fontSize: 18,
            color: colors.primary,
            fontFamily: fonts.bold,
        },
        titleIcon: {
            icon: 'choice', 
            tintColor: colors.primary,
        },
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} input>

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        paddingHorizontal: rootStyle.side,
                        paddingTop: rootStyle.side,
                        paddingBottom: insets.bottom + 100,
                    }}
                >
                    <View style={{ gap: 26 }}>
                        <View style={[ rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                            <Image source={accept ? images.final_accept : images.final_sad} style={rootStyle.default20} />
                            <Text style={{...rootStyle.font(width <= 360 ? 15 : 18, colors.primary, fonts.semiBold), letterSpacing: -0.45 }}>
                                {accept ? `축하드립니다! 마음을 담은 한마디를 적어 주세요!` : `아쉬워요.. 마음을 담은 한마디를 적어 주세요!`}
                            </Text>
                        </View>

                        <View style={{ gap: 7 }}>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.5 }}>최종 결정을 하면 더 이상 수정할 수 없습니다. 신중히 결정해 주세요.</ListText>
                            <ListText style={{...rootStyle.font(14, colors.text_info, fonts.regular), lineHeight: 20, letterSpacing: -0.5 }}>
                                {accept ? `수락 시 채팅방이 삭제되지 않고, 계속 대화를 할 수 있습니다.` : `상대방의 마음을 헤아려서 매너 있고 정중한 표현 부탁드립니다.`}
                            </ListText>
                        </View>
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <TextArea 
                            iref={iref}
                            autoFocus
                            name={'comment'}
                            state={comment} 
                            setState={setComment} 
                            placeholder={accept ? `수락한 사유를 10자 이상으로 적어주세요.` : `거절한 사유를 20자 이상으로 적어주세요.`} 
                            maxLength={100}
                            multiline
                            inputWrapStyle={{ height: 140, borderColor: colors.primary, backgroundColor: '#EEF' }}
                            inputWrapFocusStyle={{ borderColor: colors.primary }}
                            placeholderTextColor={'#7980FF'}
                            inputStyle={{ color: '#7980FF' }}
                        />
                    </View>

                </ScrollView>
            </View>

            <Button 
                bottom 
                onPress={submitFunc} 
                load={load}
                disabled={disabled}
            >
                최종 결정 완료
            </Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        
        paginationContainer: {
            width: '100%',
            alignItems: 'center',
        },
        pagination: {
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: rootStyle.side,
        },
        dot: {
            flex: 1,
            height: 8,
            borderRadius: 8,
            backgroundColor: colors.greyD9,
        },
        activeDot: {
            backgroundColor: colors.white,
        },

        indexPage: {
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: 'rgba(49, 49, 49, 0.72)',
            height: 24,
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 8,
            borderRadius: 1000
        },

        itemList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10, 
            overflow: 'hidden',
        },
        item: {
            width: '48.2%',            
            aspectRatio: "1/1",
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: colors.greyD9,
        },
        itemImage: {
            width: '100%',
            height: '100%'
        },
        box: {
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.primary,
        }

    })
  
    return { styles }
}
