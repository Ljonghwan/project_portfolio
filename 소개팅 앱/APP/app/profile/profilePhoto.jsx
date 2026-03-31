import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useRouter } from "expo-router";
import { useFonts } from 'expo-font';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Progress from '@/components/Progress';
import Button from '@/components/Button';

import Photo from '@/componentsPage/profile/Photo';

import { useUser, useAlert, useLoader, useConfig } from '@/libs/store';
import routes from '@/libs/routes';
import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import { useBackHandler, ToastMessage } from '@/libs/utils';

import API from '@/libs/api';
import consts from '@/libs/consts';


const profileDepth = [
    { name: 'photoList', min: 1, max: 4, component: Photo, error: '사진을 최소 1장 등록해 주세요.' },
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

    useEffect(() => {
        // configOptions?.heightOptions?.[5]
        setProfile(mbData?.userDetail || { photoList: [] });
    }, [mbData])

    useEffect(() => {
        // setProfile({sido: 2, sigungu: 123123});
        // console.log('profile', profile);

    }, [profile])


    const setProfileData = ({ value, name }) => {
        setProfile(prev => ({...prev, [name] : value}));
    }

    const nextFunc = () => {

        let msg = profileDepth?.[index]?.error || "항목을 선택해주세요.";

        // 여러개 선택가능한 경우
        if(profile?.photoList?.length < profileDepth?.[index]?.min) {
            ToastMessage(msg);
            return;
        }

        submitFunc();
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

            if(mbData?.userDetail) { // 수정인경우
                ToastMessage('저장 되었습니다.')
                reload();
                router.back();
            } else { // 등록인경우
                login({ token });
            }

            // closeLoader();

        }, consts.apiDelay)
    }

    const header = {
        title: "프로필 등록",
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        }
    };

    const CurrentComponent = profileDepth?.[index]?.component;

    return (
        <Layout header={header} statusBar={'dark'} backgroundColor={colors.white}>
            {/* <Progress now={1} max={1}/> */}

            <View style={{ flex: 1, }}>
                <CurrentComponent 
                    name={profileDepth?.[index]?.name} 
                    subName={profileDepth?.[index]?.subName}
                    value={profile?.[profileDepth?.[index]?.name]}
                    subValue={profile?.[profileDepth?.[index]?.subName]}
                    setValue={setProfileData}
                    max={profileDepth?.[index]?.max}
                    style={{ paddingTop: 16 }}
                />
            </View>

            <View style={rootStyle.flex}>
                <Button bottom style={{ flex: 1 }} type={'2'} onPress={nextFunc} load={load}>저장</Button>
            </View>

        </Layout>
    )
}

