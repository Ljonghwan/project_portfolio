import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import ListText from '@/components/ListText';
import CheckBox2 from '@/components/CheckBox2';
import EditorView from '@/components/EditorView';

import { useUser, useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage,  } from '@/libs/utils';

export default function Component({
    type=1,
}) {

    const { mbData } = useUser();
    const { configOptions } = useConfig();

    const insets = useSafeAreaInsets();

    const [data, setData] = useState(null);
    const [term, setTerm] = useState(null);

    const [ agree, setAgree ] = useState(false); 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩

    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [load2, setLoad2] = useState(false); // 약관 로딩
    const [disabled, setDisabled] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        setDisabled( !(agree) );
    }, [agree])

    useEffect(() => {
        if(type) {
            dataFunc();
            dataFunc2();
        }
    }, [type])

    const dataFunc = async () => {

        // 주선비용 상품 가져오는 API
        setData({
            title: `주선 비용만 결제되는 금액입니다.` // 주선 비용과 플러팅 1개에\n결제되는 금액입니다.
        })

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }

    const dataFunc2 = async () => {

        let sender = {
            type: 4
        }
        const { data, error } = await API.post('/v1/policy', sender);

        if(error) {
            ToastMessage(error?.message);
            return;
        }
        
        setTerm(data);
       
    }

    const submitFunc = () => {

        // 동의확인, 결제 페이지로 이동

        router.replace({
            pathname: routes.payment,
            params: {
                type: 2,
                idx: data?.idx
            }
        });
    }

    
    return (
        <View style={{ flex: 1 }}>
            {/* {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />} */}
          
            <View style={styles.root }>
                <View style={{ gap: 40 }}>
                    <View style={styles.top}>
                        <View style={{ gap: 24 }}>
                            <Text style={styles.topTitle}>{data?.title}</Text>
                            <View style={[ rootStyle.flex, { gap: 8 }]}>
                                <Image source={images.won_gray} style={[rootStyle.default32]}/>
                                <Text style={styles.topCount}>77,000원</Text>
                            </View>
                        </View>
                    </View>
                 
                    <View style={styles.bottom}>
                        <Text style={[styles.topTitle, { textAlign: 'left' } ]}>환불 약관</Text>

                        {/* <View style={styles.term}>
                            {load2 && ( <Loading entering={false} color={colors.black} style={styles.loader} /> )}
                            <EditorView 
                                content={term?.content}
                                onLoad={() => {
                                    setLoad2(false)
                                }}
                                bottomInit={1}
                            />
                        </View> */}

                        <View style={styles.term}>
                            <ListText style={styles.termText}>주선 비용만 결제하는 상품입니다.</ListText>
                            <ListText style={styles.termText}>리매치에 실패하면 주선 비용은 100% 환불이 가능합니다.</ListText>
                            <ListText style={styles.termText}>
                                {`주선 비용 `}
                                <Text style={[styles.termText, { color: colors.main }]}>[25% 할인]</Text>
                                {` 66,000원으로 결제됩니다.`}
                            </ListText>
                            
                        </View>

                       
                        <CheckBox2
                            fontStyle={styles.check}
                            label={`환불 약관을 확인했으며 동의합니다.`}
                            checked={agree}
                            onCheckedChange={(v) => {
                                setAgree(v)
                            }}
                        />
                    </View>

                </View>
            </View>

            <Button type={'3'} disabled={disabled} onPress={submitFunc} load={load} bottom>결제하기</Button>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        padding: 20,
        paddingTop: 32 
    },
    headerText: {
        paddingHorizontal: 0,
        right: 10,
        color: colors.main
    },
    top: {
        position: 'relative',
        gap: 20
    },
    topTitle: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
        fontFamily: fonts.semiBold,
        color: colors.dark,
        textAlign: 'center'
    },
    topCount: {
        fontSize: 20,
        fontFamily: fonts.medium,
        color: colors.dark
    },

    bottom: {
        gap: 8
    },
    term: {
        backgroundColor: colors.greyF8,
        padding: 12,
        gap: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.greyE,
        overflow: 'hidden'
    },
    termText: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.grey6,
        letterSpacing: -0.35,
    },
    loader: {
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 10000,
        backgroundColor: colors.white
    },
    check: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.dark,
        letterSpacing: -0.35,
        fontFamily: fonts.regular
    },








});
