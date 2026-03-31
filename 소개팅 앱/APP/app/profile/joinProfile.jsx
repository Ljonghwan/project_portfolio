import { useEffect, useState } from 'react';
import { View, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useRouter } from "expo-router";
import { useFonts } from 'expo-font';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Progress from '@/components/Progress';
import Button from '@/components/Button';
import BottomMultiButton from '@/components/BottomMultiButton';

import Intro from '@/componentsPage/profile/Intro';
import Photo from '@/componentsPage/profile/Photo';
import Style from '@/componentsPage/profile/Style';
import MyStyle from '@/componentsPage/profile/MyStyle';
import ConflictStyle from '@/componentsPage/profile/ConflictStyle';
import LoveStyle from '@/componentsPage/profile/LoveStyle';
import PreferredDate from '@/componentsPage/profile/PreferredDate';
import InLove from '@/componentsPage/profile/InLove';   
import Message from '@/componentsPage/profile/Message';
import Attractive from '@/componentsPage/profile/Attractive';

import { useUser, useAlert, useLoader, useConfig } from '@/libs/store';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import { useBackHandler, ToastMessage } from '@/libs/utils';

import API from '@/libs/api';
import images from '@/libs/images';
import consts from '@/libs/consts';


const profileDepth = [
    { name: 'intro', component: Intro },

    { name: 'photoList', min: 1, max: 4, component: Photo, error: '사진을 최소 1장 등록해 주세요.'},

    { name: 'style', component: Style },
    { name: 'myStyle', component: MyStyle },
    { name: 'conflictStyle', component: ConflictStyle },
    { name: 'loveStyle', component: LoveStyle },

    { name: 'preferredDate', component: PreferredDate, mode: 'text', error: '내용을 입력해 주세요.' },
    { name: 'inLove', component: InLove, mode: 'text', error: '내용을 입력해 주세요.' },
    { name: 'message', component: Message, mode: 'text', error: '내용을 입력해 주세요.' },
    { name: 'attractive', component: Attractive, mode: 'text', error: '내용을 입력해 주세요.' },
    

    // { name: 'sido', subName: 'sigungu', component: Sido },
    // { name: 'height',  component: Height, defaultValue: 5 },
    // { name: 'job',  component: Job },
    // { name: 'score',  component: Score, defaultValue: 2 },
    // // { name: 'body',  component: Body },
    // { name: 'mbti',  component: Mbti },
    // { name: 'types', min: 3, max: 3, component: Type },
    // { name: 'interests', min: 3, max: 3, component: Interest },
    // { name: 'smoke',  component: Smoke },
    // { name: 'drink',  component: Drink },
    // { name: 'religion',  component: Religion },
    // { name: 'preferredDates', min: 3, max: 3, component: PreferredDate },
    // { name: 'joinType',  component: JoinType },
];

export default function Page() {

    const router = useRouter();
	const insets = useSafeAreaInsets();

    const { token, mbData, login, logout, reload } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    const { configOptions } = useConfig();

    const [ profile, setProfile ] = useState({});
    const [ index, setIndex ] = useState(0);

    const [ load, setLoad ] = useState(false);

    useBackHandler(() => {
        cancelFunc();
        return true;
    });

    useEffect(() => {
        // configOptions?.heightOptions?.[5]
        setProfile(mbData?.userDetail || { photoList: [] });
    }, [mbData])

    useEffect(() => {
        // setProfile({sido: 2, sigungu: 123123});
        // console.log('profile', profile);

    }, [profile])

    const cancelFunc = () => {
        openAlertFunc({
            icon: images.warning,
            iconStyle: {
                width: 36,
                height: 36,
            },
            label: '프로필 등록을 취소하시겠어요?',
            title: mbData?.userDetail ? `프로필 수정 진행중입니다.\n수정을 취소하시겠습니까?` : `프로필 등록 진행중입니다.\n서비스 이용을 위해 프로필 등록이 필요합니다.\n다음에 다시 등록하시겠습니까?`,
            onCencleText: "계속 할게요",
            onPressText: "취소하기",
            onCencle: () => {},
            onPress: () => {
                mbData?.userDetail ? router.back() : logout();
            }
        })
    }

    const setProfileData = ({ value, name }) => {
        setProfile(prev => ({...prev, [name] : value}));
    }

    const prevFunc = () => {

        if(index < 1) {
            cancelFunc();
        } else {
            setIndex(prev => prev - 1 );

            // if(!mbData?.userDetail) {
            //     setProfile(prev => ({
            //         ...prev, 
            //         [ profileDepth?.[index]?.name ] : profileDepth?.[index]?.defaultValue || null,
            //         [ profileDepth?.[index]?.subName ] : profileDepth?.[index]?.defaultValue || null,
            //     }));
            // }
        }
    }
    const nextFunc = () => {
        Keyboard.dismiss();

        if(index === 0) {
            setIndex(prev => prev + 1 );
            return;
        } 

        if(load) return;
        setLoad(true);

        
        let msg = profileDepth?.[index]?.error || "항목을 선택해주세요.";
        // 여러개 선택가능한 경우
        if(profileDepth?.[index]?.min && profile?.[profileDepth?.[index]?.name]?.length < profileDepth?.[index]?.min) {
            ToastMessage(msg);
            setLoad(false);
            return;
        }
        
        if(!profileDepth?.[index]?.min && !profile?.[profileDepth?.[index]?.name]?.trim()) {
            ToastMessage(msg);
            setLoad(false);
            return;
        }

        // 마지막이면
        if(!profileDepth?.[index + 1]) {
            submitFunc();
        } else {
            setIndex(prev => prev + 1 )
        }
        
        setTimeout(() => {
            setLoad(false);
        }, consts.apiDelay)
    }

    const submitFunc = async () => {
        // 내 프로필 저장 API
        openLoader();

        const sender = profile;

        const { data, error } = await API.post('/v1/user/insertDetail', sender);

        setTimeout(() => {
            if(error) {
                ToastMessage(error?.message);
                return;
            }

            if(mbData?.userDetail) { // 수정인경우
                ToastMessage('저장 되었습니다.')
                reload();
                router.back();
            } else { // 등록인경우
                router.replace(routes.joinProfileSuccess);
            }

            closeLoader();

        }, consts.apiDelay)
    }

    const header = {
        title: "프로필 등록",
        left: {
            icon: 'back',
            onPress: cancelFunc
        },
        right: {
            text: '취소',
            onPress: cancelFunc
        },
    };

    const CurrentComponent = profileDepth?.[index]?.component;

    return (
        <Layout header={header} statusBar={'dark'} backgroundColor={colors.white} input={profileDepth?.[index]?.mode === 'text'}>
            {index > 0 && <Progress now={index} max={profileDepth?.length - 1}/>}

            <View style={{ flex: 1 }}>
                <CurrentComponent 
                    name={profileDepth?.[index]?.name} 
                    subName={profileDepth?.[index]?.subName}
                    value={profile?.[profileDepth?.[index]?.name]}
                    subValue={profile?.[profileDepth?.[index]?.subName]}
                    setValue={setProfileData}
                    max={profileDepth?.[index]?.max}
                />
            </View>

            <BottomMultiButton>
                {index > 0 && ( <Button style={{ flex: 1 }} type={'4'} onPress={prevFunc}>이전</Button> )}
                <Button style={{ flex: 1 }} type={'2'} onPress={nextFunc}>다음</Button>
            </BottomMultiButton>

        </Layout>
    )
}

