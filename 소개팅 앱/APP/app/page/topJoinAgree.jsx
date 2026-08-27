import React, {useRef, useState, useEffect} from 'react';
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

import { router } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ToastMessage, regName, regPhone, regPassword, useBackHandler } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import CheckBox2 from '@/components/CheckBox2';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import EditorView from '@/components/EditorView';
import Button from '@/components/Button';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useUser, useAlert, usePageContext } from '@/libs/store';

export default function Page({  }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const { token, mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { context, setContext } = usePageContext();

    const [ agrees, setAgrees ] = useState({
        guide: false,
        tip: false,
        etc: false,
        term: false,
        profile: false,
    }); 

    const [ item, setItem ] = useState(null); 
    const [ agree, setAgree ] = useState(false); 

    const [ item2, setItem2 ] = useState(null); 
    const [ agree2, setAgree2 ] = useState(false); 

    const [disabled, setDisabled] = useState(false); 
    const [load, setLoad] = useState(true); // 데이터 추가 로딩
    const [load2, setLoad2] = useState(true); // 데이터 추가 로딩

    const [loadButton, setLoadButton] = useState(false); 

    useEffect(() => {
        if (!context?.key) return;

        if (context?.key === 'agree') {
            setAgrees(prev => ({
                ...prev,
                [context?.data]: true,
            }));
        }

        setContext(null);

    }, [context])


    useEffect(() => {
        setDisabled( !(Object.values(agrees).every(v => v)) );
    }, [agrees])

    useEffect(() => {

        openAlertFunc({
            // icon: images.alert_info,
            // badge: true,
            label: `🎉\n\n1% 회원이 되신 것을 축하합니다!`,
            title: "1% 회원으로서 안내 가이드와\n사전 동의 항목들을 확인해 주세요.",
            onPressText: "확인하기",
            onCencle: () => {
            },
            onPress: () => {
            }
        })

        // openAlertFunc({
        //     badge: true,
        //     label: `비주얼 회원이 되신 것을\n축하합니다!`,
        //     title: `비주얼 회원으로서\n안내 가이드와 사전동의를\n확인해 주세요.`,
        //     onPressText: "확인하기",
        //     onCencle: () => {
        //     },
        //     onPress: () => {
        //     }
        // });


    }, []);


    const submitFunc = async () => {

        if(loadButton) return;

        // 동의 API
        setLoadButton(true);
        
        const { data, error } = API.post('/v1/user/checkVisual');

        setTimeout(() => {
            setLoadButton(false);
            
            if(error) {
                ToastMessage(error?.message);
                return;
            }
            
            router.prefetch(routes.tabs);
            
            openAlertFunc({
                // icon: images.alert_info,
                // badge: true,
                label: `🎉\n\n1% 회원이 되신 것을 축하합니다!`,
                onPressText: "확인하기",
                onEnd: () => {
                    router.replace({
                        pathname: routes.tabs
                    });
                },
            })

        }, [consts.apiDelay])
        
    }


    const header = {
        title: '1% 회원 안내 가이드',
        titleStyle: {
            fontSize: 18,
        },
        titleIcon: {
            icon: 'logo2',
            style: {
                width: 36,
                height: 36,
            },
        },
    };


    return (
        <Layout header={header}>

            <View style={styles.root}>

                <CheckBox2
                    label={`사소한 소개팅 이용 가이드`}
                    style={{ padding: 20 }}
                    checked={agrees?.guide}
                    onNav={() => {
                        router.navigate({
                            pathname: routes.topAgreeGuide,
                            params: {
                                name: 'guide'
                            }
                        })
                    }}
                />
                <CheckBox2
                    label={`유의사항 / 이용팁`}
                    style={{ padding: 20 }}
                    checked={agrees?.tip}
                    onNav={() => {
                        router.navigate({
                            pathname: routes.topAgreeTip,
                            params: {
                                name: 'tip'
                            }
                        })
                    }}
                />
                <CheckBox2
                    label={`면책 및 기타 안내사항`}
                    style={{ padding: 20 }}
                    checked={agrees?.etc}
                    onNav={() => {
                        router.navigate({
                            pathname: routes.topAgreeEtc,
                            params: {
                                name: 'etc'
                            }
                        })
                    }}
                />
                <CheckBox2
                    label={`사전 동의 및 약관`}
                    style={{ padding: 20 }}
                    checked={agrees?.term}
                    onNav={() => {
                        router.navigate({
                            pathname: routes.topAgreeTerm,
                            params: {
                                name: 'term'
                            }
                        })
                    }}
                />

                <CheckBox2
                    label={`프로필 사진 등록`}
                    style={{ padding: 20 }}
                    checked={agrees?.profile}
                    onNav={() => {
                        router.navigate({
                            pathname: routes.topAgreeProfile,
                            params: {
                                name: 'profile'
                            }
                        })
                    }}
                />
                
            </View>

            <Button type={'14'} disabled={disabled} onPress={submitFunc} bottom load={loadButton} containerStyle={{ borderRadius: 9 }}>확인</Button>

        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: rootStyle.side,
        },





        termBox: {
            gap: 8
        },
        title: {
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold
        },
        term: {
            height: height / 4,
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyE,
            overflow: 'hidden'
        },
        check: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35,
            fontFamily: fonts.regular
        },
        loader: {
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 10000,
            backgroundColor: colors.white
        }
    })
  
    return { styles }
}
