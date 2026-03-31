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

import Photo from '@/componentsPage/profile/Photo';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import { useUser, useAlert, usePhotoPopup, usePageContext } from '@/libs/store';

import API from '@/libs/api';


const profileDepth = [
    { name: 'photoList', min: 1, max: 4, component: Photo, error: '사진을 최소 1장 등록해 주세요.' },
];

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


    const [ profile, setProfile ] = useState({});
    const [ index, setIndex ] = useState(0);

    useEffect(() => {
        // configOptions?.heightOptions?.[5]
        setProfile(mbData?.userDetail || { photoList: [] });
    }, [mbData])

    useEffect(() => {
        // setProfile({sido: 2, sigungu: 123123});
        // console.log('profile', profile);
        setDisabled(!(profile?.photoList?.length > 3));
    }, [profile])


    const setProfileData = ({ value, name }) => {
        setProfile(prev => ({...prev, [name] : value}));
    }


    const submitFunc = async () => {

        // 내 프로필 저장 API
        // openLoader();
        setLoad(true);

        const sender = profile;

        const { data, error } = await API.post('/v1/user/insertDetail', sender);

        setTimeout(() => {
            setLoad(false);

            if(error) {
                ToastMessage(error?.message);
                return;
            }

            ToastMessage('저장 되었습니다.')
            setContext({
                key: 'agree',
                data: name
            });
    
            router.back();

        }, 1100)
       
    }



    const header = {
        title: '프로필 사진 추가 등록',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    const CurrentComponent = profileDepth?.[index]?.component;
    
    return (
        <Layout header={header} backgroundColor={colors.white}>

            <View style={{ flex: 1 }}>
                <CurrentComponent 
                    name={profileDepth?.[index]?.name} 
                    subName={profileDepth?.[index]?.subName}
                    value={profile?.[profileDepth?.[index]?.name]}
                    subValue={profile?.[profileDepth?.[index]?.subName]}
                    setValue={setProfileData}
                    max={profileDepth?.[index]?.max}
                    style={{ paddingTop: 0, paddingHorizontal: rootStyle.side }}
                    contentContainerStyle={{ paddingTop: 0 }}
                    headerComponent={
                        <View style={[styles.box2, { marginBottom: 20 }]}>
                            <Text style={[rootStyle.font(16, colors.primary, fonts.medium), { lineHeight: 24, letterSpacing: -0.4 }]}>선택 회원에서 1% 회원이 되신 것을 축하드립니다! 🎉</Text>
                            <Text style={[rootStyle.font(14, colors.black, fonts.regular), { lineHeight: 22, letterSpacing: -0.35,  }]}>{`1% 회원은 프로필에 최소 4장의 사진을 추가해야 합니다.`}</Text>
                        </View>
                    }
                />
            </View>
                

            <Button 
                type={'14'} 
                containerStyle={{ borderRadius: 9 }}
                load={load} 
                disabled={disabled}
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
