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
        title: '유의사항 / 이용 팁',
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

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>혜택 전달</Text>
                </View>

                <View style={styles.box1}>
                    <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                        <View style={styles.count}>
                            <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>01</Text>
                        </View>
                        <Text style={[rootStyle.font(width <= 320 ? 14 : 16, colors.primary8, fonts.medium)]}>픽켓 혜택</Text>
                    </View>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`일반 픽켓 전달의 경우, 상대 회원이 결제한 픽켓금액(11,000원)은 정산 수수료(50%)를 제외한 배분금에 따라 금액이 1% 회원(본인)에게 지급됩니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`픽켓 금액은 어플 내 픽켓 내역 메뉴를 통해 1% 회원(본인)이 직접 확인 및 정산 신청이 가능합니다.`}
                    </Text>

                    <View style={[rootStyle.flex, { gap: 5, justifyContent: 'flex-start' }]}>
                        <View style={styles.count}>
                            <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>02</Text>
                        </View>
                        <Text style={[rootStyle.font(width <= 320 ? 14 : 16, colors.primary8, fonts.medium)]}>픽켓 정산 및 취소 규정</Text>
                    </View>

                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35 }]}>
                        {`일반 픽켓은 비정상적 또는 형식적 진행이 확인되어도 바로 수령할 수 있습니다. 단, 슈퍼 픽켓은 1%가 만남 인증을 해야만 수령할 수 있는 재화입니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35 }]}>
                        {`픽켓 정산 시에는 관련 세무 법령에 따라 총 3.3%의 금액이 '소득세 원천징수'의 명목으로 공제됩니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35 }]}>
                        {`해당 금액은 국세청 신고를 위한 필수 공제 항목으로, 회사 수익과는 무관합니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>프로필 및 개인정보 노출 안내</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)의 프로필(사진, 기본 신상 정보)은 회사 매니저 및 담당 직원이 개인정보 보호법 등 관련 법령과 회사 내규에 따라 안전하게 관리·보관하며 매칭 서비스의 목적으로 매니저가 선별하여 상대 회원(매칭 상대)에게 제한적으로 제공합니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`상대 회원(매칭 상대)의 프로필 사진은 본인 선택에 따라 등록 또는 비공개 모두 가능하며, 의무 등록 사항이 아닙니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)의 사진은 외모 식별이 불가하도록 모자이크 처리 후, 공식 사이트 등 홍보용으로 게시될 수 있습니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>주의 및 안내사항</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)과 상대 회원(매칭 상대) 간의 대화 및 만남은 반드시 상호 동의 하에만 진행 및 유지됩니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`모든 프로필, 대화 내용, 연락처 등 개인정보는 회사 내규에 따라 필요 시 내부 직원이 안전하게 보관·열람할 수 있습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`허위 정보, 불법 행위, 비방, 명예훼손, 금전 요구, 서비스 악용, 무단 홍보, 영리 목적 등 비정상 행위 시 서비스 이용이 제한되며, 필요 시 법적 조치가 취해집니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`본 서비스는 ‘소개팅 알바’ 등 상업적·영리적 목적의 알선 또는 알바 행위를 절대 허용하지 않습니다.`}
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
