import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';

import { Stack, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import CheckBox from '@/components/CheckBox';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import API from '@/libs/api';

import { ToastMessage, regPhone, randomNumberCreate } from '@/libs/utils';

import { useUser, useAlert, useLoader, useSignData } from '@/libs/store';

export default function Page() {

    const router = useRouter();
    const { styles } = useStyle();
    const { login } = useUser();
    const { setSignData } = useSignData();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();
    
    const [ chkAll, setChkAll ] = useState(false);
    const [ termsAgree, setTermsAgree ] = useState([]);

    const [ load, setLoad ] = useState(false);
    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});

    useEffect(() => {
        // GoogleSignin.configure();
    }, [])


    useEffect(() => {

        setChkAllFunc(false);

    }, []);

    useEffect(() => {

        (termsAgree?.filter(item => !item.agree).length < 1) ? setChkAll(true) : setChkAll(false);
        setDisabled( !(termsAgree?.filter(item => item.agree && item?.require).length >= 3) );

    }, [termsAgree]);

    const setChkAllFunc = (value) => {
        
        setTermsAgree(
            consts.terms?.map((x, i) => {
                return {idx: x.idx, require: x.require, agree: value}
            })
        )

    }

    const submitFunc = () => {

        setLoad(true);

        setSignData({ key: 'marketing', value: termsAgree?.find(x => x?.idx === 3)?.agree });

        setTimeout(() => {
            setLoad(false);
            router.replace(routes.joinIdentity);
        }, 300)
    }

    const goTerms = (item) => {
        router.navigate({
            pathname: routes.terms,
            params: {
                idx: item?.idx,
                title: item?.label
            },
        });
    }

    const header = {
        title: "회원가입",
        
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header} input={true} statusBar={'dark'} >
            <View
                style={styles.root}
            >
                <Text style={styles.title}>{`회원가입을 위해 약관에 동의해 주세요.`}</Text>

                <View style={{ gap: 16 }}>
                    <TouchableOpacity onPress={() =>{ setChkAllFunc(!chkAll) }} hitSlop={10} style={[styles.checkAll]}>
                        <Text style={styles.checkAllText} >전체 동의</Text>
                        <Image source={chkAll ? images.check_on2 : images.check_off} style={rootStyle.check} />
                    </TouchableOpacity>
                    
                    <View style={{ gap: 8, paddingHorizontal: 12 }}>
                        {consts.terms?.map((x, i) => {
                            return (
                                <CheckBox
                                    key={x?.idx}
                                    label={`${x.title}`}
                                    subTitle={x?.subTitle || null}
                                    checked={termsAgree?.find(xx => xx?.idx === x?.idx)?.agree}
                                    onCheckedChange={(v) => {
                                        setTermsAgree(termsAgree?.map((xx, ii) => {
                                            if(xx.idx === x?.idx) return {...xx, agree: v};
                                            return xx
                                        }))
                                    }}
                                    onNav={x?.nav ? () => goTerms(x) : null}
                                    underLine
                                />
                            )
                        })}
                    </View>
                </View>
            </View>

            <Button disabled={disabled} type={'2'} onPress={submitFunc} load={load} bottom>다음</Button>
        </Layout>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            gap: 30
		},
        title: {
            paddingHorizontal: 5,
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.45,
            color: colors.dark,
        },
        checkAll: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        checkAllText: {
            fontSize: 18,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.45,
            color: colors.primary
        }
	})

  	return { styles }
}