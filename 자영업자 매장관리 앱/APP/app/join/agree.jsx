import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue } from 'react-native-reanimated';
import axios from 'axios';

import Button from '@/components/Button';
import CheckBox from '@/components/CheckBox';
import Layout from '@/components/Layout';
import Text from '@/components/Text';

import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import API from '@/libs/api';


import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

const ChevronRightIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <Path
            d="M6 4L10 8L6 12"
            stroke="#8B95A1"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);


export default function Agree() {

    const { styles } = useStyle();

    const router = useRouter();

    const { setSignData } = useSignData();
    const { openAlertFunc } = useAlert();


    const [chkAll, setChkAll] = useState(false);
    const [termsAgree, setTermsAgree] = useState(consts.terms);

    const [disabled, setDisabled] = useState(true);
    const [load, setLoad] = useState(false);


    useEffect(() => {
        setChkAll(Boolean(termsAgree?.filter(item => !item?.agree).length < 1));
        setDisabled(Boolean(termsAgree?.filter(item => item?.require && !item?.agree).length > 0));
    }, [termsAgree]);

    const setChkAllFunc = (value) => {
        setTermsAgree(
            consts.terms?.map((x, i) => {
                return {idx: x.idx, require: x.require, agree: value}
            })
        )
    }

    const checkFunc = (idx, check) => {
        setTermsAgree(
            termsAgree?.map((x, i) => {
                if(x.idx === idx) return {...x, agree: check};
                return x
            })
        )
    }

    // 본인인증 시작
    const handleNext = () => {

        if (load) return;

        setLoad(true)
        console.log('termsAgree?.find(x => x?.marketing)?.agree', termsAgree?.find(x => x?.marketing)?.agree);
        /** API 연결필요 본인인증 창 호출 */
        setSignData({
            key: 'marketing',
            value: termsAgree?.find(x => x?.marketing)?.agree
        })

        setLoad(false)
        console.log('본인인증 시작');

        router.replace({
            pathname: routes.cert,
            params: {
                type: 'join'
            }
        })
        // router.push('/auth/verification');
    };



    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 타이틀 영역 */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        사장님, 안전한 서비스 이용을 위해{'\n'}본인인증이 필요해요.
                    </Text>
                    <Text style={styles.subtitle}>
                        고객 정보 보호 및 사업자 인증을 위해{'\n'}이용 약관에 동의해주세요.
                    </Text>
                </View>

                {/* 약관 동의 영역 */}
                <View style={styles.termsSection}>
                    {/* 전체 동의 */}
                    <View style={styles.allCheckContainer}>
                        <CheckBox
                            type={2}
                            label="모든 항목에 동의합니다."
                            checked={chkAll}
                            onPress={() => setChkAllFunc(!chkAll)}
                            labelStyle={styles.allCheckLabel}
                            checkboxStyle={{ width: 22 }}
                        />
                    </View>

                    {/* 개별 약관 목록 */}
                    <View style={styles.termsList}>
                        {consts.terms.map((x) => (
                            <CheckBox
                                key={x.idx}
                                label={`${x?.require ? '(필수)' : '(선택)'} ${x.label}`}
                                checked={termsAgree?.find(xx => xx?.idx === x?.idx)?.agree}
                                onPress={() => checkFunc(x?.idx, !termsAgree?.find(xx => xx?.idx === x?.idx)?.agree)}
                                onLink={x?.type ? () => {
                                    router.push({
                                        pathname: routes.terms,
                                        params: {
                                            idx: x?.type
                                        }
                                    });
                                } : null}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <Button
                bottom
                disabled={disabled}
                load={load}
                type="1"
                onPress={handleNext}
                containerStyle={styles.nextButton}
            >
                본인인증 시작하기
            </Button>


        </View>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();


    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.white,
        },
        scrollContent: {
            flexGrow: 1,
            paddingBottom: 100 + insets?.bottom,
            justifyContent: 'space-between'
        },
        headerSection: {
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
        },
        title: {
            fontFamily: fonts.semiBold,
            fontSize: 24,
            lineHeight: 34,
            letterSpacing: -0.6,
            color: colors.textPrimary,
        },
        subtitle: {
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.textSecondary,
        },
        termsSection: {
            gap: 14,
            paddingHorizontal: 20,
            paddingVertical: 10,
        },
        allCheckContainer: {
            paddingTop: 14,
        },
        allCheckLabel: {
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: colors.primary,
        },
        termsList: {
            gap: 0,
        },
        termItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 6,
        },
        buttonContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 25,
            paddingVertical: 20,
            backgroundColor: colors.white,
        },
        nextButton: {
            height: 50,
            borderRadius: 10,
        },
    });


    return { styles }
}


