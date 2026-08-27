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
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>면책 및 기타 고지</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`본 서비스의 소개팅, 매칭, 만남 과정 및 그 결과에 대한 모든 법적 책임은 1% 회원(본인)에게 있습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`회사는 고의 또는 중대한 과실이 없는 한, 회원 간 발생한 분쟁, 정보 노출, 만남 이후 발생하는 사적 문제 등에 대해 어떠한 민·형사상 책임도 부담하지 않습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`1% 회원(본인)은 본 가이드, 사전동의서, 회사 공지사항 등 모든 안내를 충분히 숙지한 뒤 서비스 이용에 동의하여야 하며, 미숙지로 인한 불이익은 회사의 책임이 아닙니다.`}
                    </Text>
                </View>

                <View style={styles.label}>
                    <Text style={[rootStyle.font(16, colors.white, fonts.medium)]}>법적 고지 및 책임의 한계</Text>
                </View>

                <View style={styles.box1}>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`만 19세 미만은 본 서비스를 이용할 수 없습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`본 서비스는 회원 간 만남의 기회를 제공하는 플랫폼으로, 실제 만남, 연애, 교제, 결혼 등 결과에 대하여 보증하거나 책임을 부담하지 않습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`회원이 제공하는 정보(프로필, 사진, 연락처 등)에 대한 진위 여부는 회사가 보증하지 않으며, 허위 정보, 사칭, 도용 등으로 발생한 민·형사상 책임은 전적으로 해당 회원에게 있습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`서비스 내외에서 발생하는 모든 사적 대화, 만남, 금전 거래, 분쟁, 피해 및 각종 부정행위(허위 정보, 악용, 욕설, 불법 목적, 금전 요구 등)에 대해 회사는 어떠한 책임도 부담하지 않으며, 해당 부정행위 또는 회사의 명예·이미지·신뢰를 훼손하는 행위가 적발될 경우, 필요에 따라 법적 조치가 진행될 수 있습니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`회원 간 주고받은 모든 개인정보(사진, 연락처, 대화 내용 등)는 당사자 동의 없이 제3자에게 공개, 배포, 저장, 2차 활용할 수 없으며, 위반 시 민·형사상 책임이 부과됩니다.`}
                    </Text>
                    <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>
                        {`회사는 서비스의 일부 또는 전부를 사전 고지 후 변경, 중단할 수 있으며, 이로 인해 발생하는 손해에 대해 별도의 책임을 지지 않습니다.`}
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
