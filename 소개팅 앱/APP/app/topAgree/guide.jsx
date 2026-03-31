import React, { useRef, useState, useEffect } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import CheckBox2 from '@/components/CheckBox2';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import { useUser, useAlert, usePhotoPopup, usePageContext } from '@/libs/store';

import API from '@/libs/api';

export default function Page({ }) {

    const { name } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { token, mbData } = useUser();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();
    const { openAlertFunc } = useAlert();
    const { context, setContext } = usePageContext();

    const [agree, setAgree] = useState(false);

    const [disabled, setDisabled] = useState(false);
    const [load, setLoad] = useState(false); // 데이터 추가 로딩


    const header = {
        title: '사소한 소개팅 이용 가이드',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    const submitFunc = () => {

        setContext({
            key: 'agree',
            data: name
        });

        router.back();
    }
    
    return (
        <Layout header={header} backgroundColor={colors.white}>

            <ScrollView
                style={{
                    flex: 1,
                    height: '100%'
                }}
                contentContainerStyle={{
                    paddingHorizontal: rootStyle.side,
                    paddingTop: 10,
                    paddingBottom: insets.bottom + 200,
                    gap: 20
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.box2}>
                    <Text style={[rootStyle.font(16, colors.primary, fonts.medium), { lineHeight: 24 }]}>1% 회원이란 ?</Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>{`회사가 외모 등 내부 기준에 따라 자격을 부여한 회원을 의미하며, 이에 따라 별도의 서비스와 혜택을 누릴 수 있습니다.\n본 서비스는 1% 회원(본인)과 매칭되는 상대 회원(매칭 상대) 간의 안전하고 투명한 만남을 지원합니다.`}</Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>서비스 이용 방법</Text>
                </View>

                <View style={styles.box1}>
                    <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                        <View style={styles.count}>
                            <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>01</Text>
                        </View>
                        <Text style={[rootStyle.font(width <= 320 ? 14 : 16, colors.primary8, fonts.medium)]}>정식 소개팅 진행(3박 4일 소개팅 진행)</Text>
                    </View>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`상대 회원(매칭 상대)이 픽켓(11,000원)을 2장을 사용하여 1% 회원(본인)과의 소개팅 채팅방을 개설합니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1:1 채팅방이 개설되면, 연락처를 제외한 성함·나이·직업 등 신상정보가  1% 회원(본인)과 상대 회원(매칭 상대) 간에 모두 상호 공개되며, 3박 4일 동안 자유롭게 대화할 수 있습니다.`}
                    </Text>
                </View>

                <View style={styles.box1}>
                    <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                        <View style={styles.count}>
                            <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>02</Text>
                        </View>
                        <Text style={[rootStyle.font(width <= 320 ? 14 : 16, colors.primary8, fonts.medium)]}>최종 결정 완료 후 진행 방향</Text>
                    </View>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`3박 4일 정상 대화 종료 후, 1% 회원(본인)과 상대 회원 (매칭 상대) 모두 최종 결정에서 수락을 할 시(최종 결정) 쌍방이 동의할 경우 연락처가 상호 교환됩니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`최종 결정을 거절 할 경우, 연락처 교환 없이 소개팅은 최종 종료됩니다.`}
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 4 }}>
                    <CheckBox2
                        fontStyle={styles.check}
                        checkStyle={styles.checkStyle}
                        label={`위 모든 내용을 숙지하였으며, 동의합니다.`}
                        checked={agree}
                        onCheckedChange={(v) => {
                            setAgree(v)
                        }}
                    />
                </View>

            </ScrollView>

            <Button 
                type={'14'} 
                containerStyle={{ borderRadius: 9 }}
                load={load} 
                disabled={!agree}
                bottom 
                onPress={submitFunc}
            >
                확인
            </Button>


        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
       
        label: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignSelf: 'flex-start',
        },
        count: {
            width: 32,
            aspectRatio: 1,
            borderRadius: 12,
            backgroundColor: colors.primary8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        box1: {
            backgroundColor: colors.primary7,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 20,
            gap: 20
        },
        box2: {
            backgroundColor: colors.primary6,
            borderRadius: 20,
            padding: 16,
            gap: 10
        },
        check: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35,
            fontFamily: fonts.regular
        },
        checkStyle: {
            width: 24,
            height: 24,

        },
    })

    return { styles }
}
