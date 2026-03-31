import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert, Pressable } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Constants from 'expo-constants';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import TextList from '@/components/TextList';
import Loading from '@/components/Loading';
import Checkbox from '@/components/CheckBox';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

import BottomSheetModalTemplate from '@/components/BottomSheetModalTemplate';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

import { ToastMessage, handleIntentUrl, handleIntentUrlCert } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { type } = useLocalSearchParams();

    const { reload } = useUser();
    const { signData, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const sheetRef = useRef();
    const sheetPosition = useSharedValue(0);

    const bRef = useRef(null);
    const idRef = useRef(null);
    const passwordRef = useRef(null);
    const birthEndRef = useRef(null);

    const [name, setName] = useState('');
    const [businessNumber, setBusinessNumber] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const [allChecked, setAllChecked] = useState(false);
    const [terms, setTerms] = useState({
        privacy: false,
        third: false,
    });

    const [load, setLoad] = useState(true);
    const [disabled, setDisabled] = useState(true);
    const [modal, setModal] = useState(false);

    useEffect(() => {
        const isValid = businessNumber.replace(/[^0-9]/g, '').length === 10 && name && userId && password;
        setDisabled(!isValid);
    }, [name, businessNumber, userId, password])

    useEffect(() => {
        const allSelected = consts.homeTaxTerms.every((term) => terms[term.idx]);
        setAllChecked(allSelected);
    }, [terms]);

    const submitFunc = async () => {
        /** API 연결필요 홈택스 간편인증 API */

        router.replace({
            pathname: routes.certHometaxWait,
            params: {
                type: type,
                name: name,
                userId: userId,
                password: password,
                businessNumber: businessNumber
            }
        })
    }

    const openSheet = () => {
        if (disabled) return;
        Keyboard.dismiss();

        setModal(true);
        sheetRef.current?.present();
        return;
    }

    // 전체 동의 토글
    const handleAllCheck = () => {
        const newValue = !allChecked;
        const newTerms = {};
        consts.homeTaxTerms.forEach((term) => {
            newTerms[term.idx] = newValue;
        });
        setTerms(newTerms);
    };

    // 개별 약관 토글
    const handleTermCheck = (id) => {
        setTerms((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const onLink = () => {
        console.log('Platform.OS', Platform.OS);
		if (Platform.OS === 'android') sheetRef.current?.dismiss();
	}

    const header = {
        title: "매장 신규 등록",
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} statusBar={'dark'} >

            <KeyboardAwareScrollView
                decelerationRate={'normal'}
                bottomOffset={200}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
            >
                <View style={styles.banner}>
                    <Image source={images.store} style={rootStyle.store}/>
                    <View style={[styles.circle, { width: 123, left: -36 }]} />
                    <View style={[styles.circle, { width: 100, left: '30%' }]} />
                    <View style={[styles.circle, { width: 67, left: '30%', bottom: 30 }]} />
                    <View style={[styles.circle, { width: 186, right: -30 }]} />
                </View>

                <View
                    style={styles.root}
                >
                    <Text style={[styles.title, { marginBottom: 40 }]}>{`새로운 매장을 등록하고,\n매출을 간편하게 확인해보세요!`}</Text>

                    <View style={{}}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>매장명</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="매장명을 입력해주세요."
                                maxLength={20} 
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => bRef.current?.focus()}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>사업자등록번호</Text>
                            <TextInput
                                iref={bRef}
                                value={businessNumber}
                                onChangeText={setBusinessNumber}
                                placeholder="사업자등록번호를 입력해주세요."
                                keyboardType="number-pad"
                                maxLength={10} 
                                onMaxEdit={() => idRef.current?.focus()}
                                // returnKeyType="next"
                                // blurOnSubmit={false}
                                // onSubmitEditing={() => idRef.current?.focus()}
                            />
                        </View>

                        {/* 아이디 */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>홈택스 아이디</Text>
                            <TextInput
                                // autoFocus
                                iref={idRef}
                                value={userId}
                                onChangeText={setUserId}
                                placeholder="홈택스 아이디를 입력해주세요."
                                maxLength={20}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                        </View>

                        {/* 비밀번호 */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>홈택스 비밀번호</Text>
                            <TextInput
                                iref={passwordRef}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="홈택스 비밀번호를 입력해주세요."
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={openSheet}
                            />
                        </View>

                        {/* 생년월일 */}
                        {/* <View style={styles.fieldContainer}>
                            <Text style={styles.label}>주민등록번호</Text>
                            <TextInput
                                // autoFocus
                                iref={idRef}
                                value={userId}
                                onChangeText={setUserId}
                                placeholder="4~20자 이내 영문/숫자"
                                maxLength={20}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                        </View> */}

                        <View style={{ paddingHorizontal: 11 }}>
                            <Text style={styles.msg}>{`입력한 정보는 제휴사와 연동하여\n내 매장 정보 및 장부 데이터를 연결하는 데 사용돼요.`}</Text>
                            
                            {/* <TextList style={styles.msg}>오너톡은 홈택스를 통해 매장 정보를 조회합니다.</TextList>
                            <TextList style={styles.msg}>반드시 대표자 본인 명의의 계정 정보를 사용해 주세요.</TextList>
                            <TextList style={styles.msg}>법인 사업자 인증은 지원하지 않습니다.</TextList> */}
                        </View>

                    </View>

                </View>
            </KeyboardAwareScrollView>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={disabled} onPress={openSheet} >홈택스 연동하기</Button>

            <BottomSheetModalTemplate
                sheetRef={sheetRef}
                animatedPosition={sheetPosition}
            >
                <View style={styles.sheet}>
                    <View style={{ gap: 19 }}>
                        <Text style={styles.sheetTitle}>(필수) 홈택스 인증 서비스 이용 동의</Text>

                        {/* 약관 동의 영역 */}
                        <View style={{ gap: 6 }}>
                            {/* 전체 동의 */}

                            <TouchableOpacity style={styles.allCheckContainer} onPress={handleAllCheck}>
                                <Image source={allChecked ? images.check_on : images.check_off} style={rootStyle.default} transition={50} />
                                <Text style={{ ...rootStyle.font(15, colors.primary, fonts.semiBold) }}>전체 동의</Text>
                            </TouchableOpacity>

                            {/* 개별 약관 목록 */}
                            <View style={styles.termsList}>
                                {consts.homeTaxTerms.map((term) => (
                                    <Checkbox
                                        key={term.idx}
                                        label={`${term?.require ? '(필수)' : '(선택)'} ${term.label}`}
                                        checked={terms[term.idx]}
                                        checkboxStyle={{ width: 24 }}
                                        onPress={() => handleTermCheck(term.idx)}
                                        onLink={() => {
                                            onLink();
                                            router.push({
                                                pathname: routes.terms,
                                                params: {
                                                    idx: term?.type
                                                }
                                            });
                                        }}
                                    />
                                ))}
                            </View>
                        </View>

                        <Button disabled={!allChecked} onPress={submitFunc}>다음</Button>
                    </View>
                </View>

            </BottomSheetModalTemplate>
        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: 33,
            paddingBottom: 100 + insets?.bottom
        },
        banner: {
            paddingTop: 27,
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 60
        },
        circle: {
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.fff7ed,
            position: 'absolute',
            zIndex: -1
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.semiBold,
            color: colors.textPrimary,
            lineHeight: 32,
            letterSpacing: -0.5,
            textAlign: 'center'
        },
        msg: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 24,
            letterSpacing: -0.35,
        },
        fieldContainer: {
            gap: 8,
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.textTertiary,
            lineHeight: 20,
            letterSpacing: -0.35,
        },

        sheet: {
            paddingHorizontal: 35
        },
        sheetTitle: {
            fontSize: 20,
            color: colors.black,
            fontFamily: fonts.bold,
            letterSpacing: -0.5
        },
        allCheckContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 8,
            paddingVertical: 13,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.fafafa
        },
        termsList: {
            paddingHorizontal: 8,
        }
    })

    return { styles }
}