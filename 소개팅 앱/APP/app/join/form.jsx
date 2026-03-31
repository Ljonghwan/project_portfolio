import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ScrollView } from "react-native-gesture-handler";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Profile from '@/components/Profile';
import PasswordValid from '@/components/PasswordValid';
import Select from '@/components/Select';


import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { ToastMessage, regPhone, regEmail, regNick, patternPasswordFunc} from '@/libs/utils';

import { useUser, useSignData, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { login, pushToken } = useUser();
    const { id, type, typeText, name, hp, birth, gender, email, marketing, setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();
    
    const nickref = useRef(null);
    const emailref = useRef(null);
    const pwref = useRef(null);
    const repwref = useRef(null);

    const [ nickname, setNickname ] = useState("");
    const [ emailInput, setEmailInput ] = useState("");
    const [ emailType, setEmailType ] = useState("");
    const [ pw, setpw ] = useState("");
    const [ repw, setrepw ] = useState("");

    const [ profile, setProfile ] = useState("");

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ pwValid, setPwValid ] = useState(false);

    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
        if(type === 'email') {
            setDisabled( !(nickname?.length > 1 && emailInput && pw?.length > 7 && repw?.length > 7 ) );
        } else {
            setDisabled( !(nickname?.length > 1 ) );
        }

    }, [type, nickname, emailInput, pw, repw])

    useEffect(() => {

        // setError({...error, nickname: '2~5자 한글,영어로 입력하세요.', emailInput: '이메일 형식이 올바르지 않습니다.', repw: '영문, 숫자, 특수문자를 포함한 8~20자로 입력해 주세요.'});

    }, [profile])


    useEffect(() => {
        console.log('error', error);
    }, [error])

    useEffect(() => {
        setError({...error, nickname: ''});
    }, [nickname])

    useEffect(() => {
        setError({...error, emailInput: ''});
    }, [emailInput])

    useEffect(() => {
        setError({...error, repw: ''});
    }, [pw, repw])

    const validNick = async () => {

        Keyboard.dismiss();

        setError({...error, nickname: ''});

        console.log('닉네임 중복검사');

        if(!regNick.test(nickname)) {
            setError({...error, nickname: '2~5자 한글,영어로 입력하세요.'});
            return;
        }
        
        // 닉네임 중복검사
        const sender = {
            nickName: nickname,
        }
        console.log('sender', {...sender, profile : ''});

        const { data, error: checkError } = await API.post('/v1/user/checkNickName', sender);

        setLoad(false);
        console.log('checkError', checkError);

        if(checkError) {
            setError({...error, nickname: checkError?.message});
            return;
        }

        ToastMessage('사용 가능한 닉네임 입니다.');
        
    }

    const submitFunc = async () => {

        Keyboard.dismiss();

        if(load) return;

        console.log('닉네임 중복검사 & 이메일 중복검사 & 기본정보 회원가입 API');

        if(!regNick.test(nickname)) {
            setError({...error, nickname: '2~5자 한글,영어로 입력하세요.'});
            return;
        }
        if(type === 'email' && !regEmail.test(emailInput)) {
            setError({...error, emailInput: '이메일 형식이 올바르지 않습니다.'});
            return;
        }
        if(type === 'email' && !patternPasswordFunc(pw)) {
            console.log('patternPasswordFunc(pw)', patternPasswordFunc(pw));
            setError({...error, repw: '영문, 숫자, 특수문자를 포함한 8~20자로 입력해 주세요.'})
            return;
        }
        if(type === 'email' && pw !== repw) {
            setError({...error, repw: '비밀번호를 확인해 주세요.'})
            return;
        }
        
        
        setLoad(true);
        
        // 이메일 중복검사 & 기본정보 회원가입 & 로그인 API
        const sender = {
            type: type,
            socialId: id,
            email: type === 'email' ? emailInput : email,
            password: pw,
            name: name,
            nickName: nickname,
            hp: hp,
            birth: birth,
            gender: gender,
            profile: profile || null,
            marketing: marketing,
            deviceToken: pushToken
        }
        console.log('sender', {...sender, profile : ''});

        const { data, error } = await API.post('/v1/user/registe', sender);

        setTimeout(() => {

            setLoad(false);
            console.log('error', error);
            if(error) {
                if(error?.code === 901 || error?.code === 902) {
                    setError({...error, nickname: error?.message});
                } else if(error?.code === 903 || error?.code === 904) {    
                    setError({...error, emailInput: error?.message});
                } else {
                    ToastMessage(error?.message);
                }
                return;
            }
        
            login({ token: data })
            
        }, 300)
        
        
       
    }

    const header = {
        title: "회원가입",
        left: {
            icon: 'back',
            onPress: () => router.dismissAll()
        },
    };

    return (
        <Layout header={header} statusBar={'dark'} >

            <KeyboardAwareScrollView
                bottomOffset={150}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={"handled"}
                disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingTop: 20,
                    paddingBottom: insets?.bottom + 100,
					paddingHorizontal: rootStyle.side,
                }}
            >
                <View
                    style={styles.root}
                >
                    <Text style={styles.label}>{`회원 정보를 입력해 주세요.`}</Text>
                    
                    <View style={{ gap: 24 }}>
                        {/* <View style={{ gap: 20, justifyContent: 'center', alignItems: 'center' }}>
                            <Profile profile={profile} setProfile={setProfile} />
                            <Text style={styles.title}>{`프로필 사진은 앱 내에서 공개적으로 활동할\n사진으로 자유롭게 올려주세요! 😄`}</Text>
                        </View> */}

                        {type !== 'email' ? (
                            <>
                                {/* <View style={{ gap: 8, marginTop: 20 }}>
                                    <Text style={styles.sns}>{typeText}계정으로 회원가입하기</Text>
                                    <View style={[rootStyle.flex, { gap: 4 }]}>
                                        <Image source={images?.[type]} style={rootStyle.default} />
                                        <Text style={styles.email} numberOfLines={1}>{email}</Text>
                                    </View>
                                </View> */}
                                

                                <View style={{ gap: 8 }}>
                                    <View style={styles.inputLabelBox}>
                                        <Text style={ [styles.inputLabelRequired ]}>*</Text>
                                        <Text style={ [styles.inputLabel ]}>닉네임</Text>
                                    </View>

                                    {error?.nickname && (
                                        <Animated.View entering={FadeInRight}>
                                            <Text style={styles.errMsg}>{error?.nickname}</Text>        
                                        </Animated.View>
                                    )}

                                    <Input 
                                        name={'nickname'}
                                        state={nickname} 
                                        setState={setNickname} 
                                        placeholder={`2~5자 한글,영어로 입력`} 
                                        returnKeyType={"done"}
                                        onSubmitEditing={submitFunc}
                                        blurOnSubmit={false}
                                        maxLength={10}
                                        label={'중복 확인'}
                                        labelPress={validNick}
                                    />
                                </View>

                                

                                <View style={{ gap: 12 }}>
                                    <View style={styles.inputLabelBox}>
                                        <Text style={ [styles.inputLabelRequired ]}>*</Text>
                                        <Text style={ [styles.inputLabel ]}>아이디(이메일)</Text>
                                    </View>
                                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                                        <Image source={images?.[type]} style={rootStyle.default} />
                                        <Text style={styles.email} numberOfLines={1}>{email}</Text>
                                        {/* <Text style={styles.email}>{typeText}계정</Text> */}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={{ gap: 8 }}>
                                    <View style={styles.inputLabelBox}>
                                        <Text style={ [styles.inputLabelRequired ]}>*</Text>
                                        <Text style={ [styles.inputLabel ]}>닉네임</Text>
                                    </View>

                                    {error?.nickname && (
                                        <Animated.View entering={FadeInRight}>
                                            <Text style={styles.errMsg}>{error?.nickname}</Text>        
                                        </Animated.View>
                                    )}

                                    <Input 
                                        name={'nickname'}
                                        state={nickname} 
                                        setState={setNickname} 
                                        placeholder={`2~5자 한글,영어로 입력`} 
                                        returnKeyType={"done"}
                                        onSubmitEditing={submitFunc}
                                        blurOnSubmit={false}
                                        maxLength={10}
                                        label={'중복 확인'}
                                        labelPress={validNick}
                                    />
                                </View>

                                <View style={{ gap: 8 }}>
                                    <View style={styles.inputLabelBox}>
                                        <Text style={ [styles.inputLabelRequired ]}>*</Text>
                                        <Text style={ [styles.inputLabel ]}>아이디(이메일)</Text>
                                    </View>

                                    {error?.emailInput && (
                                        <Animated.View entering={FadeInRight}>
                                            <Text style={styles.errMsg}>{error?.emailInput}</Text>        
                                        </Animated.View>
                                    )}

                                    <View style={[rootStyle.flex, { gap: 10 }]}>
                                        <Input 
                                            style={{ flex: 1 }}
                                            iref={emailref}
                                            name={'emailInput'}
                                            valid={'email'}
                                            state={emailInput} 
                                            setState={setEmailInput} 
                                            placeholder={`아이디(이메일)`} 
                                            returnKeyType={"next"}
                                            onSubmitEditing={() => pwref.current?.focus() }
                                            blurOnSubmit={false}
                                        />
                                        {/* <Text>@</Text>
                                        <Select
                                            // ref={(ref) => (inputRefs.current.type = ref)}
                                            state={emailType}
                                            setState={(v) => {
                                                setEmailType(v)
                                            }}
                                            list={[
                                                {idx: 1, title: 'naver.com'},
                                                {idx: 2, title: 'daum.net'},
                                                {idx: 3, title: 'hotmail.com'},
                                                {idx: 4, title: 'yahoo.com'},
                                                {idx: 5, title: 'other'},
                                            ]}
                                        >
                                            <View style={[rootStyle.flex, { gap: 4, width: 100 }]}>
                                                <Text style={styles.emailType}>{emailType}</Text>
                                            </View>
                                        </Select> */}
                                    </View>
                                </View>
                                

                                <View style={{ gap: 8 }}>
                                    <View style={styles.inputLabelBox}>
                                        <Text style={ [styles.inputLabelRequired ]}>*</Text>
                                        <Text style={ [styles.inputLabel ]}>비밀번호</Text>
                                    </View>

                                    {error?.repw && (
                                        <Animated.View entering={FadeInRight}>
                                            <Text style={styles.errMsg}>{error?.repw}</Text>        
                                        </Animated.View>
                                    )}

                                    <Input 
                                        iref={pwref}
                                        name={'pw'}
                                        state={pw} 
                                        setState={setpw} 
                                        placeholder={`비밀번호 입력`} 
                                        returnKeyType={"next"}
                                        onSubmitEditing={() => repwref.current?.focus() }
                                        blurOnSubmit={false}
                                        password
                                    />
                                    <Input 
                                        iref={repwref}
                                        name={'repw'}
                                        state={repw} 
                                        setState={setrepw} 
                                        placeholder={`비밀번호 재입력`} 
                                        returnKeyType={"done"}
                                        onSubmitEditing={submitFunc}
                                        blurOnSubmit={false}
                                        password
                                    />
                                    <Text style={styles.help}>* 영문, 숫자, 특수문자를 포함한 8~20자로 입력해 주세요.</Text>
                                    {/* <PasswordValid pw={pw} repw={repw} /> */}
                                </View>
                               
                            </>
                        )}

                    </View>

                    {/* 
                    {type === 'email' ? (
                        <Text style={styles.title}>회원님은 이메일로 가입하셨습니다.</Text>
                    ) : (
                        <Text style={styles.title}>{`회원님은 ${type === 'kakao' ? '카카오' : type === 'naver' ? '네이버' : type === 'google' ? '구글' : type === 'apple' ? '애플' : '소셜'} 간편가입하셨습니다.\n소셜 간편로그인해주세요.`}</Text>
                    )}
                    <View style={[rootStyle.flex, { gap: 4 }]}>
                        {type !== 'email' && <Image source={images?.[type]} style={rootStyle.default} /> }
                        <Text style={styles.email} numberOfLines={1}>{email}</Text>
                    </View>
                     */}
                </View>

            </KeyboardAwareScrollView>
            
            <Button bottom type={'2'} onPress={submitFunc} load={load}>회원가입</Button>
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            gap: 20
		},
        label: {
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.semiBold,
            paddingHorizontal: 10,
        },
        title: {
            textAlign: 'center',
            lineHeight: 20
        },
        sns: {
            textAlign: 'center'
        },

        email: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            lineHeight: 24,
            letterSpacing: -0.4,
            flex: 1
        },


        inputLabelBox: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        inputLabel: {
            color: colors.black,
            fontSize: 16,
            fontFamily: fonts.semiBold
        },
        inputLabelRequired: {
            color: colors.red,
            fontSize: 16,
        },
        help: {
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: -0.35,
            color: colors.grey6,
        },
        errMsg: {
            fontSize: 12,
            lineHeight: 14,
            color: colors.red,
            marginTop: -4
        },
	})

  	return { styles }
}