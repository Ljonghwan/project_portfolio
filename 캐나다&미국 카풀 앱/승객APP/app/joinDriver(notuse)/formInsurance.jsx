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
import InputFileMulti from '@/components/InputFileMulti';

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
    const { driverType, setDriverData } = useDriverData();
    const { openAlertFunc } = useAlert();

    const [ files, setFiles ] = useState([]);
   
    const [ photo, setPhoto ] = useState(null);

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);

    const [ error, setError ] = useState({});

    useEffect(() => {
      
        setDisabled( !(files?.length > 0));

    }, [files])
   
    const submitFunc = async () => {

        setLoad(true);
       
        setDriverData({ key: 'etcImages', value: files });
      
        setTimeout(() => {
            setLoad(false);
            router.push(routes.joinDriverBank);
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
                            <Text style={styles.title}>{lang({ id: 'valid_vehicle_insura' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'please_upload_your' })}</Text>
                        </View>
                        <View style={{ gap: 13 }}>
                            <Text style={styles.title2}>{lang({ id: 'upload_file' })}</Text>
                            <Text style={styles.subTitle}>{lang({ id: 'can_upload_up' })}</Text>

                            <View style={{ gap: 9 }}>
                                <InputFileMulti 
                                    photo={files}
                                    setPhoto={setFiles}
                                    label={lang({ id: 'main_view' })}
                                />
                            </View>
                        </View>
                    </View>
                    
                </KeyboardAwareScrollView>
                <View style={styles.bottom} >            
                    <Button style={{ width: 120 }} onPress={submitFunc} load={load} disabled={disabled}>{lang({ id: 'continue' })}</Button>
                </View>  
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