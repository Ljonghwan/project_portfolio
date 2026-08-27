import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import CheckBox from '@/components/CheckBox';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, regPhone } from '@/libs/utils';
import fonts from '@/libs/fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { styles } = useStyle();

    const pathname = usePathname();
    const { idx, check } = useLocalSearchParams();

    const [ chkAll, setChkAll ] = useState(false);
    const [ termsAgree, setTermsAgree ] = useState([]);

    const [ load, setLoad ] = useState(false);

    const borderColor = useSharedValue(null);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(borderColor.value, { duration: 300 }),
        };
    });
    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    useEffect(() => {

        setChkAllFunc(false);

    }, []);

    useEffect(() => {
        borderColor.value = chkAll ? colors.primary : colors.greyD; 
        opacity.value = withTiming(0, { duration: 0 }, () => {
            opacity.value = withTiming(1, { duration: 300 });
        });
    }, [chkAll])

    useEffect(() => {

        (termsAgree?.filter(item => !item.agree && item.require).length < 1) ? setChkAll(true) : setChkAll(false);

    }, [termsAgree]);

    useEffect(() => {

        if(idx && check) checkFunc(idx*1, true);

    }, [idx, check])

    const setChkAllFunc = (value) => {
        
        setTermsAgree(
            consts.terms?.map((x, i) => {
                return {idx: x.idx, require: x.require, agree: value}
            })
        )

    }

    const checkFunc = (idx, check) => {
        setTermsAgree(
            termsAgree?.map((x, i) => {
                if(x.idx === idx) return {...x, agree: check};
                return x
            })
        )
    }

    const goTerms = (item) => {

        router.setParams({
            idx: null, 
            check: null
        });
        router.push({
            pathname: routes.terms,
            params: {
                route: pathname,
                idx: item?.idx,
                title: lang({ id: item.title })
            },
        });
    }

    const submitFunc = () => {
        router.replace(routes.joinFormCertification);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <View style={styles.root}>
                <View style={{ gap: 11 }}>
                    <Text style={styles.title}>{lang({ id: 'terms_use' })}</Text>
                    <Text style={styles.subTitle}>{lang({ id: 'please_check_carpool' })}</Text>
                </View>

                <View style={{ gap: 19 }}>
                    <AnimatedTouchable onPress={() =>{ setChkAllFunc(!chkAll) }} hitSlop={10} style={[styles.checkAll, animatedStyle]}>
                        <Animated.View style={animatedImageStyle}>
                            <Image source={chkAll ? images.check_on : images.check_off} style={rootStyle.default} />
                        </Animated.View>
                        <Text style={styles.checkAllText} >{lang({ id: 'agree_all' })}</Text>
                    </AnimatedTouchable>
                    
                    <View style={{ gap: 25 }}>
                        {consts.terms?.map((x, i) => {
                            return (
                                <CheckBox
                                    key={x?.idx}
                                    label={lang({ id: x.title })}
                                    require={x?.require}
                                    subTitle={x?.subTitle || null}
                                    checked={termsAgree?.find(xx => xx?.idx === x?.idx)?.agree}
                                    onCheckedChange={(v) => {
                                        checkFunc(x?.idx, v);
                                    }}
                                    onNav={x?.nav ? () => goTerms(x) : null}
                                />
                            )
                        })}
                    </View>
                </View>
                
            </View>

            <View style={styles.bottom}>
                <Button disabled={!chkAll} style={{ width: 120 }} onPress={submitFunc}>{lang({ id: 'continue' })}</Button>
            </View>
        </View>
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
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        checkAll: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.sub_1,
            gap: 12
        },
        checkAllText: {
            fontSize: 20,
            fontFamily: fonts.extraBold,
            color: colors.main
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end'
        }
	})

  	return { styles }
}