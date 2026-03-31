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
  ActivityIndicator
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
import BottomMultiButton from '@/components/BottomMultiButton';


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


const list = [
    { 
        title: "픽켓은 소개팅 중 1%회원에게\n선물할 수 있는 티켓으로\n1장당 1만원의 가치를 지녔습니다.",
        title2: "픽켓은 소개팅 중 1%회원에게\n선물할 수 있는 티켓으로\n1장당 1만원의 가치를 지녔습니다.",
        image: chatImages.chat_picketinfo_0,
    },
    { 
        title: "픽켓을 2장 선물하여 총 4장을 전달하면,\n슈퍼픽켓이 해금되고 그 채팅방은 VIP\n채팅방으로 변경됩니다!",
        title2: "픽켓을 2장 선물하여 총 4장을 전달하면,\n슈퍼픽켓이 해금되고 그 채팅방은 VIP\n채팅방으로 변경됩니다!",
        image: chatImages.chat_picketinfo_3,
    },
    { 
        title: "VIP 채팅방으로 변경 시 VIP에 맞게\n채팅 목록과 채팅창이 세련되게 변경돼요.\n멋진 왕관은 서비스입니다!",
        title2: "VIP 채팅방으로 변경 시 VIP에 맞게\n채팅 목록과 채팅창이 세련되게 변경돼요.\n멋진 왕관은 서비스입니다!",
        image: chatImages.chat_picketinfo_1,
        imageStyle: {
            width: 320,
            aspectRatio: 350/519,
            alignSelf: 'center',
        }
    },
    { 
        title: "마음에 드는 1% 회원에게\n픽켓 시스템으로\n마음을 전달해 보세요!",
        title2: "마음에 드는 선택 회원에게\n내 매력을 뽐내\n픽켓을 전달 받아 보세요!",
        image: chatImages.chat_picketinfo_2,
    },
];


export default function Page({  }) {

    const { idx, roomIdx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData, reload } = useUser();
    const { configOptions } = useConfig();

    const scRef = useRef(null);

    const [user, setUser] = useState(null);
    const [view, setView] = useState(false);
    const [end, setEnd] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
 
    const renderItem = ({ item, index }) => {
        return (
            <View style={{ width,   }} >
                <ScrollView contentContainerStyle={{ paddingTop: 50, paddingBottom: insets.bottom + 100, paddingHorizontal: rootStyle.side }}>
                    <View style={{ marginBottom: 40 }}>
                        <Text style={{...rootStyle.font(22, colors.black, fonts.semiBold), lineHeight: 30 }}>{mbData?.level === 1 ? item?.title : item?.title2}</Text>
                    </View>

                    <View style={{}}>
                        <Image source={item?.image} style={[item?.imageStyle || { width: '100%', maxHeight: 380, aspectRatio: 1/1, alignSelf: 'center' }]} />
                    </View>
                </ScrollView>
            </View>
        )
    }

    const nextFunc = () => {
        if(currentIndex === list?.length - 1) {
            router.back();
            return;
        }
        scRef?.current?.scrollToIndex({ index: currentIndex + 1 });
    }

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} backgroundColor={"#F0EEFB"}>

            {!view ? (
                <View style={{ flex: 1, gap: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13.5, paddingBottom: 100 }}>
                    <Text style={{...rootStyle.font(22, colors.black, fonts.semiBold), textAlign: 'center' }}>{`픽켓에 대해 알아볼까요?`}</Text>
                    <Image source={images.picket} style={[rootStyle.picket, { width: 190 }]} />
                    <View style={{ gap: 10, width: '100%' }}>
                        <Button
                            onPress={() => {setView(true)}} 
                            textStyle={{ fontSize: 16 }}
                        >
                            {`픽켓 알아보기`}
                        </Button>
                        <Button
                            type={18}
                            textStyle={{ fontSize: 16 }}
                            onPress={() => {
                                router.back()
                            }} 
                        >
                            {`채팅방으로 돌아가기`}
                        </Button>
                    </View>
                </View>
            ) : (
                <Animated.View entering={FadeIn} style={{ flex: 1, paddingTop: 10 }}>
                    <View style={styles.paginationContainer}>
                        <View style={styles.pagination}>
                            {list?.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        currentIndex === index && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                    
                    <FlatList
                        ref={scRef}
                        data={list}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index}
                        horizontal
                        scrollEnabled={false}
                        pagingEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 50,
                        }}
                        bounces={true}
                        style={[{  }]}
                        contentContainerStyle={{}}
                        
                    />

                    <BottomMultiButton>
                        <Button style={{ flex: 1 }} type={'2'} onPress={nextFunc}>{currentIndex === list?.length - 1 ? '채팅방으로 돌아가기' : '다음'}</Button>
                    </BottomMultiButton>
                </Animated.View>
            )}

            

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
