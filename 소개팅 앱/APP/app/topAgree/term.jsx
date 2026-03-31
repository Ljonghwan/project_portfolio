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
import ListText from '@/components/ListText';
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
        title: '면책 및 기타 안내사항',
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
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>서비스 절차 동의</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`모든 채팅 및 대화는 회사가 제공하는 어플 내 채팅앱을 통해서만 진행됨을 이해하고 동의합니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`매니저에게 소개팅 과정 전반에 대한 주도권이 있음을 이해하며, 안내에 따라 픽켓 및 각종 혜택 규정·만남 의사 확인· 연락처 교환 등 모든 절차에 동의합니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`픽켓 및 부가적 혜택 등은 회사 내규, 정책에 따라 사전 고지 없이 변경·종료될 수 있으며, 이에 동의합니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>홍보성 광고 및 서비스 이용 관련 메시지 수신 동의</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)은 소개팅 서비스 이용 과정에서 회사 또는 매니저로부터 다음과 같은 각종 메시지를 수신할 수 있습니다.`}
                    </Text>

                    <View style={{ paddingHorizontal: 10 }}>
                        <ListText span='1. ' style={[rootStyle.font(12, colors.black, fonts.light), { lineHeight: 24, letterSpacing: -0.3 }]}>서비스 이용, 매칭, 만남 주선 등과 관련된 안내</ListText>
                        <ListText span='2. ' style={[rootStyle.font(12, colors.black, fonts.light), { lineHeight: 24, letterSpacing: -0.3 }]}>매니저의 개별 소개 권유, 서비스 진행 안내, 맞춤형 소개 추천 등</ListText>
                        <ListText span='3. ' style={[rootStyle.font(12, colors.black, fonts.light), { lineHeight: 24, letterSpacing: -0.3 }]}>신규 서비스, 이벤트, 혜택 안내, 프로모션 등 각종 홍보성 광고 메시지 (문자, 앱 푸시, 메신저, 이메일 등)</ListText>
                    </View>
                    
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`홍보성 광고 및 안내 메시지는 언제든지 수신 거부가 가능하며, 수신 거부 방법은 각 메시지 내 안내에 따라 진행하실 수 있습니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>법적 고지 및 책임의 한계</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`본 서비스는 ‘소개팅 알바’ 및 허위, 부적절, 불법 행위, 무단 홍보, 영리 목적 이용을 절대 허용하지 않으며, 적발 시 사전 안내 없이 즉시 이용이 제한되고 법적 책임이 부과될 수 있습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`서비스 이용 과정에서 발생하는 모든 책임 및 분쟁은 1% 회원 (본인)에게 있으며, 회사는 서비스 본연의 목적과 무관한 사적 문제·피해에 대해 책임지지 않습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`소개팅 과정에서 제공·열람되는 모든 신상 정보(프로필·연락처·사진 등) 노출로 인한 부득이한 상황은 회사와 무관하므로, 1% 회원(본인)은 본 가이드의 모든 내용을 충분히 읽고 이해한 뒤 동의한 것으로 간주됩니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>최종 동의 고지</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)은 본 안내서, 가이드, 사전동의서의 모든 내용을 충분히 읽고 충분히 이해한 후, 이에 동의함을 확인합니다.`}
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
