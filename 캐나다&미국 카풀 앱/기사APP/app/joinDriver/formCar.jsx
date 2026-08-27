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
    const { login, pushToken } = useUser();
    const { driverType, carImageMain, carImageFront, carImageSide, carImageRear, carNumber, carType, seater, setDriverData } = useDriverData();
    const { openAlertFunc } = useAlert();

    const [ camera, setCamera ] = useState(false);

    // const [ carImageMain, setCarImageMain ] = useState(null);
    // const [ carImageFront, setCarImageFront ] = useState(null);
    // const [ carImageSide, setCarImageSide ] = useState(null);
    // const [ carImageRear, setCarImageRear ] = useState(null);
    // const [ carNumber, setCarNumber ] = useState("");
    // const [ carType, setCarType ] = useState("");
    // const [ seater, setSeater ] = useState("");

    const [ photo, setPhoto ] = useState(null);

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    const [ error, setError ] = useState({});

    useEffect(() => {
      
        setDisabled( !(carImageMain && carImageFront && carImageSide && carImageRear && carNumber && carType && seater));

    }, [carImageMain, carImageFront, carImageSide, carImageRear, carNumber, carType, seater])
   
    const submitFunc = async () => {

        setLoad(true);
       
        // setDriverData({ key: 'carImageMain', value: carImageMain });
        // setDriverData({ key: 'carImageFront', value: carImageFront });
        // setDriverData({ key: 'carImageSide', value: carImageSide });
        // setDriverData({ key: 'carImageRear', value: carImageRear });
        // setDriverData({ key: 'carNumber', value: carNumber });
        // setDriverData({ key: 'carType', value: carType });
        // setDriverData({ key: 'seater', value: seater });
        
        setTimeout(() => {
            setLoad(false);
            if(driverType === 2) {
                router.push(routes.joinDriverInsurance);
            } else {
                router.push(routes.joinDriverBank);
            }
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
                            <Text style={styles.title}>{lang({ id: 'certification' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_write_down' })}</Text>
                        </View>
                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'vehicle_image' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_include_photo' })}</Text>

                            <View style={{ gap: 9 }}>
                                <View style={{ flexDirection: 'row', gap: 9 }}>
                                    <InputFileCar 
                                        photo={carImageMain}
                                        setPhoto={v => setDriverData({ key: 'carImageMain', value: v })}
                                        label={lang({ id: 'main_view' })}
                                    />
                                    <InputFileCar 
                                        photo={carImageFront}
                                        setPhoto={v => setDriverData({ key: 'carImageFront', value: v })}
                                        label={lang({ id: 'front_view' })}
                                        label2={lang({ id: 'plate_visible' })}
                                    />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 9 }}>
                                    <InputFileCar 
                                        photo={carImageSide}
                                        setPhoto={v => setDriverData({ key: 'carImageSide', value: v })}
                                        label={lang({ id: 'side_view' })}
                                    />
                                    <InputFileCar 
                                        photo={carImageRear}
                                        setPhoto={v => setDriverData({ key: 'carImageRear', value: v })}
                                        label={lang({ id: 'rear_view' })}
                                        label2={lang({ id: 'plate_visible' })}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'license_plate' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_enter_your' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    name={'carNumber'}
                                    state={carNumber} 
                                    setState={v => setDriverData({ key: 'carNumber', value: v })}
                                    placeholder={"ex) JUX304"} 
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'vehicle_type' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    name={'carType'}
                                    state={carType} 
                                    setState={v => setDriverData({ key: 'carType', value: v })}
                                    placeholder={"ex) KIA EV6"} 
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'number_seats' })}</Text>

                            <View style={{ gap: 9 }}>
                               <Input 
                                    valid={'number'}
                                    name={'seater'}
                                    state={seater} 
                                    setState={v => setDriverData({ key: 'seater', value: v })}
                                    placeholder={"ex) 4"} 
                                    maxLength={2}
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