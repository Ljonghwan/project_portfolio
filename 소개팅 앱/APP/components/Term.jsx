import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Stack, useRouter } from "expo-router";

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Button from '@/components/Button';
import CheckBox from '@/components/CheckBox';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({
    sheetIndex,
    onPress=()=>{}
}) {

    const router = useRouter();

    const [ chkAll, setChkAll ] = useState(false);
    const [ termsAgree, setTermsAgree ] = useState([]);

    const [ test, setTest ] = useState(false);

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
        
        if(sheetIndex < 0) {
            setChkAllFunc(false);
        }

    }, [sheetIndex]);

    useEffect(() => {
        borderColor.value = chkAll ? colors.primary : colors.greyD; 
        opacity.value = withTiming(0, { duration: 0 }, () => {
            opacity.value = withTiming(1, { duration: 300 });
        });
    }, [chkAll])

    useEffect(() => {

        setChkAllFunc(false);

    }, []);

    useEffect(() => {

        (termsAgree?.filter(item => !item.agree && item.require).length < 1) ? setChkAll(true) : setChkAll(false);

    }, [termsAgree]);

    const setChkAllFunc = (value) => {
        
        setTermsAgree(
            consts.terms?.map((x, i) => {
                return {idx: x.idx, require: x.require, agree: value}
            })
        )

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
    return (
        <View style={styles.root}>
            <View style={styles.top}>
                <Text style={styles.title}>{`회원가입을 위해\n약관에 동의해주세요.`}</Text>

                <AnimatedTouchable onPress={() =>{ setChkAllFunc(!chkAll) }} hitSlop={10} style={[styles.checkAll, animatedStyle]}>
                    <Animated.View style={animatedImageStyle}>
                        <Image source={chkAll ? images.check_on : images.check_off} style={rootStyle.check} />
                    </Animated.View>
                    <Text style={styles.checkAllText} >모두 확인했으며 동의합니다.</Text>
                </AnimatedTouchable>
                
                <View style={{ gap: 12, padding: 12 }}>
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
                            />
                        )
                    })}
                </View>
            </View>
            <Button 
                bottom 
                type={'2'} 
                disabled={!chkAll} 
                onPress={() => {
                    onPress( termsAgree?.find(x => x?.idx === 3)?.agree );
                    setChkAllFunc(false);
                }} 
                load={load}
            >
                동의하기
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
    },
    top: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    title: {
        color: colors.dark,
        fontSize: 24,
        fontFamily: fonts.medium,
        lineHeight: 32,
        marginBottom: 20
    },
    checkAll: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: colors.greyD,
        borderRadius: 8,
        gap: 8
    },
    checkAllText: {
        fontSize: 16,
        fontFamily: fonts.semiBold
    }
});
