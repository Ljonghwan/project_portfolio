import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation, KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { Image } from 'expo-image';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Input from '@/components/Input';
import InputFileCar from '@/components/InputFileCar';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, photoShot } from '@/libs/utils';

import { useUser, useSignData, useDriverData, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page() {

	const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { pushToken } = useUser();
    const { id, type, typeText, email, pw, country, lastName, firstName, hp, gender, setSignData } = useSignData();
    const { startDriverType, driverType, profile, driveLicence, carImageMain, carImageFront, carImageSide, carImageRear, carNumber, carType, seater, etcImages, bank, bankNumber, bankUser, setDriverData } = useDriverData();
    const { openAlertFunc } = useAlert();

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    const [ error, setError ] = useState({});

    useEffect(() => {
      
        setDisabled( !(bank && bankNumber && bankUser));

    }, [bank, bankNumber, bankUser])
   
    const submitFunc = async () => {

        Keyboard.dismiss();
        
        if(load) return;

        setLoad(true);
        
        const sender = {
            type: type,
            socialId: id,
            email: email,
            password: pw,
            country: country,
            lastName: lastName,
            firstName: firstName,
            hp: hp,
            gender: gender,
            deviceToken: pushToken,

            driverType,
            profile,
            driveLicence,
            carImageMain,
            carImageFront,
            carImageSide,
            carImageRear,
            carNumber,
            carType,
            seater,
            bank,
            bankNumber,
            bankUser,
            etcImages,
        }

        /**
           드라이버 회원가입 & 수정후 재신청
        */
       
        const { data, error } = await API.post(startDriverType ? '/v2/auth/driverApplyInsert' : '/v2/driver/user/registe', sender);
        console.log(data, error);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(lang({ id: error?.message }), { type: "error" });
                return;
            }

			router.dismissAll();
			router.replace({
                pathname: routes.joinDriverSuccess,
                params: {
                    subTitle: lang({ id: 'your_request_is' }),
                    token: startDriverType ? null : data
                }
            })
            
        }, consts.apiDelay)
        
    }

    return (
        <>
            <View style={{ flex: 1, backgroundColor: colors.white }}>
                <KeyboardAwareScrollView 
                    decelerationRate={'normal'}
                    bottomOffset={150}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={"handled"}
                    disableScrollOnKeyboardHide={Platform.OS === 'ios'}
                >
                    <View style={styles.root} >
                        <View style={{ gap: 11 }}>
                            <Text style={styles.title}>{lang({ id: 'payout_account' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'payout_account_is' })}</Text>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'bank_account_number' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_enter_your_1' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    valid={'number'}
                                    name={'bankNumber'}
                                    state={bankNumber} 
                                    setState={v => setDriverData({ key: 'bankNumber', value: v })}
                                    placeholder={"ex)987654321012"} 
                                    maxLength={50}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'bank_name' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    name={'bank'}
                                    state={bank} 
                                    setState={v => setDriverData({ key: 'bank', value: v })}
                                    placeholder={"ex)US Bank"} 
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'name_on_account' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    name={'bankUser'}
                                    state={bankUser} 
                                    setState={v => setDriverData({ key: 'bankUser', value: v })}
                                    placeholder={"ex)Kim Olivia"} 
                                    maxLength={20}
                                />
                            </View>
                        </View>
                        
                    </View>

                     <View style={styles.bottom} >            
                        <Button style={{ width: 120 }} onPress={submitFunc} load={load} disabled={disabled}>{lang({ id: 'continue' })}</Button>
                    </View>  
                </KeyboardAwareScrollView>
            </View>
         

        </>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingVertical: 20,
            paddingBottom: insets?.bottom + 20,
            gap: 25,
		},
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold,
            letterSpacing: -0.64,
        },
        title2: {
            color: colors.main,
            fontSize: 20,
            fontFamily: fonts.extraBold,
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end',
        },
        bottomMulti: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 30
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15
        },
        itemText: {
            fontSize: 16,
            fontFamily: fonts.medium,
            letterSpacing: -0.32,
            lineHeight: 24,
            color: colors.main
        },

        
        rootAfter: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20
        },
        photo: {
            width: '100%',
            aspectRatio: 3/1.89,
        }
	})

  	return { styles }
}